import ReactNativePrinterKit, {
  type BluetoothPrinterDevice,
  type PrinterImageType,
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
export function connectPrinter(address: string): Promise<boolean> {
  return ReactNativePrinterKit.connectPrinter(address);
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
export function printText(text: string, feedLines?: number): Promise<void> {
  return ReactNativePrinterKit.printText(text, feedLines);
}

/**
 * Print an image file as an ESC/POS raster image.
 * @param printerWidthDots 384 for 58mm printers, 576 for 80mm printers (default 384).
 */
export function printImage(
  imagePath: string,
  printerWidthDots?: number,
  feedLines?: number
): Promise<void> {
  return ReactNativePrinterKit.printImage(imagePath, printerWidthDots, feedLines);
}

/**
 * Print a base64-encoded image as an ESC/POS raster image.
 */
export function printImageBase64(
  base64: string,
  printerWidthDots?: number,
  feedLines?: number
): Promise<void> {
  return ReactNativePrinterKit.printImageBase64(base64, printerWidthDots, feedLines);
}

/**
 * Render a page of a PDF file to an image file. Returns the image path.
 */
export function pdfToImage(
  pdfPath: string,
  imageType?: PrinterImageType,
  page?: number,
  targetWidthPx?: number
): Promise<string> {
  return ReactNativePrinterKit.pdfToImage(pdfPath, imageType, page, targetWidthPx);
}

/**
 * Render a page of a PDF to an image, then print it.
 */
export function printPdf(
  pdfPath: string,
  printerWidthDots?: number,
  page?: number,
  feedLines?: number
): Promise<void> {
  return ReactNativePrinterKit.printPdf(pdfPath, printerWidthDots, page, feedLines);
}

/**
 * Render HTML to a PDF file and return its path, or null on failure. See
 * NativeReactNativePrinterKit's Spec for what pageWidthDp/heightDp/minPageHeightDp control.
 */
export function htmlToPdf(
  html: string,
  pageWidthDp?: number,
  heightDp?: number,
  minPageHeightDp?: number
): Promise<string | null> {
  return ReactNativePrinterKit.htmlToPdf(html, pageWidthDp, heightDp, minPageHeightDp);
}

/**
 * Full pipeline: render HTML to PDF, then print it - the way to print Bangla
 * (or other non-Latin) text or any real HTML/CSS layout.
 */
export function printHtml(
  html: string,
  printerWidthDots?: number,
  pageWidthDp?: number,
  heightDp?: number,
  minPageHeightDp?: number
): Promise<boolean> {
  return ReactNativePrinterKit.printHtml(
    html,
    printerWidthDots,
    pageWidthDp,
    heightDp,
    minPageHeightDp
  );
}

// Export types
export type { BluetoothPrinterDevice, PrinterImageType };

// Export native module
export default ReactNativePrinterKit;
