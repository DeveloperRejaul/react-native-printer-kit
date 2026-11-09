import type {
  FileLocation as FileLocationValue,
  PrinterConfidence as PrinterConfidenceValue,
  PrinterConnectionType as PrinterConnectionTypeValue,
  PrinterFilter as PrinterFilterValue,
  PrinterImageType as PrinterImageTypeValue,
} from './NativeReactNativePrinterKit';

// Runtime values for the string unions the native module uses, so callers can write
// `PrinterFilter.LIKELY_PRINTERS` instead of a bare string. Each object is checked
// against its union with `satisfies`, so a typo or a value the native side does not
// know fails to compile. The plain strings keep working everywhere too.

/** How sure the library is that a paired Bluetooth device is a printer. */
export const PrinterConfidence = {
  CONFIDENT: 'CONFIDENT',
  LIKELY: 'LIKELY',
  UNKNOWN: 'UNKNOWN',
} as const satisfies Record<PrinterConfidenceValue, PrinterConfidenceValue>;
export type PrinterConfidence =
  (typeof PrinterConfidence)[keyof typeof PrinterConfidence];

/** `ALL` lists every paired device, `LIKELY_PRINTERS` hides non-printers, `STRICT` keeps only certain ones. */
export const PrinterFilter = {
  ALL: 'ALL',
  LIKELY_PRINTERS: 'LIKELY_PRINTERS',
  STRICT: 'STRICT',
} as const satisfies Record<PrinterFilterValue, PrinterFilterValue>;
export type PrinterFilter = (typeof PrinterFilter)[keyof typeof PrinterFilter];

export const PrinterConnectionType = {
  BLUETOOTH: 'BLUETOOTH',
  NETWORK: 'NETWORK',
  USB: 'USB',
} as const satisfies Record<
  PrinterConnectionTypeValue,
  PrinterConnectionTypeValue
>;
export type PrinterConnectionType =
  (typeof PrinterConnectionType)[keyof typeof PrinterConnectionType];

export const PrinterImageType = {
  PNG: 'PNG',
  JPEG: 'JPEG',
} as const satisfies Record<PrinterImageTypeValue, PrinterImageTypeValue>;
export type PrinterImageType =
  (typeof PrinterImageType)[keyof typeof PrinterImageType];

export const FileLocation = {
  CACHE: 'CACHE',
  APP_FILES: 'APP_FILES',
  DOWNLOADS: 'DOWNLOADS',
  DOCUMENTS: 'DOCUMENTS',
  CUSTOM_FOLDER: 'CUSTOM_FOLDER',
} as const satisfies Record<FileLocationValue, FileLocationValue>;
export type FileLocation = (typeof FileLocation)[keyof typeof FileLocation];
