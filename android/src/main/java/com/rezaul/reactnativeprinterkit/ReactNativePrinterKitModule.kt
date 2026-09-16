package com.rezaul.reactnativeprinterkit

import com.facebook.react.bridge.ReactApplicationContext

class ReactNativePrinterKitModule(reactContext: ReactApplicationContext) :
  NativeReactNativePrinterKitSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeReactNativePrinterKitSpec.NAME
  }
}
