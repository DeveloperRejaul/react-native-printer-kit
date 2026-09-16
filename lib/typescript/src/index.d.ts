import ReactNativePrinterKit, { type BluetoothPrinterDevice, type PrinterImageType } from './NativeReactNativePrinterKit.js';
/**
 * Whether Bluetooth permission is already granted (always true below Android 12).
 */
export declare function hasBluetoothPermission(): boolean;
/**
 * Shows the system permission dialog if needed, and resolves with the result.
 */
export declare function requestBluetoothPermission(): Promise<boolean>;
/**
 * Get all Bluetooth devices already paired (bonded) with this device.
 */
export declare function getBondedBluetoothPrinters(): BluetoothPrinterDevice[];
/**
 * Connect to a paired Bluetooth printer by its MAC address. The connection
 * survives the app being swiped from Recents, and is reconnected to
 * automatically the next time the app starts.
 */
export declare function connectPrinter(address: string): Promise<boolean>;
/**
 * Disconnect from the current printer.
 */
export declare function disconnectPrinter(): Promise<void>;
/**
 * Check if a printer is currently connected.
 */
export declare function isConnectedPrinter(): Promise<boolean>;
/**
 * Get the currently connected printer, if any.
 */
export declare function getConnectedPrinter(): Promise<BluetoothPrinterDevice | null>;
/**
 * Print raw text using the printer's built-in font (ASCII only - use
 * printHtml() for Bangla or other non-Latin scripts).
 */
export declare function printText(text: string, feedLines?: number): Promise<void>;
/**
 * Print an image file as an ESC/POS raster image.
 * @param printerWidthDots 384 for 58mm printers, 576 for 80mm printers (default 384).
 */
export declare function printImage(imagePath: string, printerWidthDots?: number, feedLines?: number): Promise<void>;
/**
 * Print a base64-encoded image as an ESC/POS raster image.
 */
export declare function printImageBase64(base64: string, printerWidthDots?: number, feedLines?: number): Promise<void>;
/**
 * Render a page of a PDF file to an image file. Returns the image path.
 */
export declare function pdfToImage(pdfPath: string, imageType?: PrinterImageType, page?: number, targetWidthPx?: number): Promise<string>;
/**
 * Render a page of a PDF to an image, then print it.
 */
export declare function printPdf(pdfPath: string, printerWidthDots?: number, page?: number, feedLines?: number): Promise<void>;
/**
 * Render HTML to a PDF file and return its path, or null on failure. See
 * NativeReactNativePrinterKit's Spec for what pageWidthDp/heightDp/minPageHeightDp control.
 */
export declare function htmlToPdf(html: string, pageWidthDp?: number, heightDp?: number, minPageHeightDp?: number): Promise<string | null>;
/**
 * Full pipeline: render HTML to PDF, then print it - the way to print Bangla
 * (or other non-Latin) text or any real HTML/CSS layout.
 */
export declare function printHtml(html: string, printerWidthDots?: number, pageWidthDp?: number, heightDp?: number, minPageHeightDp?: number): Promise<boolean>;
export type { BluetoothPrinterDevice, PrinterImageType };
export default ReactNativePrinterKit;
//# sourceMappingURL=index.d.ts.map