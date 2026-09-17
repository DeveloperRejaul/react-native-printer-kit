"use strict";

import ReactNativePrinterKit from "./NativeReactNativePrinterKit.js";

/**
 * Whether Bluetooth permission is already granted (always true below Android 12).
 */
export function hasBluetoothPermission() {
  return ReactNativePrinterKit.hasBluetoothPermission();
}

/**
 * Shows the system permission dialog if needed, and resolves with the result.
 */
export function requestBluetoothPermission() {
  return ReactNativePrinterKit.requestBluetoothPermission();
}

/**
 * Get all Bluetooth devices already paired (bonded) with this device.
 */
export function getBondedBluetoothPrinters() {
  return ReactNativePrinterKit.getBondedBluetoothPrinters();
}

/**
 * Connect to a paired Bluetooth printer by its MAC address. The connection
 * survives the app being swiped from Recents, and is reconnected to
 * automatically the next time the app starts.
 */
export function connectPrinter(params) {
  return ReactNativePrinterKit.connectPrinter(params);
}

/**
 * Disconnect from the current printer.
 */
export function disconnectPrinter() {
  return ReactNativePrinterKit.disconnectPrinter();
}

/**
 * Check if a printer is currently connected.
 */
export function isConnectedPrinter() {
  return ReactNativePrinterKit.isConnectedPrinter();
}

/**
 * Get the currently connected printer, if any.
 */
export function getConnectedPrinter() {
  return ReactNativePrinterKit.getConnectedPrinter();
}

/**
 * Print raw text using the printer's built-in font (ASCII only - use
 * printHtml() for Bangla or other non-Latin scripts).
 */
export function printText(params) {
  return ReactNativePrinterKit.printText(params);
}

/**
 * Print an image file as an ESC/POS raster image.
 * `printerWidthDots`: 384 for 58mm printers, 576 for 80mm printers (default 384).
 */
export function printImage(params) {
  return ReactNativePrinterKit.printImage(params);
}

/**
 * Print a base64-encoded image as an ESC/POS raster image.
 */
export function printImageBase64(params) {
  return ReactNativePrinterKit.printImageBase64(params);
}

/**
 * Render a page of a PDF file to an image file. Returns the image path.
 */
export function pdfToImage(params) {
  return ReactNativePrinterKit.pdfToImage(params);
}

/**
 * Render a page of a PDF to an image, then print it.
 */
export function printPdf(params) {
  return ReactNativePrinterKit.printPdf(params);
}

/**
 * Render HTML to a PDF file and return its path, or null on failure. See
 * NativeReactNativePrinterKit's Spec for what pageWidthDp/heightDp/minPageHeightDp control.
 */
export function htmlToPdf(params) {
  return ReactNativePrinterKit.htmlToPdf(params);
}

/**
 * Full pipeline: render HTML to PDF, then print it - the way to print Bangla
 * (or other non-Latin) text or any real HTML/CSS layout.
 */
export function printHtml(params) {
  return ReactNativePrinterKit.printHtml(params);
}

// Export types

// Export native module
export default ReactNativePrinterKit;
//# sourceMappingURL=index.js.map