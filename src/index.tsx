import ReactNativePrinterKit, {
  type BluetoothPrinterDevice,
  type ConnectPrinterParams,
  type GetBondedPrintersParams,
  type HtmlToPdfParams,
  type OpenFileParams,
  type PdfToImageParams,
  type PrinterStatus,
  type PrinterStatusParams,
  type PrintHtmlParams,
  type PrintImageBase64Params,
  type PrintImageParams,
  type PrintPdfParams,
  type PrintTextParams,
  type SaveFileParams,
  type SaveFileResult,
  type UsbDeviceParams,
  type UsbPrinterDevice,
} from './NativeReactNativePrinterKit';

/**
 * Whether the device's Bluetooth adapter itself is turned on. Needs no runtime
 * permission - check this before `hasBluetoothPermission`/`requestBluetoothPermission`.
 */
export function isBluetoothEnabled(): boolean {
  return ReactNativePrinterKit.isBluetoothEnabled();
}

/**
 * Whether Bluetooth permission is already granted (always true below Android 12).
 */
export function hasBluetoothPermission(): boolean {
  return ReactNativePrinterKit.hasBluetoothPermission();
}

/**
 * Shows the system permission dialog if needed, and resolves with the result.
 */
export function requestBluetoothPermission(): Promise<boolean> {
  return ReactNativePrinterKit.requestBluetoothPermission();
}

/**
 * Get the Bluetooth devices already paired (bonded) with this device, best printer
 * matches first. Every device carries a `confidence`. Pass
 * `{ filter: 'LIKELY_PRINTERS' }` to hide devices that do not look like printers
 * (headphones, watches...), or `extraNameKeywords` for a printer with an unusual name.
 */
export function getBondedBluetoothPrinters(
  params: GetBondedPrintersParams = {}
): BluetoothPrinterDevice[] {
  return ReactNativePrinterKit.getBondedBluetoothPrinters(params);
}

/**
 * USB printers currently plugged in. Needs a phone with USB host (OTG).
 */
export function getUsbPrinters(): UsbPrinterDevice[] {
  return ReactNativePrinterKit.getUsbPrinters();
}

/**
 * Whether the user already granted this app access to that USB printer.
 */
export function hasUsbPermission(params: UsbDeviceParams): boolean {
  return ReactNativePrinterKit.hasUsbPermission(params);
}

/**
 * Shows the system USB permission dialog. Call before `connectPrinter` with
 * `type: 'USB'`. The grant is lost when the app is reinstalled.
 */
export function requestUsbPermission(
  params: UsbDeviceParams
): Promise<boolean> {
  return ReactNativePrinterKit.requestUsbPermission(params);
}

/**
 * Connect to a printer over Bluetooth (default; paired printer's MAC address),
 * Wi-Fi/LAN (`type: 'NETWORK'`, `address` = IP) or USB (`type: 'USB'` with
 * `vendorId`/`productId`). The connection survives the app being swiped from
 * Recents, and is reconnected to automatically the next time the app starts.
 * Resolves `false` if it could not connect.
 */
export function connectPrinter(params: ConnectPrinterParams): Promise<boolean> {
  return ReactNativePrinterKit.connectPrinter(params);
}

/**
 * Disconnect from the current printer.
 */
export function disconnectPrinter(): Promise<void> {
  return ReactNativePrinterKit.disconnectPrinter();
}

/**
 * Check if a printer is currently connected.
 */
export function isConnectedPrinter(): Promise<boolean> {
  return ReactNativePrinterKit.isConnectedPrinter();
}

/**
 * Get the currently connected printer, if any.
 */
export function getConnectedPrinter(): Promise<BluetoothPrinterDevice | null> {
  return ReactNativePrinterKit.getConnectedPrinter();
}

/**
 * Whether a printer is connected and currently accepts data. Does not check
 * paper or cover - use `getPrinterStatus()`.
 */
export function isPrinterReady(): Promise<boolean> {
  return ReactNativePrinterKit.isPrinterReady();
}

/**
 * Asks the printer for its state (online / paper out / cover open / error).
 * Many printers do not answer: then `responded` is `false` and the other fields
 * are `null` (unknown, not "ok"). Some printers report an open cover as
 * `paperOut`, so treat `paperOut: true` as "no paper or cover open".
 */
export function getPrinterStatus(
  params: PrinterStatusParams = {}
): Promise<PrinterStatus> {
  return ReactNativePrinterKit.getPrinterStatus(params);
}

/**
 * Prints a short ASCII test page.
 */
export function printTestPage(): Promise<void> {
  return ReactNativePrinterKit.printTestPage();
}

/**
 * Copies a file (e.g. the PDF from `htmlToPdf`) to cache, app storage, public
 * Downloads/Documents or a chosen folder. Never rejects: check `result.success`.
 */
export function saveFile(params: SaveFileParams): Promise<SaveFileResult> {
  return ReactNativePrinterKit.saveFile(params);
}

/**
 * Print raw text using the printer's built-in font (ASCII only - use
 * printHtml() for Bangla or other non-Latin scripts).
 */
export function printText(params: PrintTextParams): Promise<void> {
  return ReactNativePrinterKit.printText(params);
}

/**
 * Print an image file as an ESC/POS raster image.
 * `printerWidthDots`: 384 for 58mm printers, 576 for 80mm printers (default 384).
 */
export function printImage(params: PrintImageParams): Promise<void> {
  return ReactNativePrinterKit.printImage(params);
}

/**
 * Print a base64-encoded image as an ESC/POS raster image.
 */
export function printImageBase64(
  params: PrintImageBase64Params
): Promise<void> {
  return ReactNativePrinterKit.printImageBase64(params);
}

/**
 * Render a page of a PDF file to an image file. Returns the image path.
 */
export function pdfToImage(params: PdfToImageParams): Promise<string> {
  return ReactNativePrinterKit.pdfToImage(params);
}

/**
 * Render a page of a PDF to an image, then print it.
 */
export function printPdf(params: PrintPdfParams): Promise<void> {
  return ReactNativePrinterKit.printPdf(params);
}

/**
 * Render HTML to a PDF file and return its path, or null on failure. See
 * NativeReactNativePrinterKit's Spec for what pageWidthDp/heightDp/minPageHeightDp control.
 */
export function htmlToPdf(params: HtmlToPdfParams): Promise<string | null> {
  return ReactNativePrinterKit.htmlToPdf(params);
}

/**
 * Full pipeline: render HTML to PDF, then print it - the way to print Bangla
 * (or other non-Latin) text or any real HTML/CSS layout.
 */
export function printHtml(params: PrintHtmlParams): Promise<boolean> {
  return ReactNativePrinterKit.printHtml(params);
}

/**
 * Opens a file with whatever app the user has installed that can handle its
 * type (e.g. a PDF viewer) - shows the system's "Open with" chooser if more
 * than one app matches. Returns false if the file doesn't exist or no app
 * can open it.
 */
export function openFile(params: OpenFileParams): boolean {
  return ReactNativePrinterKit.openFile(params);
}

// Export enum-like constants (usable at runtime, and as types of the same name)
export {
  FileLocation,
  PrinterConfidence,
  PrinterConnectionType,
  PrinterFilter,
  PrinterImageType,
} from './enums';

// Export types
export type {
  BluetoothPrinterDevice,
  ConnectPrinterParams,
  GetBondedPrintersParams,
  HtmlToPdfParams,
  OpenFileParams,
  PdfToImageParams,
  PrinterStatus,
  PrinterStatusParams,
  PrintHtmlParams,
  PrintImageBase64Params,
  PrintImageParams,
  PrintPdfParams,
  PrintTextParams,
  SaveFileParams,
  SaveFileResult,
  UsbDeviceParams,
  UsbPrinterDevice,
};

// Export native module
export default ReactNativePrinterKit;
