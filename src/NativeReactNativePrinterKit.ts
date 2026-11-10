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

/**
 * `PICTURES` is the public Pictures folder, so the image also shows in the Gallery app; it accepts images
 * only (a `.png`/`.jpg` file name or an `image/...` `mimeType`) and refuses anything else.
 */
export type FileLocation =
  | 'CACHE'
  | 'APP_FILES'
  | 'DOWNLOADS'
  | 'DOCUMENTS'
  | 'PICTURES'
  | 'CUSTOM_FOLDER';

export type SaveFileParams = {
  /** Path of an existing file to copy. Give exactly one of `sourcePath`, `text` or `base64`. */
  sourcePath?: string;
  /** Content to save as UTF-8 text, instead of `sourcePath`. Needs `fileName`. */
  text?: string;
  /**
   * Content to save as bytes (base64 encoded; a `data:...;base64,` prefix is fine), instead of
   * `sourcePath`. Needs `fileName`. Use it for images, PDFs and other binary data.
   */
  base64?: string;
  /** Defaults to the source file's name. Required with `text` or `base64`. */
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
  /**
   * Full path of the PDF to write, file name included (e.g.
   * `/data/user/0/<your.app>/files/invoice.pdf`). Leave it out to get a fresh file with a
   * generated name in the app's cache folder. The folder must already exist and be one the
   * app may write to (its own files/cache folders); an existing file is overwritten. To put
   * the PDF in a public folder such as Downloads, convert first and then call `saveFile`.
   * The path that was written is returned.
   */
  outputPath?: string;
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

export type RemoveFileParams = {
  /**
   * What to delete: an absolute file path, or the `content://` Uri that `saveFile` returned (for
   * a file in Downloads/Documents on Android 10+, which only works for files your app created).
   */
  path: string;
};

export type RemoveFileResult = {
  success: boolean;
  path: string | null;
  uri: string | null;
  fileName: string | null;
  error: string | null;
};

/**
 * The shape `readFile` returns the content in: `base64` (plain), `dataUri` (`data:<type>;base64,...`), `text`
 * (decoded string), `hex` (two lower-case digits per byte) or `bytes` (array of numbers 0..255, max 1 MB).
 */
export type ReadFileFormat = 'base64' | 'dataUri' | 'text' | 'hex' | 'bytes';

export type ReadFileParams = {
  /** An absolute file path, or the `content://` Uri that `saveFile` returned. */
  path: string;
  /** Default `base64`. */
  format?: ReadFileFormat;
  /** Only for `text`: `UTF-8` (default), `UTF-16`, `ISO-8859-1`, ... */
  encoding?: string;
  /** Files bigger than this are refused instead of loaded. Default 10 MB; `bytes` is always capped at 1 MB. */
  maxBytes?: number;
};

export type ReadFileResult = {
  success: boolean;
  format: ReadFileFormat | null;
  /** Set for `base64`, `dataUri`, `text` and `hex`. */
  content: string | null;
  /** Set for `bytes`. */
  bytes: number[] | null;
  sizeBytes: number | null;
  /** From the file extension, or the content provider's answer for a Uri. */
  mimeType: string | null;
  error: string | null;
};

export type HtmlToImageParams = {
  html: string;
  /** Full path of the image to write, file name included (folder must exist). Default: generated name in the cache folder. */
  outputPath?: string;
  /** Default `PNG`. */
  imageType?: PrinterImageType;
  /** Width of the image in pixels. Default: twice the page width. */
  targetWidthPx?: number;
  pageWidthDp?: number;
  heightDp?: number;
  minPageHeightDp?: number;
};

export type ReadDirParams = {
  /**
   * The folder to read: an absolute folder path, or a `content://` Uri of a folder the user picked
   * with the system folder picker (or the `path` of a sub-folder returned by an earlier call).
   */
  path: string;
};

export type DirEntry = {
  name: string;
  /** Pass it to `removeFile` (a file) or to `readDir` again (a folder). */
  path: string;
  isDirectory: boolean;
  /** `null` for a folder. */
  sizeBytes: number | null;
  /** Milliseconds since 1970, `null` if unknown. */
  lastModified: number | null;
};

export type ReadDirResult = {
  success: boolean;
  path: string | null;
  /** Just the names, in the same order as `entries`. */
  names: string[];
  entries: DirEntry[];
  error: string | null;
};

export type OpenFileParams = {
  path: string;
  /** Inferred from the file extension if not given. */
  mimeType?: string;
};

/**
 * Real, absolute directory paths on this device - similar to react-native-fs's
 * `DocumentDirectoryPath`/`CachesDirectoryPath` constants.
 *
 * `CACHE`, `APP_FILES`, `EXTERNAL_FILES` and `EXTERNAL_CACHE` are app-private: a plain file path
 * into any of them is always writable, no permission needed, on every Android version - safe to
 * use directly as `htmlToPdf`'s/`htmlToImage`'s `outputPath`.
 *
 * `DOWNLOADS`, `DOCUMENTS` and `PICTURES` are the public folders' paths. A plain `File`/`outputPath`
 * write there still fails directly on Android 10+ (scoped storage) - but `htmlToPdf`'s `outputPath`
 * detects one of these and routes the write through MediaStore automatically, so
 * `htmlToPdf({ outputPath: \`${File.DOWNLOADS}/name.pdf\` })` works as a single call. For any other
 * file, write it to `CACHE`/`APP_FILES` first, then call `saveFile` with the matching `location`.
 */
export type DirectoryPaths = {
  /** `context.cacheDir`. Temporary - the system may delete it. */
  CACHE: string;
  /** `context.filesDir`. App-private persistent storage. */
  APP_FILES: string;
  /** App-private persistent storage on external/SD storage (`getExternalFilesDir(null)`). `null` if no external storage is mounted. */
  EXTERNAL_FILES: string | null;
  /** App-private cache on external/SD storage (`getExternalCacheDir()`). `null` if no external storage is mounted. */
  EXTERNAL_CACHE: string | null;
  /** Public Downloads folder - reference only, see above. */
  DOWNLOADS: string;
  /** Public Documents folder - reference only, see above. */
  DOCUMENTS: string;
  /** Public Pictures folder - reference only, see above. */
  PICTURES: string;
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
   * Saves a file to cache, app storage, public Downloads/Documents or a chosen folder: either
   * copies an existing file (`sourcePath`, e.g. the PDF from `htmlToPdf`) or writes content you
   * pass directly (`text` or `base64`, with a `fileName`). Never rejects: check `result.success`.
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
   * Deletes ONE file (what `saveFile` wrote, or any file your app may delete). Never a folder, never a
   * pattern; cannot be undone. A missing file is reported as a failure ("File not found").
   * Never rejects: check `result.success`.
   */
  removeFile(params: RemoveFileParams): Promise<RemoveFileResult>;

  /**
   * Reads ONE file and returns its content in the shape `format` asks for (`base64`, `dataUri`, `text`,
   * `hex` or `bytes`). Read-only. A file over `maxBytes` (default 10 MB) is refused instead of loaded.
   * Never rejects: check `result.success`.
   */
  readFile(params: ReadFileParams): Promise<ReadFileResult>;

  /**
   * Renders HTML to ONE image file (PNG or JPEG) and returns its absolute path, or `null` on failure.
   * It is `htmlToPdf` plus one rendered page, so a very tall page makes a very large bitmap and can run
   * out of memory (then the result is `null`). For base64 pass the path to `readFile`.
   */
  htmlToImage(params: HtmlToImageParams): Promise<string | null>;

  /**
   * Reads ONE folder: the files and folders directly inside it (not their contents), folders first and
   * then A-Z. Read-only. A path that is a file, missing or relative is refused. Never rejects: check
   * `result.success`.
   */
  readDir(params: ReadDirParams): Promise<ReadDirResult>;

  /**
   * Opens a file with whatever app the user has installed that can handle its
   * type (e.g. a PDF viewer) - shows the system's "Open with" chooser if more
   * than one app matches. `mimeType` is inferred from the file extension if
   * not given. Returns false if the file doesn't exist or no app can open it.
   */
  openFile(params: OpenFileParams): boolean;

  /**
   * Real, absolute paths for common storage locations on this device. See {@link DirectoryPaths}
   * for which keys are safely writable with a raw path and which are reference-only.
   */
  getDirectoryPaths(): DirectoryPaths;
}

function getModule(): Spec {
  return Platform.OS === 'android'
    ? TurboModuleRegistry.getEnforcing<Spec>('ReactNativePrinterKit')
    : ({} as Spec);
}

export default getModule();
