package com.rezaul.reactnativeprinterkit

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.IBinder
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.rezaul.printerkit.BluetoothPermissions
import com.rezaul.printerkit.BluetoothPrinter
import com.rezaul.printerkit.BluetoothPrinterDevice
import com.rezaul.printerkit.BluetoothPrinterService
import com.rezaul.printerkit.PrinterImageType
import java.util.concurrent.Executors

/**
 * Bridges [com.rezaul.printerkit.BluetoothPrinter] to React Native.
 *
 * Connect/print calls run through a bound [BluetoothPrinterService] (started once,
 * on module init) instead of a bare [BluetoothPrinter], so the connection survives
 * the app being swiped away from Recents - see [BluetoothPrinterService]. Calls made
 * before the service finishes binding (essentially instant, but not synchronous) are
 * queued and run once it connects.
 *
 * All blocking Bluetooth/PDF/image I/O runs on a single background executor, off the
 * calling (JS) thread - also serializing printer writes, since concurrent writes to
 * the same socket from two overlapping calls would corrupt the output.
 */
class ReactNativePrinterKitModule(reactContext: ReactApplicationContext) :
  NativeReactNativePrinterKitSpec(reactContext) {

  private val executor = Executors.newSingleThreadExecutor()

  // getBondedBluetoothPrinters() is synchronous (no connection involved) and must
  // answer immediately, so it uses its own plain BluetoothPrinter rather than
  // waiting on the service to bind.
  private val standalonePrinter by lazy { BluetoothPrinter(reactApplicationContext) }

  private var printerService: BluetoothPrinterService? = null
  private val pendingActions = mutableListOf<(BluetoothPrinterService) -> Unit>()

  private val serviceConnection = object : ServiceConnection {
    override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
      val service = (binder as BluetoothPrinterService.LocalBinder).getService()
      printerService = service
      val queued = synchronized(pendingActions) {
        val copy = pendingActions.toList()
        pendingActions.clear()
        copy
      }
      queued.forEach { it(service) }
    }

    override fun onServiceDisconnected(name: ComponentName?) {
      printerService = null
    }
  }

  init {
    val intent = Intent(reactApplicationContext, BluetoothPrinterService::class.java)
    reactApplicationContext.startService(intent)
    reactApplicationContext.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
  }

  /** Runs [action] with the bound service, once available (queued if not yet bound). */
  private fun withService(action: (BluetoothPrinterService) -> Unit) {
    val service = printerService
    if (service != null) {
      action(service)
    } else {
      synchronized(pendingActions) { pendingActions.add(action) }
    }
  }

  private fun deviceToMap(device: BluetoothPrinterDevice): WritableMap {
    val map = Arguments.createMap()
    map.putString("name", device.name)
    map.putString("address", device.address)
    return map
  }

  override fun hasBluetoothPermission(): Boolean {
    return BluetoothPermissions.isGranted(reactApplicationContext)
  }

  override fun requestBluetoothPermission(promise: Promise) {
    // getRequiredPermissions() can list more than one permission (BLUETOOTH_CONNECT
    // and, on Android 13+, POST_NOTIFICATIONS for the foreground service's ongoing
    // notification) - request every one of them, not just check isGranted(), which
    // only reflects BLUETOOTH_CONNECT and would otherwise skip requesting the rest.
    val required = BluetoothPermissions.getRequiredPermissions()
    val alreadyGranted = required.all {
      ContextCompat.checkSelfPermission(reactApplicationContext, it) == PackageManager.PERMISSION_GRANTED
    }
    if (required.isEmpty() || alreadyGranted) {
      promise.resolve(true)
      return
    }
    val activity = currentActivity as? PermissionAwareActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No current activity to request permission from")
      return
    }
    activity.requestPermissions(required, PERMISSION_REQUEST_CODE) { requestCode, permissions, grantResults ->
      if (requestCode == PERMISSION_REQUEST_CODE) {
        promise.resolve(BluetoothPermissions.isGrantResult(requestCode, permissions, grantResults, PERMISSION_REQUEST_CODE))
        true
      } else {
        false
      }
    }
  }

  override fun getBondedBluetoothPrinters(): WritableArray {
    val result: WritableArray = Arguments.createArray()
    standalonePrinter.getBondedBluetoothPrinters().forEach { device ->
      result.pushMap(deviceToMap(device))
    }
    return result
  }

  override fun connectPrinter(address: String, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          promise.resolve(service.connectAndKeepAlive(address))
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun disconnectPrinter(promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          service.disconnect()
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun isConnectedPrinter(promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          promise.resolve(service.printer.isConnectedPrinter())
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun getConnectedPrinter(promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          val device = service.printer.getConnectedPrinter()
          promise.resolve(device?.let { deviceToMap(it) })
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printText(text: String, feedLines: Double?, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          service.printer.printText(text, (feedLines ?: 3.0).toInt())
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printImage(imagePath: String, printerWidthDots: Double?, feedLines: Double?, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          service.printer.printImageFile(imagePath, (printerWidthDots ?: 384.0).toInt(), (feedLines ?: 3.0).toInt())
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printImageBase64(base64: String, printerWidthDots: Double?, feedLines: Double?, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          service.printer.printImageBase64(base64, (printerWidthDots ?: 384.0).toInt(), (feedLines ?: 3.0).toInt())
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun pdfToImage(pdfPath: String, imageType: String?, page: Double?, targetWidthPx: Double?, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          val type = if (imageType == "JPEG") PrinterImageType.JPEG else PrinterImageType.PNG
          val path = service.printer.pdfToImage(pdfPath, type, (page ?: 0.0).toInt(), targetWidthPx?.toInt())
          promise.resolve(path)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printPdf(pdfPath: String, printerWidthDots: Double?, page: Double?, feedLines: Double?, promise: Promise) {
    withService { service ->
      executor.execute {
        try {
          service.printer.printPdf(pdfPath, (printerWidthDots ?: 384.0).toInt(), (page ?: 0.0).toInt(), (feedLines ?: 3.0).toInt())
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun htmlToPdf(html: String, pageWidthDp: Double?, heightDp: Double?, minPageHeightDp: Double?, promise: Promise) {
    withService { service ->
      service.printer.htmlToPdf(
        html = html,
        pageWidthDp = (pageWidthDp ?: 412.0).toInt(),
        heightDp = heightDp?.toInt(),
        minPageHeightDp = (minPageHeightDp ?: 1000.0).toInt()
      ) { path ->
        promise.resolve(path)
      }
    }
  }

  override fun printHtml(
    html: String,
    printerWidthDots: Double?,
    pageWidthDp: Double?,
    heightDp: Double?,
    minPageHeightDp: Double?,
    promise: Promise
  ) {
    withService { service ->
      service.printer.printHtml(
        html = html,
        printerWidthDots = (printerWidthDots ?: 384.0).toInt(),
        pageWidthDp = (pageWidthDp ?: 412.0).toInt(),
        heightDp = heightDp?.toInt(),
        minPageHeightDp = (minPageHeightDp ?: 1000.0).toInt()
      ) { ok ->
        promise.resolve(ok)
      }
    }
  }

  companion object {
    const val NAME = NativeReactNativePrinterKitSpec.NAME
    private const val PERMISSION_REQUEST_CODE = 4201
  }
}
