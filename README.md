# react-native-printer-kit

A professional-grade React Native module for printing directly to Bluetooth POS/thermal (ESC/POS) printers on **Android devices only** — no third-party printer app, no OS print dialog. Print raw text, images, PDFs, and full HTML/CSS content, including **Bangla and other non-Latin scripts** that ESC/POS printer fonts don't support natively.

> **Important:** This library is **exclusively for Android**. Bluetooth Classic SPP + ESC/POS is an Android-specific integration; iOS does not expose the APIs this relies on.

[![npm version](https://img.shields.io/npm/v/@rejaul/react-native-printer-kit.svg)](https://www.npmjs.com/package/@rejaul/react-native-printer-kit)
[![license](https://img.shields.io/npm/l/@rejaul/react-native-printer-kit.svg)](LICENSE)
[![Platform - Android Only](https://img.shields.io/badge/Platform-Android%20Only-green)]()
[![Kotlin](https://img.shields.io/badge/Language-Kotlin-purple)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Supported-blue)]()

## Why this exists

Most ESC/POS printer libraries only send raw text or a single pre-made image. They can't render real content — an actual HTML/CSS receipt layout, a PDF, or text in a script the printer's built-in font doesn't have (Bangla, Arabic, Hindi, etc.). This library renders your HTML/PDF to a bitmap on-device (Android's own `WebView` and `PdfRenderer` — no external rendering library) and sends it to the printer as a dithered ESC/POS raster image.

It's a thin React Native bridge over [`android-printer-kit`](https://github.com/DeveloperRejaul/android-printer-kit), the native Kotlin library that does the actual work.

## Features

- **Direct Bluetooth Classic (SPP) connection** to any paired ESC/POS printer.
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

This library speaks **Bluetooth Classic SPP + ESC/POS** — the standard used by virtually all budget Bluetooth receipt/thermal printers. It does not support Bluetooth LE printers, WiFi/network printers, USB-connected printers, or non-ESC/POS protocols (PCL/PostScript inkjet & laser printers).

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

Nothing to configure manually — all required Bluetooth and foreground-service permissions are declared by the underlying native library's manifest and merge in automatically. You still need to request the runtime `BLUETOOTH_CONNECT` (Android 12+) and `POST_NOTIFICATIONS` (Android 13+) permissions at runtime — `requestBluetoothPermission()` handles both in one call; see [Permissions](#permissions) below.

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

#### `getBondedBluetoothPrinters(): BluetoothPrinterDevice[]`
Lists Bluetooth devices already paired with the phone via Android's own Bluetooth settings.

#### `connectPrinter(params: ConnectPrinterParams): Promise<boolean>`
Opens an RFCOMM/SPP connection to the paired printer. Closes any existing connection first, and remembers the address for auto-reconnect on the next app launch.

#### `disconnectPrinter(): Promise<void>`
Closes the current connection and forgets it for auto-reconnect.

#### `isConnectedPrinter(): Promise<boolean>`
Whether a printer connection is currently open.

#### `getConnectedPrinter(): Promise<BluetoothPrinterDevice | null>`
The currently connected printer, if any.

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
type BluetoothPrinterDevice = {
  name: string | null;
  address: string;
};

type PrinterImageType = 'PNG' | 'JPEG';

type ConnectPrinterParams = { address: string };

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

Connecting through this library keeps the printer connected even if the app is swiped away from Recents — the native side runs a foreground service that outlives the Activity/JS runtime. Every successful `connectPrinter()` call also remembers the device, so the next time the app is opened (even after being fully killed) it reconnects automatically without the user having to pick the printer again.

`connectPrinter()` falls back to a direct RFCOMM channel if the standard SDP-based socket fails (common on printers with a broken SDP record), and `isConnectedPrinter()` reflects a real physical disconnect immediately (via Android's ACL-disconnect broadcast) instead of a stale flag that stays `true` after the printer silently drops the link.

## Printing Bangla / other non-Latin text

ESC/POS printer firmware fonts only cover ASCII, so `printText()` can't render Bangla. For anything with non-Latin text, render it as an image instead — build a bitmap yourself and use `printImage()`/`printImageBase64()`, or write it as HTML/CSS and call `printHtml()`, which renders it with a real font via `WebView` and prints the result as a dithered raster image.

## Example Application

See the [`example`](./example) directory for a complete React Native application demonstrating permission handling, printer pairing/connection, and every print function above.

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
