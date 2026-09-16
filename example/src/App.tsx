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
  hasBluetoothPermission,
  isConnectedPrinter,
  printHtml,
  printText,
  requestBluetoothPermission,
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
    async (label: string, action: () => Promise<void>) => {
      setActiveLabel(label);
      setStatus(`${label}...`);
      try {
        await action();
        setStatus(`${label}: OK`);
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
      setDevices(getBondedBluetoothPrinters());
      setShowPicker(true);
    });

  const onConnect = (device: BluetoothPrinterDevice) =>
    run(`connectPrinter(${device.address})`, async () => {
      const ok = await connectPrinter(device.address);
      if (!ok) throw new Error('connectPrinter() returned false');
      setConnected(device);
      setShowPicker(false);
    });

  const onDisconnect = () =>
    run('disconnectPrinter()', async () => {
      await disconnectPrinter();
      setConnected(null);
    });

  const onIsConnected = () =>
    run('isConnectedPrinter()', async () => {
      const result = await isConnectedPrinter();
      setStatus(`isConnectedPrinter() = ${result}`);
    });

  const onPrintText = () =>
    run('printText(text)', () =>
      printText('PrinterKit Example\nprintText() OK')
    );

  const onPrintHtml = () =>
    run('printHtml(html)', async () => {
      const ok = await printHtml(SAMPLE_HTML);
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
