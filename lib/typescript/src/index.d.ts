import ReactNativePrinterKit, { type BluetoothPrinterDevice, type ConnectPrinterParams, type HtmlToPdfParams, type PdfToImageParams, type PrinterImageType, type PrintHtmlParams, type PrintImageBase64Params, type PrintImageParams, type PrintPdfParams, type PrintTextParams } from './NativeReactNativePrinterKit.js';
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
export declare function connectPrinter(params: ConnectPrinterParams): Promise<boolean>;
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
export declare function printText(params: PrintTextParams): Promise<void>;
/**
 * Print an image file as an ESC/POS raster image.
 * `printerWidthDots`: 384 for 58mm printers, 576 for 80mm printers (default 384).
 */
export declare function printImage(params: PrintImageParams): Promise<void>;
/**
 * Print a base64-encoded image as an ESC/POS raster image.
 */
export declare function printImageBase64(params: PrintImageBase64Params): Promise<void>;
/**
 * Render a page of a PDF file to an image file. Returns the image path.
 */
export declare function pdfToImage(params: PdfToImageParams): Promise<string>;
/**
 * Render a page of a PDF to an image, then print it.
 */
export declare function printPdf(params: PrintPdfParams): Promise<void>;
/**
 * Render HTML to a PDF file and return its path, or null on failure. See
 * NativeReactNativePrinterKit's Spec for what pageWidthDp/heightDp/minPageHeightDp control.
 */
export declare function htmlToPdf(params: HtmlToPdfParams): Promise<string | null>;
/**
 * Full pipeline: render HTML to PDF, then print it - the way to print Bangla
 * (or other non-Latin) text or any real HTML/CSS layout.
 */
export declare function printHtml(params: PrintHtmlParams): Promise<boolean>;
export type { BluetoothPrinterDevice, ConnectPrinterParams, HtmlToPdfParams, PdfToImageParams, PrinterImageType, PrintHtmlParams, PrintImageBase64Params, PrintImageParams, PrintPdfParams, PrintTextParams, };
export default ReactNativePrinterKit;
//# sourceMappingURL=index.d.ts.map