import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  connectPrinter,
  disconnectPrinter,
  getBondedBluetoothPrinters,
  getConnectedPrinter,
  getPrinterStatus,
  getUsbPrinters,
  htmlToImage,
  htmlToPdf,
  hasBluetoothPermission,
  isConnectedPrinter,
  File,
  FileLocation,
  isPrinterReady,
  openFile,
  PrinterConnectionType,
  PrinterFilter,
  printHtml,
  printTestPage,
  printText,
  requestBluetoothPermission,
  readDir,
  readFile,
  removeFile,
  requestUsbPermission,
  saveFile,
  type BluetoothPrinterDevice,
} from '@rejaul/react-native-printer-kit';

const SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
    body { padding: 16px; }
    h1 { font-size: 32px; margin-bottom: 12px; }
    p { font-size: 24px; line-height: 32px; }
  </style>
</head>
<body>
  <h1>PrinterKit টেস্ট</h1>
  <p>বাংলা টেক্সট প্রিন্ট টেস্ট</p>
  <p>Hello from react-native-printer-kit</p>
</body>
</html>
`;

/** A button that shows a spinner and disables itself while [busy] is true for this exact [label]. */
function ActionButton({
  label,
  busy,
  activeLabel,
  onPress,
}: {
  label: string;
  busy: boolean;
  activeLabel: string | null;
  onPress: () => void;
}) {
  const isLoading = activeLabel === label;
  return (
    <TouchableOpacity
      style={[styles.button, busy && styles.buttonDisabled]}
      disabled={busy}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function App() {
  const [status, setStatus] = useState('Idle');
  const [connected, setConnected] = useState<BluetoothPrinterDevice | null>(
    null
  );
  const [devices, setDevices] = useState<BluetoothPrinterDevice[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const busy = activeLabel !== null;

  const refreshConnected = useCallback(async () => {
    const device = await getConnectedPrinter();
    setConnected(device);
  }, []);

  useEffect(() => {
    refreshConnected();
  }, [refreshConnected]);

  const run = useCallback(
    async (label: string, action: () => Promise<void | string>) => {
      setActiveLabel(label);
      setStatus(`${label}...`);
      try {
        // An action may return a string to show as the result instead of "OK".
        const detail = await action();
        setStatus(typeof detail === 'string' ? detail : `${label}: OK`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus(`${label} FAILED: ${message}`);
      } finally {
        setActiveLabel(null);
      }
    },
    []
  );

  const onPickPrinters = () =>
    run('getBondedBluetoothPrinters()', async () => {
      if (!hasBluetoothPermission()) {
        const granted = await requestBluetoothPermission();
        if (!granted) throw new Error('Bluetooth permission denied');
      }
      // LIKELY_PRINTERS hides headphones, watches and other non-printers.
      setDevices(
        getBondedBluetoothPrinters({ filter: PrinterFilter.LIKELY_PRINTERS })
      );
      setShowPicker(true);
    });

  const onConnect = (device: BluetoothPrinterDevice) =>
    run(`connectPrinter(${device.address})`, async () => {
      const ok = await connectPrinter({ address: device.address });
      if (!ok) throw new Error('connectPrinter() returned false');
      setConnected(device);
      setShowPicker(false);
    });

  const onConnectUsb = () =>
    run('connect USB printer', async () => {
      const usb = getUsbPrinters()[0];
      if (!usb) throw new Error('No USB printer found (plug it in via OTG)');
      const granted = await requestUsbPermission({
        vendorId: usb.vendorId,
        productId: usb.productId,
      });
      if (!granted) throw new Error('USB permission denied');
      const ok = await connectPrinter({
        address: '',
        type: PrinterConnectionType.USB,
        vendorId: usb.vendorId,
        productId: usb.productId,
      });
      if (!ok) throw new Error('connectPrinter() returned false');
      await refreshConnected();
    });

  const onIsReady = () =>
    run('isPrinterReady()', async () => {
      const ready = await isPrinterReady();
      return `isPrinterReady() = ${ready}`;
    });

  const onPrinterStatus = () =>
    run('getPrinterStatus()', async () => {
      const result = await getPrinterStatus();
      // null = the printer did not report that field (unknown, not "ok").
      return `getPrinterStatus() = ${JSON.stringify(result)}`;
    });

  const onSaveFile = () =>
    run('htmlToPdf + saveFile', async () => {
      const pdf = await htmlToPdf({ html: SAMPLE_HTML });
      if (!pdf) throw new Error('htmlToPdf() returned null');
      const result = await saveFile({
        sourcePath: pdf,
        fileName: 'printerkit-test.pdf',
        location: FileLocation.DOWNLOADS,
        subFolder: 'PrinterKitRN',
        overwrite: true,
      });
      if (!result.success) throw new Error(result.error ?? 'saveFile failed');
      return `saveFile() saved: ${result.path ?? result.uri}`;
    });

  const onDirectoryPaths = () =>
    run('File (directory paths)', async () => {
      const writable: Array<[string, string | null]> = [
        ['CACHE', File.CACHE],
        ['APP_FILES', File.APP_FILES],
        ['EXTERNAL_FILES', File.EXTERNAL_FILES],
        ['EXTERNAL_CACHE', File.EXTERNAL_CACHE],
      ];
      for (const [key, value] of writable) {
        if (key !== 'EXTERNAL_FILES' && key !== 'EXTERNAL_CACHE' && !value) {
          throw new Error(`File.${key} is empty`);
        }
      }
      const referenceOnly: Array<[string, string]> = [
        ['DOWNLOADS', File.DOWNLOADS],
        ['DOCUMENTS', File.DOCUMENTS],
        ['PICTURES', File.PICTURES],
      ];
      for (const [key, value] of referenceOnly) {
        if (!value) throw new Error(`File.${key} is empty`);
      }
      return `CACHE=${File.CACHE}\nAPP_FILES=${File.APP_FILES}\nDOWNLOADS=${File.DOWNLOADS}`;
    });

  const onSaveToDownloadsThenOpen = () =>
    run('saveFile(DOWNLOADS) -> openFile', async () => {
      // Exactly the real-world flow: write with a writable outputPath (App.FILES, not DOWNLOADS -
      // that one is not a raw-writable path on Android 10+), copy into Downloads with saveFile,
      // then open what saveFile gave back (a content:// Uri on Android 10+, since DOWNLOADS never
      // gets a raw path there).
      const tempPath = await htmlToPdf({
        html: SAMPLE_HTML,
        outputPath: `${File.APP_FILES}/printerkit-open-test.pdf`,
      });
      if (!tempPath) throw new Error('htmlToPdf() returned null');

      const result = await saveFile({
        sourcePath: tempPath,
        fileName: 'printerkit-open-test.pdf',
        location: FileLocation.DOWNLOADS,
        overwrite: true,
        deleteSource: true,
      });
      if (!result.success) throw new Error(result.error ?? 'saveFile failed');

      const target = result.path ?? result.uri;
      if (!target) throw new Error('saveFile() gave neither path nor uri');

      const opened = openFile({ path: target, mimeType: 'application/pdf' });
      if (!opened) throw new Error(`openFile(${target}) returned false`);
      return `openFile() opened: ${target}`;
    });

  const onDirectDownloadsNoSaveFile = () =>
    run('htmlToPdf(outputPath=DOWNLOADS) -> openFile', async () => {
      // No saveFile() call here - outputPath points straight at File.DOWNLOADS. htmlToPdf()
      // itself now detects a public-folder outputPath and routes it through MediaStore,
      // handing back the real, already-saved location (a content:// Uri on Android 10+).
      const path = await htmlToPdf({
        html: SAMPLE_HTML,
        outputPath: `${File.DOWNLOADS}/printerkit-direct-downloads-test.pdf`,
      });
      if (!path) throw new Error('htmlToPdf() returned null');

      const opened = openFile({ path, mimeType: 'application/pdf' });
      if (!opened) throw new Error(`openFile(${path}) returned false`);
      return `openFile() opened: ${path}`;
    });

  const onCustomPath = () =>
    run('htmlToPdf(outputPath)', async () => {
      // A first conversion without outputPath tells us a folder the app may write to.
      const generated = await htmlToPdf({ html: SAMPLE_HTML });
      if (!generated) throw new Error('htmlToPdf() returned null');
      const wanted = `${generated.substring(0, generated.lastIndexOf('/'))}/my-invoice.pdf`;
      const written = await htmlToPdf({
        html: SAMPLE_HTML,
        outputPath: wanted,
      });
      if (written !== wanted) {
        throw new Error(`asked for ${wanted}, got ${String(written)}`);
      }
      return `htmlToPdf() wrote exactly: ${written}`;
    });

  const onSaveRemove = () =>
    run('saveFile(text) -> removeFile', async () => {
      const saved = await saveFile({
        text: 'নমুনা লেখা\nsecond line',
        fileName: 'rn-content.txt',
        subFolder: 'PrinterKitRN',
        overwrite: true,
      });
      if (!saved.success) throw new Error(`save: ${saved.error}`);
      const target = saved.path ?? saved.uri;
      if (!target) throw new Error('saveFile() gave neither path nor uri');
      const removed = await removeFile({ path: target });
      if (!removed.success) throw new Error(`remove: ${removed.error}`);
      // The file must be gone now, so a second removal has to fail.
      const again = await removeFile({ path: target });
      if (again.success)
        throw new Error('file was still there after removeFile');
      return `saved then removed ${target}; second removal refused: ${again.error}`;
    });

  const onReadDir = () =>
    run('readDir(path)', async () => {
      const where = { location: FileLocation.APP_FILES, overwrite: true };
      const a = await saveFile({
        text: 'a',
        fileName: 'A.txt',
        subFolder: 'readdir-test',
        ...where,
      });
      await saveFile({
        text: 'bb',
        fileName: 'b.txt',
        subFolder: 'readdir-test',
        ...where,
      });
      const x = await saveFile({
        text: 'x',
        fileName: 'x.txt',
        subFolder: 'readdir-test/inner',
        ...where,
      });
      if (!a.success || !a.path || !x.success || !x.path)
        throw new Error('setup failed');
      const folder = a.path.substring(0, a.path.lastIndexOf('/'));
      try {
        const top = await readDir({ path: folder });
        if (!top.success) throw new Error(`readDir: ${top.error}`);
        // Folders first, then files, each A-Z.
        if (top.names.join() !== 'inner,A.txt,b.txt') {
          throw new Error(`wrong names/order: ${top.names.join()}`);
        }
        const file = top.entries.find((e) => e.name === 'A.txt');
        if (file?.isDirectory !== false || file.sizeBytes !== 1) {
          throw new Error(`bad entry for A.txt: ${JSON.stringify(file)}`);
        }
        // An entry's path goes straight back into readDir to open the sub-folder.
        const inner = top.entries.find((e) => e.isDirectory);
        const sub = await readDir({ path: inner?.path ?? '' });
        if (sub.names.join() !== 'x.txt')
          throw new Error(`inner: ${sub.names.join()}`);
        const onFile = await readDir({ path: a.path });
        if (onFile.success) throw new Error('a file path should be refused');
        return `readDir() -> [${top.names.join(', ')}], inner -> [${sub.names.join(', ')}]`;
      } finally {
        for (const p of [a.path, `${folder}/b.txt`, x.path])
          await removeFile({ path: p });
      }
    });

  const onHtmlToImage = () =>
    run('htmlToImage -> readFile', async () => {
      const png = await htmlToImage({ html: SAMPLE_HTML, targetWidthPx: 600 });
      if (!png) throw new Error('htmlToImage() returned null');
      // The PNG signature (89 50 4E 47 0D 0A 1A 0A) proves it is a real PNG, not just a file with a name.
      const hex = await readFile({
        path: png,
        format: 'hex',
        maxBytes: 50_000_000,
      });
      if (!hex.success || !hex.content?.startsWith('89504e470d0a1a0a')) {
        throw new Error(`not a PNG: ${hex.error ?? hex.content?.slice(0, 16)}`);
      }
      const b64 = await readFile({
        path: png,
        format: 'base64',
        maxBytes: 50_000_000,
      });
      const uri = await readFile({
        path: png,
        format: 'dataUri',
        maxBytes: 50_000_000,
      });
      const small = await readFile({
        path: png,
        format: 'base64',
        maxBytes: 10,
      });
      if (small.success)
        throw new Error('a file over maxBytes should be refused');
      const gallery = await saveFile({
        sourcePath: png,
        fileName: 'printerkit-rn.png',
        location: FileLocation.PICTURES,
        subFolder: 'PrinterKitRN',
        overwrite: true,
      });
      if (!gallery.success) throw new Error(`gallery: ${gallery.error}`);
      return `PNG ${hex.sizeBytes} bytes; base64 ${b64.content?.length} chars; ${uri.content?.slice(0, 22)}...; saved to Gallery; over-limit refused`;
    });

  const onTestPage = () => run('printTestPage()', () => printTestPage());

  const onDisconnect = () =>
    run('disconnectPrinter()', async () => {
      await disconnectPrinter();
      setConnected(null);
    });

  const onIsConnected = () =>
    run('isConnectedPrinter()', async () => {
      const result = await isConnectedPrinter();
      return `isConnectedPrinter() = ${result}`;
    });

  const onPrintText = () =>
    run('printText(text)', () =>
      printText({ text: 'PrinterKit Example\nprintText() OK' })
    );

  const onPrintHtml = () =>
    run('printHtml(html)', async () => {
      const ok = await printHtml({ html: SAMPLE_HTML });
      if (!ok) throw new Error('printHtml() returned false');
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PrinterKit Example</Text>
        <Text style={styles.subtitle}>react-native-printer-kit</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={styles.statusValue}>{status}</Text>
        <Text style={styles.statusLabel}>Connected</Text>
        <Text style={styles.statusValue}>
          {connected
            ? `${connected.name ?? 'Unknown'} (${connected.address})`
            : '-'}
        </Text>
      </View>

      <ScrollView style={styles.section} contentContainerStyle={styles.buttons}>
        <ActionButton
          label="getBondedBluetoothPrinters()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onPickPrinters}
        />
        <ActionButton
          label="connect USB printer"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onConnectUsb}
        />
        <ActionButton
          label="isPrinterReady()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onIsReady}
        />
        <ActionButton
          label="getPrinterStatus()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onPrinterStatus}
        />
        <ActionButton
          label="printTestPage()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onTestPage}
        />
        <ActionButton
          label="htmlToPdf(outputPath)"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onCustomPath}
        />
        <ActionButton
          label="saveFile(text) -> removeFile"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onSaveRemove}
        />
        <ActionButton
          label="htmlToImage -> readFile"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onHtmlToImage}
        />
        <ActionButton
          label="readDir(path)"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onReadDir}
        />
        <ActionButton
          label="htmlToPdf + saveFile"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onSaveFile}
        />
        <ActionButton
          label="File (directory paths)"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onDirectoryPaths}
        />
        <ActionButton
          label="saveFile(DOWNLOADS) -> openFile"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onSaveToDownloadsThenOpen}
        />
        <ActionButton
          label="htmlToPdf(outputPath=DOWNLOADS) -> openFile"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onDirectDownloadsNoSaveFile}
        />
        <ActionButton
          label="disconnectPrinter()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onDisconnect}
        />
        <ActionButton
          label="isConnectedPrinter()"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onIsConnected}
        />
        <ActionButton
          label="printText(text)"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onPrintText}
        />
        <ActionButton
          label="printHtml(html)"
          busy={busy}
          activeLabel={activeLabel}
          onPress={onPrintHtml}
        />
      </ScrollView>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>প্রিন্টার সিলেক্ট করুন</Text>
            {devices.length === 0 ? (
              <Text style={styles.emptyText}>
                কোনো paired প্রিন্টার পাওয়া যায়নি। আগে Android Bluetooth
                settings থেকে প্রিন্টার pair করুন।
              </Text>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.address}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItem}
                    disabled={busy}
                    onPress={() => onConnect(item)}
                  >
                    <Text style={styles.deviceName}>
                      {item.name ?? 'Unknown'}
                    </Text>
                    <Text style={styles.deviceAddress}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  buttons: {
    gap: 10,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  deviceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deviceAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
