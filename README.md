# react-native-printer-kit

A professional-grade React Native module for printing directly to Bluetooth, Wi-Fi/LAN and USB POS/thermal (ESC/POS) printers on **Android devices only** — no third-party printer app, no OS print dialog. Print raw text, images, PDFs, and full HTML/CSS content, including **Bangla and other non-Latin scripts** that ESC/POS printer fonts don't support natively.

> **Important:** This library is **exclusively for Android**. Bluetooth Classic SPP, USB host and ESC/POS are Android-specific integrations; iOS does not expose the APIs this relies on.

[![npm version](https://img.shields.io/npm/v/@rejaul/react-native-printer-kit.svg)](https://www.npmjs.com/package/@rejaul/react-native-printer-kit)
[![license](https://img.shields.io/npm/l/@rejaul/react-native-printer-kit.svg)](LICENSE)
[![Platform - Android Only](https://img.shields.io/badge/Platform-Android%20Only-green)]()
[![Kotlin](https://img.shields.io/badge/Language-Kotlin-purple)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Supported-blue)]()

## Why this exists

Most ESC/POS printer libraries only send raw text or a single pre-made image. They can't render real content — an actual HTML/CSS receipt layout, a PDF, or text in a script the printer's built-in font doesn't have (Bangla, Arabic, Hindi, etc.). This library renders your HTML/PDF to a bitmap on-device (Android's own `WebView` and `PdfRenderer` — no external rendering library) and sends it to the printer as a dithered ESC/POS raster image.

It's a thin React Native bridge over [`android-printer-kit`](https://github.com/DeveloperRejaul/android-printer-kit), the native Kotlin library that does the actual work.

## Features

- **Three connection types** behind one API: Bluetooth Classic (SPP), Wi-Fi/LAN (raw TCP) and USB (OTG). Every print function is the same for all three.
- **Printer-only device list**: `getBondedBluetoothPrinters({ filter: 'LIKELY_PRINTERS' })` hides headphones, watches and other non-printers.
- **Printer checks**: `isPrinterReady()`, `getPrinterStatus()` (online / paper out / cover / error) and `printTestPage()`.
- **Save files** (e.g. the PDF from `htmlToPdf`) to Downloads, Documents, app storage or a chosen folder with `saveFile()`.
- **Honest connection notification**: if the printer drops (switched off, out of range, Bluetooth off, USB unplugged) the ongoing "connected" notification is replaced by a dismissible "disconnected" one.
- **HTML → PDF → print** pipeline, so you can print an actual styled receipt/report.
- **PDF → image → print** pipeline via Android's built-in `PdfRenderer`.
- **Non-Latin text support** (Bangla and others) via image-based rendering.
- **Persistent connection**: the printer stays connected even if the app is swiped away from Recents (a foreground service keeps it alive).
- **Auto-reconnect**: remembers the last connected printer and reconnects automatically next time the app starts.
- **Banded raster printing**: images are sent in small, paced chunks, since many cheap ESC/POS boards silently drop large single print commands.
- **Type-safe**: full TypeScript definitions, backed by a New Architecture TurboModule.

## Platform Support

| Platform | Status | Details |
|----------|--------|---------|
| **Android** | **Fully Supported** | API Level 24+ required |
| **iOS** | **Not Supported** | No Bluetooth Classic SPP / ESC/POS API equivalent |

## Scope

This library speaks **ESC/POS** — the standard used by virtually all receipt/thermal POS printers — over:

| Connection | Notes |
|---|---|
| Bluetooth Classic (SPP) | The printer must be paired in Android's Bluetooth settings first. |
| Wi-Fi / LAN | Raw TCP, usually port 9100. Phone and printer must be on the same network; there is no discovery, so you supply the IP. |
| USB | Needs a phone with USB host (OTG) and the user's per-device permission (`requestUsbPermission`). |

Not supported: Bluetooth LE-only printers, label printers that use TSPL/ZPL/CPCL (Zebra, TSC, ...), and non-ESC/POS protocols (PCL/PostScript inkjet & laser printers).

## Minimum Requirements

- **React Native** >= 0.76 (New Architecture / TurboModules)
- **Android API Level** >= 24 (Android 7.0+)
- **Kotlin** 2.0.21+ (included in the build system)

## Installation

```bash
npm install @rejaul/react-native-printer-kit
# or
yarn add @rejaul/react-native-printer-kit
```

Nothing to configure manually — all required Bluetooth, internet, USB-host and foreground-service permissions are declared by the underlying native library's manifest and merge in automatically. You still need to request the runtime `BLUETOOTH_CONNECT` (Android 12+) and `POST_NOTIFICATIONS` (Android 13+) permissions at runtime — `requestBluetoothPermission()` handles both in one call; see [Permissions](#permissions) below.

## Quick Start

```typescript
import {
  hasBluetoothPermission,
  requestBluetoothPermission,
  getBondedBluetoothPrinters,
  connectPrinter,
  printText,
  printHtml,
} from '@rejaul/react-native-printer-kit';

async function printReceipt() {
  // 1. Make sure Bluetooth permission is granted (Android 12+)
  if (!hasBluetoothPermission()) {
    const granted = await requestBluetoothPermission();
    if (!granted) return;
  }

  // 2. List paired printers and connect to one
  const printers = getBondedBluetoothPrinters();
  if (printers.length === 0) return;
  await connectPrinter({ address: printers[0]!.address });

  // 3a. Print plain text
  await printText({ text: 'Hello from PrinterKit' });

  // 3b. Or print a full HTML receipt (Bangla, styling, everything)
  const ok = await printHtml({ html: myReceiptHtml });
  console.log('Printed:', ok);
}
```

## Permissions

```typescript
import {
  hasBluetoothPermission,
  requestBluetoothPermission,
} from '@rejaul/react-native-printer-kit';

// Synchronous check - always true below Android 12
const granted = hasBluetoothPermission();

// Shows the system permission dialog if needed (no-op if already granted,
// or not required on this Android version)
const result = await requestBluetoothPermission();
```

## API Reference

### Permissions

#### `hasBluetoothPermission(): boolean`
Whether `BLUETOOTH_CONNECT` specifically is already granted (always `true` below Android 12) — the permission that actually gates connect/print.

#### `requestBluetoothPermission(): Promise<boolean>`
Shows the system permission dialog(s) for whatever's needed on this Android version — `BLUETOOTH_CONNECT` (12+) and `POST_NOTIFICATIONS` (13+, for the persistent-connection notification's visibility) — and resolves based on `BLUETOOTH_CONNECT`'s result specifically. A denied `POST_NOTIFICATIONS` alone doesn't make this resolve `false`: printing still works, the notification just won't show.

Every function that takes data (anything beyond a bare callback) takes a single params object instead of positional arguments, so new fields can be added later without breaking existing call sites.

### Connection

#### `getBondedBluetoothPrinters(params?: GetBondedPrintersParams): BluetoothPrinterDevice[]`
Lists Bluetooth devices already paired with the phone via Android's own Bluetooth settings, best printer matches first. Each device has a `confidence` (`CONFIDENT` / `LIKELY` / `UNKNOWN`). Pass `{ filter: 'LIKELY_PRINTERS' }` to hide devices that do not look like printers (`'STRICT'` keeps only certain ones), or `extraNameKeywords: ['part-of-its-name']` if a real printer has an unusual name and gets hidden. With no argument every paired device is returned, as before.

#### `getUsbPrinters(): UsbPrinterDevice[]`
USB printers currently plugged in (devices exposing the USB *printer* class). Needs a phone with USB host (OTG).

#### `hasUsbPermission(params: UsbDeviceParams): boolean`
Whether the user already granted this app access to that USB printer.

#### `requestUsbPermission(params: UsbDeviceParams): Promise<boolean>`
Shows the system USB permission dialog and resolves with the user's answer. Call it before connecting. The grant is lost when the app is reinstalled.

#### `connectPrinter(params: ConnectPrinterParams): Promise<boolean>`
Connects over Bluetooth (default), Wi-Fi/LAN or USB depending on `params.type`. Closes any existing connection first, and remembers the printer for auto-reconnect on the next app launch. Resolves `false` (does not reject) if it could not connect; for USB that includes a missing permission.

```typescript
// Bluetooth (default) - the printer must be paired first
await connectPrinter({ address: 'AA:BB:CC:DD:EE:FF' });

// Wi-Fi / LAN
await connectPrinter({ address: '192.168.1.50', type: 'NETWORK', port: 9100 });

// USB - ask for permission first (system dialog), then connect
const usb = getUsbPrinters()[0];
if (usb && (await requestUsbPermission(usb))) {
  await connectPrinter({
    address: '',
    type: 'USB',
    vendorId: usb.vendorId,
    productId: usb.productId,
  });
}
```

#### `disconnectPrinter(): Promise<void>`
Closes the current connection and forgets it for auto-reconnect.

#### `isConnectedPrinter(): Promise<boolean>`
Whether a printer connection is currently open.

#### `getConnectedPrinter(): Promise<BluetoothPrinterDevice | null>`
The currently connected printer, if any.

### Printer checks

#### `isPrinterReady(): Promise<boolean>`
Connected **and** the printer accepts data right now (it may be switched off or out of range). It does not check paper or the cover.

#### `getPrinterStatus(params?: PrinterStatusParams): Promise<PrinterStatus>`
Asks the printer for its state. Many printers ignore the request: then `responded` is `false` and every other field is `null` (unknown, **not** "ok"). Things to know:

- Right after connecting, the first request can time out (`responded: false`); asking again a moment later works.
- What a printer reports depends on its firmware. On the USB receipt printer used for testing, an open cover was reported as `online: false, paperOut: true` and never as `coverOpen: true`. So read `paperOut: true` as "no paper *or* cover open", and do not rely on `coverOpen` unless you verified it on your printer model.
- `online: false` is the most reliable "do not print now" signal.
- A print call that resolves only means the bytes were sent. An offline or out-of-paper printer may still accept them, so check the status first when it matters.

#### `printTestPage(): Promise<void>`
Prints a short ASCII test page (connection type, printer, address, time).

### Saving and opening files

#### `saveFile(params: SaveFileParams): Promise<SaveFileResult>`
Copies a finished file (for example the PDF from `htmlToPdf`) to `CACHE`, `APP_FILES`, public `DOWNLOADS` / `DOCUMENTS` or a `CUSTOM_FOLDER`. Never rejects: check `result.success` and `result.error`. On Android 10+ Downloads/Documents use MediaStore (no permission needed); on Android 9 and below you need `WRITE_EXTERNAL_STORAGE`. `overwrite: true` can only replace files this app created.

#### `openFile(params: OpenFileParams): boolean`
Opens a file with whatever installed app can handle its type (shows the "Open with" chooser if several match). Returns `false` if the file does not exist or no app can open it.

### Bluetooth state

#### `isBluetoothEnabled(): boolean`
Whether the Bluetooth adapter itself is on. Needs no runtime permission, so check it before asking for the permission.

### Printing

#### `printText(params: PrintTextParams): Promise<void>`
Prints raw text using the printer's built-in font. **ASCII only** — use `printHtml()` for Bangla or other non-Latin scripts.

#### `printImage(params: PrintImageParams): Promise<void>`
Prints an image file as a dithered ESC/POS raster image. `printerWidthDots`: 384 for 58mm printers, 576 for 80mm printers (default 384).

#### `printImageBase64(params: PrintImageBase64Params): Promise<void>`
Same as above, from a base64-encoded image string.

#### `pdfToImage(params: PdfToImageParams): Promise<string>`
Renders one PDF page to an image file and returns its path.

#### `printPdf(params: PrintPdfParams): Promise<void>`
`pdfToImage` + print, in one call.

#### `htmlToPdf(params: HtmlToPdfParams): Promise<string | null>`
Renders HTML to a PDF file using an off-screen `WebView` and returns its path, or `null` on failure. `pageWidthDp` controls how large the content renders (like a CSS viewport width), independent of the final printed width. Leave `heightDp` unset to auto-measure the real content height (recommended).

#### `printHtml(params: PrintHtmlParams): Promise<boolean>`
Full pipeline: `htmlToPdf` → `printPdf`. This is how you print Bangla (or other non-Latin) text or any real HTML/CSS layout. Retries once (reconnect + resend) if the underlying write fails, e.g. from a "Broken pipe" when a cheap board drops the link mid-print.

## Type Definitions

```typescript
type PrinterConfidence = 'CONFIDENT' | 'LIKELY' | 'UNKNOWN';
type PrinterFilter = 'ALL' | 'LIKELY_PRINTERS' | 'STRICT';
type PrinterConnectionType = 'BLUETOOTH' | 'NETWORK' | 'USB';

type BluetoothPrinterDevice = {
  name: string | null; // null for a Wi-Fi/LAN printer
  address: string; // MAC, host, or "vendorId:productId" for USB
  confidence: PrinterConfidence;
  reason: string | null;
};

type GetBondedPrintersParams = {
  filter?: PrinterFilter; // default 'ALL'
  extraNameKeywords?: string[];
};

type UsbPrinterDevice = {
  name: string | null;
  vendorId: number;
  productId: number;
  deviceName: string;
};

type UsbDeviceParams = { vendorId: number; productId: number };

type PrinterImageType = 'PNG' | 'JPEG';

type ConnectPrinterParams = {
  address: string; // Bluetooth MAC, or IP/host for NETWORK; '' for USB
  type?: PrinterConnectionType; // default 'BLUETOOTH'
  port?: number; // NETWORK only, default 9100
  timeoutMs?: number; // NETWORK connect timeout, default 5000
  vendorId?: number; // USB only
  productId?: number; // USB only
  notificationTitle?: string; // default 'Printer connected'
  disconnectedNotificationTitle?: string; // default 'Printer disconnected'
};

type PrinterStatusParams = { timeoutMs?: number }; // default 800

// null = unknown (the printer did not report it), NOT "ok"
type PrinterStatus = {
  connected: boolean;
  responded: boolean;
  online: boolean | null;
  paperOut: boolean | null;
  paperNearEnd: boolean | null;
  coverOpen: boolean | null;
  hasError: boolean | null;
};

type FileLocation =
  | 'CACHE'
  | 'APP_FILES'
  | 'DOWNLOADS'
  | 'DOCUMENTS'
  | 'CUSTOM_FOLDER';

type SaveFileParams = {
  sourcePath: string;
  fileName?: string; // defaults to the source file's name
  location?: FileLocation; // default 'DOWNLOADS'
  customFolder?: string; // required for CUSTOM_FOLDER
  subFolder?: string;
  mimeType?: string; // guessed from the extension
  overwrite?: boolean;
  deleteSource?: boolean;
};

type SaveFileResult = {
  success: boolean;
  path: string | null;
  uri: string | null;
  fileName: string | null;
  error: string | null;
};

type OpenFileParams = { path: string; mimeType?: string };

type PrintTextParams = { text: string; feedLines?: number };

type PrintImageParams = {
  imagePath: string;
  printerWidthDots?: number;
  feedLines?: number;
  bandHeightDots?: number; // default 16 - lower for printers that drop/garble large images
  bandDelayMs?: number; // default 60 - raise for printers that drop/garble large images
};

type PrintImageBase64Params = {
  base64: string;
  printerWidthDots?: number;
  feedLines?: number;
  bandHeightDots?: number;
  bandDelayMs?: number;
};

type PdfToImageParams = {
  pdfPath: string;
  imageType?: PrinterImageType;
  page?: number;
  targetWidthPx?: number;
};

type PrintPdfParams = {
  pdfPath: string;
  printerWidthDots?: number;
  page?: number;
  feedLines?: number;
  bandHeightDots?: number;
  bandDelayMs?: number;
};

type HtmlToPdfParams = {
  html: string;
  pageWidthDp?: number;
  heightDp?: number;
  minPageHeightDp?: number;
};

type PrintHtmlParams = {
  html: string;
  printerWidthDots?: number;
  pageWidthDp?: number;
  heightDp?: number;
  minPageHeightDp?: number;
  bandHeightDots?: number;
  bandDelayMs?: number;
};
```

## Persistent connection & auto-reconnect

Connecting through this library keeps the printer connected even if the app is swiped away from Recents — the native side runs a foreground service that outlives the Activity/JS runtime. Every successful `connectPrinter()` call also remembers the printer (connection type, address/IP, port and USB ids), so the next time the app is opened (even after being fully killed) it reconnects automatically without the user having to pick the printer again.

`connectPrinter()` falls back to a direct RFCOMM channel if the standard SDP-based socket fails (common on printers with a broken SDP record). `isConnectedPrinter()` reflects a real disconnect for Bluetooth (Android's ACL-disconnect and Bluetooth-off events) and USB (unplugging) instead of a stale flag; a dropped Wi-Fi/LAN link is only noticed on the next write, which reconnects once automatically.

## Connection lost notification

When a connected printer drops on its own, the ongoing **"Printer connected"** notification is removed and a normal, dismissible **"Printer disconnected — \<printer name\>"** notification is posted. Reconnecting removes it again. Calling `disconnectPrinter()` yourself shows no notification. Change the wording with `notificationTitle` / `disconnectedNotificationTitle` in `connectPrinter()`.

## Printing Bangla / other non-Latin text

ESC/POS printer firmware fonts only cover ASCII, so `printText()` can't render Bangla. For anything with non-Latin text, render it as an image instead — build a bitmap yourself and use `printImage()`/`printImageBase64()`, or write it as HTML/CSS and call `printHtml()`, which renders it with a real font via `WebView` and prints the result as a dithered raster image.

## Example Application

See the [`example`](./example) directory for a complete React Native application demonstrating permission handling, Bluetooth and USB connection, printer status, the test page, and the print functions above.

```bash
cd example
yarn install
yarn android
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

MIT - See [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please open an [issue on GitHub](https://github.com/DeveloperRejaul/react-native-printer-kit/issues).
