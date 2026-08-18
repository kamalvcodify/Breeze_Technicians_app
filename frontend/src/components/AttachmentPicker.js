import React from 'react';
import {
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import styles from '../styles/AttachmentPicker.styles';

/**
 * components/AttachmentPicker.js
 * ----------------------------------------------------------------
 * IMAGE-ONLY now - no video, no arbitrary files. Only two actions:
 * Take Photo (camera) and Choose Photo (library), both restricted
 * to images only.
 *
 * Every picked/captured image is compressed/resized via
 * expo-image-manipulator (works on native AND web).
 *
 * FIX: expo-file-system's copyAsync/getInfoAsync are NATIVE-ONLY -
 * they don't exist on web at all (there's no equivalent of "the
 * device's shared Photos storage" to copy away from in a browser -
 * the browser already sandboxes everything itself). On web, the
 * manipulated image's own URI (already a browser-scoped blob:/
 * data: URI) is used directly, with no separate copy step and no
 * file-size lookup (size just isn't available there, so it's shown
 * as unknown). On native (iOS/Android), the full compress + copy
 * into the app's private cache directory still happens exactly as
 * before.
 *
 * MAX_ATTACHMENTS (10) enforced here - once reached, both action
 * buttons disable with a message.
 *
 * NEW native dependencies (iOS/Android only need a fresh EAS build
 * for these - web doesn't need a rebuild since Metro/web bundling
 * picks up JS changes immediately):
 *   - expo-image-manipulator
 *   - expo-file-system
 * ----------------------------------------------------------------
 */
const MAX_ATTACHMENTS = 10;
const COMPRESS_QUALITY = 0.6; // 0-1 - roughly "medium-good" JPEG quality
const MAX_DIMENSION = 1600; // longest side, px

async function compressAndStoreLocally(sourceUri, suggestedName) {
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  if (Platform.OS === 'web') {
    // No FileSystem cache-copy on web - see the comment block
    // above. The manipulated URI is already safely browser-scoped.
    return {
      uri: manipulated.uri,
      name: suggestedName || fileName,
      mimeType: 'image/jpeg',
      size: null,
    };
  }

  const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.copyAsync({
    from: manipulated.uri,
    to: destinationUri,
  });

  const fileInfo = await FileSystem.getInfoAsync(destinationUri, { size: true });

  return {
    uri: destinationUri,
    name: suggestedName || fileName,
    mimeType: 'image/jpeg',
    size: fileInfo.size || null,
  };
}

function normaliseAttachment(processedFile, source) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    uri: processedFile.uri,
    name: processedFile.name,
    mimeType: processedFile.mimeType,
    size: processedFile.size,
    source,
  };
}

export default function AttachmentPicker({ attachments = [], onChange }) {
  const isFull = attachments.length >= MAX_ATTACHMENTS;

  const takePhoto = async () => {
    if (isFull) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} photos.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      const processed = await compressAndStoreLocally(
        result.assets[0].uri,
        result.assets[0].fileName
      );

      onChange([...attachments, normaliseAttachment(processed, 'camera')]);
    }
  };

  const choosePhoto = async () => {
    if (isFull) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_ATTACHMENTS} photos.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Photo library permission required', 'Please allow access to select photos.');
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets?.length) {
      const processedFiles = await Promise.all(
        result.assets.map((asset) => compressAndStoreLocally(asset.uri, asset.fileName))
      );

      const newAttachments = processedFiles.map((file) => normaliseAttachment(file, 'library'));

      onChange([...attachments, ...newAttachments]);
    }
  };

  const removeAttachment = (attachmentId) => {
    onChange(attachments.filter((attachment) => attachment.id !== attachmentId));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Attachments</Text>

      <Text style={styles.helpText}>
        Add up to {MAX_ATTACHMENTS} photos. Images only - no videos or documents.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isFull && styles.actionButtonDisabled]}
          onPress={takePhoto}
          disabled={isFull}
        >
          <Text style={[styles.actionText, isFull && styles.actionTextDisabled]}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isFull && styles.actionButtonDisabled]}
          onPress={choosePhoto}
          disabled={isFull}
        >
          <Text style={[styles.actionText, isFull && styles.actionTextDisabled]}>
            Choose Photo
          </Text>
        </TouchableOpacity>
      </View>

      {isFull && (
        <Text style={styles.limitText}>Limit of {MAX_ATTACHMENTS} photos reached.</Text>
      )}

      {attachments.map((attachment, index) => (
        <View key={attachment.id} style={styles.fileRow}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {index + 1}. {attachment.name}
            </Text>

            <Text style={styles.fileMeta} numberOfLines={1}>
              {attachment.mimeType}
              {attachment.size ? ` • ${(attachment.size / 1024 / 1024).toFixed(2)} MB` : ''}
            </Text>
          </View>

          <TouchableOpacity onPress={() => removeAttachment(attachment.id)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}