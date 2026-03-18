import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, RADIUS, SHADOW } from '../utils/constants';
import { reportFoundItem } from '../services/lostFoundService';
import { useAuth } from '../context/AuthContext';

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'id_card',     label: 'ID Card',     icon: 'card-account-details-outline' },
  { value: 'bag',         label: 'Bag',          icon: 'bag-personal-outline' },
  { value: 'electronics', label: 'Electronics',  icon: 'cellphone' },
  { value: 'clothing',    label: 'Clothing',     icon: 'tshirt-crew-outline' },
  { value: 'documents',   label: 'Documents',    icon: 'file-document-outline' },
  { value: 'water_bottle',label: 'Bottle',       icon: 'bottle-soda-outline' },
  { value: 'other',       label: 'Other',        icon: 'package-variant-closed' },
];

const today = new Date();

const ReportFoundItemScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    itemName: '',
    category: '',
    description: '',
    foundDate: today,
    imageBase64: null,
    storageLocation: { location: '', rack: '', box: '' },
  });

  const [imageUri, setImageUri]         = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [error, setError]               = useState('');

  // ─── Image Picker ─────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }

    Alert.alert(
      'Add Photo',
      'How would you like to add a photo?',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setImageUri(asset.uri);
              setForm(f => ({ ...f, imageBase64: `data:image/jpeg;base64,${asset.base64}` }));
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.5,
              base64: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setImageUri(asset.uri);
              setForm(f => ({ ...f, imageBase64: `data:image/jpeg;base64,${asset.base64}` }));
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ─── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (!form.itemName.trim()) { setError('Item name is required.'); return; }
    if (!form.category)        { setError('Please select a category.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }

    setSubmitting(true);
    try {
      await reportFoundItem({
        itemName:        form.itemName.trim(),
        category:        form.category,
        description:     form.description.trim(),
        foundDate:       form.foundDate.toISOString().split('T')[0],
        imageBase64:     form.imageBase64 || null,
        storageLocation: form.storageLocation,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.successBox}>
          <View style={styles.successIconBox}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
          </View>
          <Text style={styles.successTitle}>Item Logged!</Text>
          <Text style={styles.successSub}>
            The item has been recorded and posted on the board. Students can now see and claim it.
          </Text>
          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.white} />
            <Text style={styles.successBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Report Found Item</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* ── Auto-link banner ── */}
        <View style={styles.banner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.bannerText}>
            Bus &amp; Route will be auto-linked from your assignment.
          </Text>
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Item Name ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Item Name <Text style={styles.req}>*</Text></Text>
          <View style={styles.inputRow}>
            <Ionicons name="pricetag-outline" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Blue Water Bottle"
              placeholderTextColor={COLORS.textMuted}
              value={form.itemName}
              onChangeText={v => { setForm(f => ({ ...f, itemName: v })); setError(''); }}
            />
          </View>
        </View>

        {/* ── Category ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category <Text style={styles.req}>*</Text></Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const active = form.category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.categoryBtn, active && styles.categoryBtnActive]}
                  onPress={() => { setForm(f => ({ ...f, category: cat.value })); setError(''); }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={22}
                    color={active ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.textarea}
            placeholder="Colour, brand, where found on the bus, any identifiable details..."
            placeholderTextColor={COLORS.textMuted}
            value={form.description}
            onChangeText={v => { setForm(f => ({ ...f, description: v })); setError(''); }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── Date Found ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date Found <Text style={styles.req}>*</Text></Text>
          <TouchableOpacity style={styles.inputRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.input, { paddingVertical: 0 }]}>
              {form.foundDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
            <Ionicons name="chevron-down-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.foundDate}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
              maximumDate={today}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (event.type !== 'dismissed' && date) {
                  setForm(f => ({ ...f, foundDate: date }));
                }
                if (Platform.OS === 'android') setShowDatePicker(false);
              }}
            />
          )}
        </View>

        {/* ── Storage Location (Optional) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Storage Location <Text style={styles.optional}>(Optional)</Text></Text>
          <View style={styles.storageRow}>
            {[
              { key: 'location', placeholder: 'Place (e.g. Depot)' },
              { key: 'rack',     placeholder: 'Rack (e.g. A)' },
              { key: 'box',      placeholder: 'Box (e.g. 3)' },
            ].map(field => (
              <TextInput
                key={field.key}
                style={styles.storageInput}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={form.storageLocation[field.key]}
                onChangeText={v =>
                  setForm(f => ({ ...f, storageLocation: { ...f.storageLocation, [field.key]: v } }))
                }
              />
            ))}
          </View>
        </View>

        {/* ── Photo ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Photo of Item <Text style={styles.optional}>(Recommended)</Text></Text>
          <TouchableOpacity style={[styles.photoBox, imageUri && styles.photoBoxFilled]} onPress={pickImage} activeOpacity={0.7}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.preview} />
                <View style={styles.photoOverlay}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.white} />
                  <Text style={styles.photoChangeText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="camera-outline" size={28} color={COLORS.textSecondary} />
                <Text style={styles.photoTitle}>Tap to add a photo</Text>
                <Text style={styles.photoSub}>Take a photo or choose from gallery · Max 2 MB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Submit button ── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <>
                <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitBtnText}>Submit Report</Text>
              </>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 52,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  topTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  bannerText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600', lineHeight: 18 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: COLORS.danger, fontSize: 13, lineHeight: 18 },

  // Fields
  fieldGroup: { paddingHorizontal: 16, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, letterSpacing: 0.3 },
  req: { color: COLORS.danger },
  optional: { color: COLORS.textMuted, fontWeight: '400' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    gap: 10,
    ...SHADOW.card,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  textarea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 100,
    ...SHADOW.card,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBtn: {
    width: '30%',
    flex: 1,
    minWidth: 86,
    maxWidth: 110,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    ...SHADOW.card,
  },
  categoryBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  categoryLabelActive: { color: COLORS.primary },

  // Storage
  storageRow: { flexDirection: 'row', gap: 8 },
  storageInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 10,
    fontSize: 12,
    color: COLORS.textPrimary,
  },

  // Photo
  photoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  photoBoxFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.success,
    padding: 0,
    height: 180,
  },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.50)',
    padding: 8,
  },
  photoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  photoSub: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  photoChangeText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  // Buttons
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...SHADOW.elevated,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },

  // Success
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.background,
  },
  successIconBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 28,
    ...SHADOW.elevated,
  },
  successBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

export default ReportFoundItemScreen;
