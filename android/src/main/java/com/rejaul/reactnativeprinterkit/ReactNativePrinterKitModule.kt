package com.rejaul.reactnativeprinterkit

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
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.rezaul.printerkit.BluetoothPermissions
import com.rezaul.printerkit.BluetoothPrinter
import com.rezaul.printerkit.BluetoothPrinterDevice
import com.rezaul.printerkit.BluetoothPrinterService
import com.rezaul.printerkit.ConnectPrinterParams
import com.rezaul.printerkit.HtmlToPdfParams
import com.rezaul.printerkit.PdfToImageParams
import com.rezaul.printerkit.PrintHtmlParams
import com.rezaul.printerkit.PrintImageBase64Params
import com.rezaul.printerkit.PrintImageFileParams
import com.rezaul.printerkit.PrintPdfParams
import com.rezaul.printerkit.PrinterImageType
import com.rezaul.printerkit.PrintTextParams
import java.util.concurrent.Executors

/** Reads an optional numeric field, falling back to [default] if absent/null. */
private fun ReadableMap.optInt(key: String, default: Int): Int =
  if (hasKey(key) && !isNull(key)) getDouble(key).toInt() else default

/** Reads an optional numeric field, or null if absent/null. */
private fun ReadableMap.optIntOrNull(key: String): Int? =
  if (hasKey(key) && !isNull(key)) getDouble(key).toInt() else null

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
 *
 * Every JS-facing method that takes data receives a single [ReadableMap] (the object
 * param the TS Spec declares), matching [com.rezaul.printerkit.BluetoothPrinter]'s own
 * single-params-object functions on the native side.
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

  override fun connectPrinter(params: ReadableMap, promise: Promise) {
    val address = params.getString("address")
    if (address == null) {
      promise.reject("ERROR", "address is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          promise.resolve(service.connectAndKeepAlive(ConnectPrinterParams(address)))
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

  override fun printText(params: ReadableMap, promise: Promise) {
    val text = params.getString("text")
    if (text == null) {
      promise.reject("ERROR", "text is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          service.printer.printText(PrintTextParams(text, params.optInt("feedLines", 3)))
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printImage(params: ReadableMap, promise: Promise) {
    val imagePath = params.getString("imagePath")
    if (imagePath == null) {
      promise.reject("ERROR", "imagePath is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          service.printer.printImageFile(
            PrintImageFileParams(
              imagePath = imagePath,
              printerWidthDots = params.optInt("printerWidthDots", 384),
              feedLines = params.optInt("feedLines", 3)
            )
          )
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printImageBase64(params: ReadableMap, promise: Promise) {
    val base64 = params.getString("base64")
    if (base64 == null) {
      promise.reject("ERROR", "base64 is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          service.printer.printImageBase64(
            PrintImageBase64Params(
              base64 = base64,
              printerWidthDots = params.optInt("printerWidthDots", 384),
              feedLines = params.optInt("feedLines", 3)
            )
          )
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun pdfToImage(params: ReadableMap, promise: Promise) {
    val pdfPath = params.getString("pdfPath")
    if (pdfPath == null) {
      promise.reject("ERROR", "pdfPath is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          val imageType = if (params.getString("imageType") == "JPEG") {
            PrinterImageType.JPEG
          } else {
            PrinterImageType.PNG
          }
          val path = service.printer.pdfToImage(
            PdfToImageParams(
              pdfPath = pdfPath,
              imageType = imageType,
              page = params.optInt("page", 0),
              targetWidthPx = params.optIntOrNull("targetWidthPx")
            )
          )
          promise.resolve(path)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun printPdf(params: ReadableMap, promise: Promise) {
    val pdfPath = params.getString("pdfPath")
    if (pdfPath == null) {
      promise.reject("ERROR", "pdfPath is required")
      return
    }
    withService { service ->
      executor.execute {
        try {
          service.printer.printPdf(
            PrintPdfParams(
              pdfPath = pdfPath,
              printerWidthDots = params.optInt("printerWidthDots", 384),
              page = params.optInt("page", 0),
              feedLines = params.optInt("feedLines", 3)
            )
          )
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("ERROR", e.message)
        }
      }
    }
  }

  override fun htmlToPdf(params: ReadableMap, promise: Promise) {
    val html = params.getString("html")
    if (html == null) {
      promise.reject("ERROR", "html is required")
      return
    }
    withService { service ->
      service.printer.htmlToPdf(
        HtmlToPdfParams(
          html = html,
          pageWidthDp = params.optInt("pageWidthDp", 412),
          heightDp = params.optIntOrNull("heightDp"),
          minPageHeightDp = params.optInt("minPageHeightDp", 1000)
        )
      ) { path ->
        promise.resolve(path)
      }
    }
  }

  override fun printHtml(params: ReadableMap, promise: Promise) {
    val html = params.getString("html")
    if (html == null) {
      promise.reject("ERROR", "html is required")
      return
    }
    withService { service ->
      service.printer.printHtml(
        PrintHtmlParams(
          html = html,
          printerWidthDots = params.optInt("printerWidthDots", 384),
          pageWidthDp = params.optInt("pageWidthDp", 412),
          heightDp = params.optIntOrNull("heightDp"),
          minPageHeightDp = params.optInt("minPageHeightDp", 1000)
        )
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
