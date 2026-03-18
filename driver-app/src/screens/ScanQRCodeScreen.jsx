import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
  Switch,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, Camera } from 'expo-camera';
import { COLORS } from '../utils/constants';
import { scanQR } from '../services/scanService';
import StudentCard from '../components/StudentCard';

// ─── Constants ────────────────────────────────────────────────────────────────
const SCAN_COOLDOWN_MS = 2000; // Minimum milliseconds between scans
const SCAN_FRAME_SIZE = 260;

// ─── Component ────────────────────────────────────────────────────────────────
const ScanQRCodeScreen = ({ navigation }) => {
  // Camera / permission state
  const [hasPermission, setHasPermission] = useState(null);

  // Scan lifecycle state
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null); // null = no result yet
  const [scanError, setScanError] = useState('');
  const [showResult, setShowResult] = useState(false);

  // ── DEV ONLY: Mock time state ──────────────────────────────────────────────
  const [mockEnabled, setMockEnabled] = useState(false);
  const [mockDate, setMockDate] = useState(new Date()); // Native date object for picker
  const [showMockPanel, setShowMockPanel] = useState(false);
  
  // For Android DatePicker dialog modal visibility
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState('date'); // 'date' or 'time'

  // Cooldown: track the timestamp of the last scan
  const lastScanTimeRef = useRef(0);

  // Animated scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanLineLoop = useRef(null);

  // ── Request camera permission on mount ────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ── Animate scan line while camera is active ──────────────────────────────
  useEffect(() => {
    if (hasPermission && !showResult) {
      startScanLineAnimation();
    } else {
      scanLineAnim.stopAnimation();
    }
    return () => scanLineAnim.stopAnimation();
  }, [hasPermission, showResult]);

  const startScanLineAnimation = () => {
    scanLineAnim.setValue(0);
    scanLineLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCAN_FRAME_SIZE - 4,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    scanLineLoop.current.start();
  };

  // ── QR code detected callback (from CameraView) ───────────────────────────
  const handleBarcodeScanned = useCallback(
    async ({ data }) => {
      // ── 2-second cooldown guard ──────────────────────────────────────────
      const now = Date.now();
      if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) return;
      if (isProcessing) return;

      lastScanTimeRef.current = now;
      setIsProcessing(true);
      setScanResult(null);
      setScanError('');

      try {
        // POST /api/driver/scan  { qrData: "GUNI|passId|userId|validUntil|signature" }
        // scanQR() trims whitespace before sending — raw data is NOT modified otherwise

        // DEV ONLY: build ISO mockTime when enabled
        let mockTimeISO = null;
        if (mockEnabled) {
          mockTimeISO = mockDate.toISOString();
        }

        const result = await scanQR(data, mockTimeISO);
        setScanResult(result);
        Vibration.vibrate(100); // Short success haptic
      } catch (err) {
        setScanError(err.message || 'Scan failed. Try again.');
        Vibration.vibrate([0, 80, 60, 80]); // Error haptic pattern
      } finally {
        setIsProcessing(false);
        setShowResult(true);
      }
    },
    [isProcessing]
  );

  // ── Reset: go back to camera view for another scan ────────────────────────
  const handleScanAgain = () => {
    setScanResult(null);
    setScanError('');
    setShowResult(false);
    lastScanTimeRef.current = 0; // Reset cooldown so next scan is immediate
  };

  // ── Permission denied ──────────────────────────────────────────────────────
  if (hasPermission === null) {
    return <PermissionMessage text="Requesting camera access..." />;
  }

  if (hasPermission === false) {
    return (
      <PermissionMessage
        icon="📷"
        title="Camera Access Required"
        text="Camera permission is required to scan student QR codes. Please enable it in your device settings."
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.root}>
      {!showResult ? (
        // ── Camera / Scanner View ────────────────────────────────────────────
        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />

          {/* Dark overlay with transparent scan-frame cutout */}
          <View style={styles.overlay}>
            {/* Top bar */}
            <View style={styles.overlayHeader}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.closeBtn}
                accessibilityLabel="Close scanner"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.overlayTitle}>Scan Student QR</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Scan frame with corner markers and animated line */}
            <View style={styles.scanFrame}>
              <Corner position="topLeft" />
              <Corner position="topRight" />
              <Corner position="bottomLeft" />
              <Corner position="bottomRight" />

              {/* Animated scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineAnim }] },
                ]}
              />
            </View>

            {/* Status badge */}
            <View style={styles.statusArea}>
              {isProcessing ? (
                <View style={styles.processingBadge}>
                  <Text style={styles.processingText}>⏳  Processing…</Text>
                </View>
              ) : (
                <Text style={styles.hintText}>
                  Point camera at student's QR code
                </Text>
              )}

              {/* Cooldown indicator shown briefly after a scan */}
              <Text style={styles.cooldownNote}>
                {SCAN_COOLDOWN_MS / 1000}s cooldown between scans
              </Text>

              {/* ── DEV ONLY: Mock Time Panel ───────────────────────────── */}
              <TouchableOpacity
                style={styles.devPanelToggle}
                onPress={() => setShowMockPanel(p => !p)}
                accessibilityLabel="Toggle mock time panel"
              >
                <Text style={styles.devPanelToggleText}>
                  🧪 DEV ONLY – Mock Scan Time {showMockPanel ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showMockPanel && (
                <View style={styles.devPanel}>
                  {/* Enable toggle */}
                  <View style={styles.devRow}>
                    <Text style={styles.devLabel}>Enable Mock Time</Text>
                    <Switch
                      value={mockEnabled}
                      onValueChange={setMockEnabled}
                      thumbColor={mockEnabled ? '#facc15' : '#6b7280'}
                      trackColor={{ false: '#374151', true: '#78350f' }}
                    />
                  </View>

                  {/* Datetime picker */}
                  {mockEnabled && (
                    <View style={styles.devPickerContainer}>
                      {Platform.OS === 'android' ? (
                        <>
                          <TouchableOpacity 
                             style={styles.androidPickerBtn} 
                             onPress={() => { setAndroidPickerMode('time'); setShowAndroidPicker(true); }}>
                            <Text style={styles.androidPickerBtnText}>Set Time</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                             style={styles.androidPickerBtn} 
                             onPress={() => { setAndroidPickerMode('date'); setShowAndroidPicker(true); }}>
                            <Text style={styles.androidPickerBtnText}>Set Date</Text>
                          </TouchableOpacity>
                          {showAndroidPicker && (
                            <DateTimePicker
                              value={mockDate}
                              mode={androidPickerMode}
                              display="default"
                              onChange={(event, selectedDate) => {
                                setShowAndroidPicker(false);
                                if (selectedDate) setMockDate(selectedDate);
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <Text style={styles.devLabel}>Time:</Text>
                          <DateTimePicker
                            value={mockDate}
                            mode="time"
                            display="default"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) setMockDate(selectedDate);
                            }}
                            themeVariant="dark" // good for the dark overlay
                          />
                          <Text style={styles.devLabel}>Date:</Text>
                          <DateTimePicker
                            value={mockDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) setMockDate(selectedDate);
                            }}
                            themeVariant="dark"
                          />
                        </>
                      )}
                    </View>
                  )}

                  {/* Active indicator */}
                  <Text style={styles.devStatus}>
                    {mockEnabled
                      ? `⏰ Mocking: ${mockDate.toLocaleString('en-IN')}`
                      : '🕐 Using real server time'}
                  </Text>
                </View>
              )}
              {/* ── END DEV PANEL ───────────────────────────────────────── */}
            </View>
          </View>
        </View>
      ) : (
        // ── Result View ──────────────────────────────────────────────────────
        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultHeader}>Scan Result</Text>

          {scanResult ? (
            // ── Success ──
            <>
              <View style={styles.successBanner}>
                <Text style={styles.bannerIcon}>✅</Text>
                <View style={styles.bannerTextCol}>
                  <Text style={styles.bannerTitle}>
                    {scanResult.scanPhase === 'boarding' ? 'Boarding Verified' : 'Return Verified'}
                  </Text>
                  <Text style={styles.bannerSub}>
                    {scanResult.message || 'QR code accepted'}
                  </Text>
                </View>
              </View>

              <StudentCard
                student={scanResult.student}
                scanPhase={scanResult.scanPhase}
                route={scanResult.route}
                shift={scanResult.shift}
              />

              {/* Scan count pill */}
              <View style={styles.scanCountRow}>
                <Text style={styles.scanCountLabel}>Daily scan count</Text>
                <View style={styles.scanCountPill}>
                  <Text style={styles.scanCountValue}>
                    {scanResult.scanCount} / {scanResult.maxScans}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // ── Error ──
            <View style={styles.errorBanner}>
              <Text style={styles.bannerIcon}>❌</Text>
              <View style={styles.bannerTextCol}>
                <Text style={styles.errorTitle}>Scan Rejected</Text>
                <Text style={styles.errorDesc}>{scanError || 'Unknown error occurred'}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={handleScanAgain}
            testID="btn-scan-again"
          >
            <Text style={styles.scanAgainText}>📷  Scan Another Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            testID="btn-done"
          >
            <Text style={styles.doneBtnText}>← Back to Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CORNER_SIZE = 32;
const CORNER_THICKNESS = 4;

const corners = {
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 8 },
};

const Corner = ({ position }) => (
  <View
    style={[
      {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: COLORS.primary,
        borderWidth: CORNER_THICKNESS,
      },
      corners[position],
    ]}
  />
);

const PermissionMessage = ({ icon, title, text, onBack }) => (
  <View style={styles.permissionContainer}>
    {icon && <Text style={styles.permIcon}>{icon}</Text>}
    {title && <Text style={styles.permTitle}>{title}</Text>}
    <Text style={styles.permText}>{text}</Text>
    {onBack && (
      <TouchableOpacity style={styles.permBackBtn} onPress={onBack}>
        <Text style={styles.permBackText}>Go Back</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // ── DEV Mock Time Panel ──────────────────────────────────────────────────────
  devPanelToggle: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  devPanelToggleText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  devPanel: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    padding: 12,
    width: 260,
    gap: 8,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devLabel: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
  },
  devPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  androidPickerBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  androidPickerBtnText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
  devStatus: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Camera ──────────────────────────────────────────────────────────────────
  cameraWrapper: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  overlayTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
    overflow: 'hidden',
    // Slight transparent window feel
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  statusArea: { alignItems: 'center', gap: 8 },
  hintText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  processingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
  },
  processingText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cooldownNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },

  // ── Result ───────────────────────────────────────────────────────────────────
  resultScroll: { flex: 1, backgroundColor: COLORS.background },
  resultContent: { padding: 20, paddingTop: 52, paddingBottom: 32 },
  resultHeader: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 18,
  },

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: 14,
    marginBottom: 4,
  },
  bannerIcon: { fontSize: 28 },
  bannerTextCol: { flex: 1 },
  bannerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  bannerSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    gap: 14,
    marginBottom: 16,
  },
  errorTitle: { color: '#FCA5A5', fontSize: 16, fontWeight: '700' },
  errorDesc: { color: '#FECACA', fontSize: 13, marginTop: 3, lineHeight: 19 },

  // Scan count
  scanCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  scanCountLabel: { color: COLORS.textSecondary, fontSize: 13 },
  scanCountPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scanCountValue: { color: COLORS.text, fontWeight: '700', fontSize: 14 },

  // CTA buttons
  scanAgainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  scanAgainText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  doneBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doneBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },

  // ── Permission screen ────────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  permIcon: { fontSize: 52, marginBottom: 16 },
  permTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  permText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
  permBackBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  permBackText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default ScanQRCodeScreen;
