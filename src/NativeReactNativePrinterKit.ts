import { TurboModuleRegistry, type TurboModule, Platform } from 'react-native';

/** How sure the library is that a paired Bluetooth device is a printer. */
export type PrinterConfidence = 'CONFIDENT' | 'LIKELY' | 'UNKNOWN';

/** `ALL` lists every paired device, `LIKELY_PRINTERS` hides non-printers, `STRICT` keeps only certain ones. */
export type PrinterFilter = 'ALL' | 'LIKELY_PRINTERS' | 'STRICT';

export type PrinterConnectionType = 'BLUETOOTH' | 'NETWORK' | 'USB';

export type BluetoothPrinterDevice = {
  /** `null` for a Wi-Fi/LAN printer. */
  name: string | null;
  /** Bluetooth MAC, the host for a Wi-Fi/LAN printer, or `"vendorId:productId"` for a USB printer. */
  address: string;
  confidence: PrinterConfidence;
  /** Why it got that confidence, e.g. "Printer-like name + SPP service". May be `null`. */
  reason: string | null;
};

export type GetBondedPrintersParams = {
  filter?: PrinterFilter;
  /** Extra name fragments to treat as printers, for printers with unusual names. */
  extraNameKeywords?: string[];
};

export type UsbPrinterDevice = {
  name: string | null;
  vendorId: number;
  productId: number;
  deviceName: string;
};

export type UsbDeviceParams = {
  vendorId: number;
  productId: number;
};

export type PrinterImageType = 'PNG' | 'JPEG';

export type ConnectPrinterParams = {
  /** Bluetooth MAC address, or the IP/host for `NETWORK`. Ignored (use `""`) for `USB`. */
  address: string;
  /** Default `BLUETOOTH`. */
  type?: PrinterConnectionType;
  /** `NETWORK` only. Default 9100. */
  port?: number;
  /** `NETWORK` connect timeout in ms. Default 5000. */
  timeoutMs?: number;
  /** `USB` only, from `getUsbPrinters()`. */
  vendorId?: number;
  /** `USB` only, from `getUsbPrinters()`. */
  productId?: number;
  /** Title of the ongoing "connected" notification. Default "Printer connected". */
  notificationTitle?: string;
  /** Title of the notification shown if the printer drops later. Default "Printer disconnected". */
  disconnectedNotificationTitle?: string;
};

export type PrinterStatusParams = {
  /** How long to wait for the printer to answer, in ms. Default 800. */
  timeoutMs?: number;
};

/**
 * `null` means "unknown" - the printer did not answer or does not report that condition. It is NOT "ok".
 */
export type PrinterStatus = {
  connected: boolean;
  /** `false` means the printer ignored the status request and every field below is `null`. */
  responded: boolean;
  online: boolean | null;
  paperOut: boolean | null;
  paperNearEnd: boolean | null;
  coverOpen: boolean | null;
  hasError: boolean | null;
};

export type FileLocation =
  'CACHE' | 'APP_FILES' | 'DOWNLOADS' | 'DOCUMENTS' | 'CUSTOM_FOLDER';

export type SaveFileParams = {
  sourcePath: string;
  /** Defaults to the source file's name. */
  fileName?: string;
  /** Default `DOWNLOADS`. */
  location?: FileLocation;
  /** Required for `CUSTOM_FOLDER`: a `content://` tree Uri string or a directory path. */
  customFolder?: string;
  subFolder?: string;
  /** Guessed from the file extension when not given. */
  mimeType?: string;
  overwrite?: boolean;
  deleteSource?: boolean;
};

export type SaveFileResult = {
  success: boolean;
  path: string | null;
  uri: string | null;
  fileName: string | null;
  error: string | null;
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

export type OpenFileParams = {
  path: string;
  /** Inferred from the file extension if not given. */
  mimeType?: string;
};

export interface Spec extends TurboModule {
  /**
   * Whether the device's Bluetooth adapter itself is turned on. Needs no runtime
   * permission - check this before `hasBluetoothPermission`/`requestBluetoothPermission`
   * so a disabled adapter can be reported as "turn on Bluetooth" rather than
   * "grant permission".
   */
  isBluetoothEnabled(): boolean;

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
   * Returns the Bluetooth devices already paired (bonded) with this device, best printer matches first.
   * On Android 12+ this requires the BLUETOOTH_CONNECT permission to be granted.
   * Pass `{}` for every paired device, or `{ filter: 'LIKELY_PRINTERS' }` to hide non-printers.
   */
  getBondedBluetoothPrinters(
    params: GetBondedPrintersParams
  ): BluetoothPrinterDevice[];

  /**
   * USB printers currently plugged in (USB printer class). Needs a phone with USB host (OTG).
   */
  getUsbPrinters(): UsbPrinterDevice[];

  /**
   * Whether the user already granted this app access to that USB printer.
   */
  hasUsbPermission(params: UsbDeviceParams): boolean;

  /**
   * Shows the system USB permission dialog and resolves with the user's answer.
   * Call this before `connectPrinter` with `type: 'USB'`. The grant is lost when the app is reinstalled.
   */
  requestUsbPermission(params: UsbDeviceParams): Promise<boolean>;

  /**
   * Connects over Bluetooth (default), Wi-Fi/LAN or USB depending on `params.type`.
   * Closes any existing printer connection first. Remembers the printer so the
   * app reconnects automatically next time it's opened (see the README's
   * "Persistent connection" section). Resolves `false` (does not reject) if it could not connect.
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
   * Whether a printer is connected AND currently accepts data (it may be switched off or out of range).
   * Does not check paper or the cover - use `getPrinterStatus` for that.
   */
  isPrinterReady(): Promise<boolean>;

  /**
   * Asks the printer for its state (online, paper, cover, error). Many cheap printers do not answer:
   * then `responded` is `false` and every other field is `null` (unknown, NOT ok).
   */
  getPrinterStatus(params: PrinterStatusParams): Promise<PrinterStatus>;

  /**
   * Prints a short ASCII test page (connection type, printer, address, time).
   */
  printTestPage(): Promise<void>;

  /**
   * Copies a finished file (e.g. the PDF from `htmlToPdf`) to cache, app storage, public
   * Downloads/Documents or a chosen folder. Never rejects: check `result.success`.
   */
  saveFile(params: SaveFileParams): Promise<SaveFileResult>;

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

  /**
   * Opens a file with whatever app the user has installed that can handle its
   * type (e.g. a PDF viewer) - shows the system's "Open with" chooser if more
   * than one app matches. `mimeType` is inferred from the file extension if
   * not given. Returns false if the file doesn't exist or no app can open it.
   */
  openFile(params: OpenFileParams): boolean;
}

function getModule(): Spec {
  return Platform.OS === 'android'
    ? TurboModuleRegistry.getEnforcing<Spec>('ReactNativePrinterKit')
    : ({} as Spec);
}

export default getModule();
