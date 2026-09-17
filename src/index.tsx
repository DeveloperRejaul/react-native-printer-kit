import ReactNativePrinterKit, {
  type BluetoothPrinterDevice,
  type ConnectPrinterParams,
  type HtmlToPdfParams,
  type PdfToImageParams,
  type PrinterImageType,
  type PrintHtmlParams,
  type PrintImageBase64Params,
  type PrintImageParams,
  type PrintPdfParams,
  type PrintTextParams,
} from './NativeReactNativePrinterKit';

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
 * Get all Bluetooth devices already paired (bonded) with this device.
 */
export function getBondedBluetoothPrinters(): BluetoothPrinterDevice[] {
  return ReactNativePrinterKit.getBondedBluetoothPrinters();
}

/**
 * Connect to a paired Bluetooth printer by its MAC address. The connection
 * survives the app being swiped from Recents, and is reconnected to
 * automatically the next time the app starts.
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
export function printImageBase64(params: PrintImageBase64Params): Promise<void> {
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

// Export types
export type {
  BluetoothPrinterDevice,
  ConnectPrinterParams,
  HtmlToPdfParams,
  PdfToImageParams,
  PrinterImageType,
  PrintHtmlParams,
  PrintImageBase64Params,
  PrintImageParams,
  PrintPdfParams,
  PrintTextParams,
};

// Export native module
export default ReactNativePrinterKit;
