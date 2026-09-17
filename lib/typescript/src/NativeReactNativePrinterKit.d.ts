import { type TurboModule } from 'react-native';
export type BluetoothPrinterDevice = {
    name: string | null;
    address: string;
};
export type PrinterImageType = 'PNG' | 'JPEG';
export type ConnectPrinterParams = {
    address: string;
};
export type PrintTextParams = {
    text: string;
    feedLines?: number;
};
export type PrintImageParams = {
    imagePath: string;
    printerWidthDots?: number;
    feedLines?: number;
    /** Height (in dots) of each raster band sent to the printer. Lower this for printers with a small receive buffer that drop or garble large images. Default 16. */
    bandHeightDots?: number;
    /** Pause (ms) between raster bands, giving the printer time to catch up. Default 60. */
    bandDelayMs?: number;
};
export type PrintImageBase64Params = {
    base64: string;
    printerWidthDots?: number;
    feedLines?: number;
    /** See PrintImageParams.bandHeightDots. */
    bandHeightDots?: number;
    /** See PrintImageParams.bandDelayMs. */
    bandDelayMs?: number;
};
export type PdfToImageParams = {
    pdfPath: string;
    imageType?: PrinterImageType;
    page?: number;
    targetWidthPx?: number;
};
export type PrintPdfParams = {
    pdfPath: string;
    printerWidthDots?: number;
    page?: number;
    feedLines?: number;
    /** See PrintImageParams.bandHeightDots. */
    bandHeightDots?: number;
    /** See PrintImageParams.bandDelayMs. */
    bandDelayMs?: number;
};
export type HtmlToPdfParams = {
    html: string;
    pageWidthDp?: number;
    heightDp?: number;
    minPageHeightDp?: number;
};
export type PrintHtmlParams = {
    html: string;
    printerWidthDots?: number;
    pageWidthDp?: number;
    heightDp?: number;
    minPageHeightDp?: number;
    /** See PrintImageParams.bandHeightDots. */
    bandHeightDots?: number;
    /** See PrintImageParams.bandDelayMs. */
    bandDelayMs?: number;
};
export interface Spec extends TurboModule {
    /**
     * Whether Bluetooth permission is already granted (always true below Android 12).
     */
    hasBluetoothPermission(): boolean;
    /**
     * Shows the system permission dialog if needed, and resolves with the result.
     * A no-op that resolves `true` on Android < 12, where no runtime grant is needed.
     */
    requestBluetoothPermission(): Promise<boolean>;
    /**
     * Returns all Bluetooth devices already paired (bonded) with this device.
     * On Android 12+ this requires the BLUETOOTH_CONNECT permission to be granted.
     */
    getBondedBluetoothPrinters(): BluetoothPrinterDevice[];
    /**
     * Opens a Bluetooth SPP connection to the paired printer at the given address.
     * Closes any existing printer connection first. Remembers the address so the
     * app reconnects automatically next time it's opened (see the README's
     * "Persistent connection" section).
     */
    connectPrinter(params: ConnectPrinterParams): Promise<boolean>;
    /**
     * Closes the current printer connection, if any, and forgets it for auto-reconnect.
     */
    disconnectPrinter(): Promise<void>;
    /**
     * Check if a printer connection is currently open.
     */
    isConnectedPrinter(): Promise<boolean>;
    /**
     * Get the currently connected printer, if any.
     */
    getConnectedPrinter(): Promise<BluetoothPrinterDevice | null>;
    /**
     * Print raw text using the printer's built-in font. ASCII only - not
     * suitable for Bangla or other non-Latin scripts, use printHtml() instead.
     */
    printText(params: PrintTextParams): Promise<void>;
    /**
     * Print an image file as a dithered ESC/POS raster image.
     * `printerWidthDots`: 384 for 58mm printers, 576 for 80mm printers (default 384).
     */
    printImage(params: PrintImageParams): Promise<void>;
    /**
     * Print a base64-encoded image as a dithered ESC/POS raster image.
     */
    printImageBase64(params: PrintImageBase64Params): Promise<void>;
    /**
     * Renders a page of a PDF file to an image file (via Android's PdfRenderer)
     * and returns the image's absolute path.
     */
    pdfToImage(params: PdfToImageParams): Promise<string>;
    /**
     * Renders a page of a PDF to an image, then prints it.
     */
    printPdf(params: PrintPdfParams): Promise<void>;
    /**
     * Renders HTML to a PDF file using an off-screen WebView (no external
     * library) and returns the PDF's absolute path, or null on failure.
     *
     * `pageWidthDp` is the layout width the HTML is rendered at - controls how
     * large the content looks relative to the page, independent of the final
     * printed width (`printerWidthDots` on printHtml/printPdf downscales it).
     * `heightDp`, if set, forces the page to exactly this height (dp) instead
     * of auto-measuring the HTML's real content height. `minPageHeightDp` is
     * ignored if `heightDp` is set - a height floor (dp) for auto-measured
     * content, only relevant for very short/empty HTML.
     */
    htmlToPdf(params: HtmlToPdfParams): Promise<string | null>;
    /**
     * Full pipeline: htmlToPdf -> printPdf, in one call. This is how to print
     * content with Bangla or other non-Latin text, or any real HTML/CSS layout.
     */
    printHtml(params: PrintHtmlParams): Promise<boolean>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeReactNativePrinterKit.d.ts.map