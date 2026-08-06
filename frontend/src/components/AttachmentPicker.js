import React from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import styles from '../styles/AttachmentPicker.styles';

function normaliseAttachment(asset, source) {
  return {
    id: `${Date.now()}-${Math.random()}`,

    uri: asset.uri,

    name:
      asset.name ||
      asset.fileName ||
      `attachment-${Date.now()}`,

    mimeType:
      asset.mimeType ||
      asset.type ||
      'application/octet-stream',

    size:
      asset.size ||
      asset.fileSize ||
      null,

    source,
  };
}

export default function AttachmentPicker({
  attachments = [],
  onChange,
}) {
  const takePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'Please allow camera access to take a photo.'
      );

      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

    if (
      !result.canceled &&
      result.assets?.[0]
    ) {
      const newAttachment =
        normaliseAttachment(
          result.assets[0],
          'camera'
        );

      onChange([
        ...attachments,
        newAttachment,
      ]);
    }
  };

  const selectPhotoOrVideo = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Media permission required',
        'Please allow access to select a photo or video.'
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [
          'images',
          'videos',
        ],
        quality: 0.85,
        allowsMultipleSelection: true,
      });

    if (
      !result.canceled &&
      result.assets?.length
    ) {
      const selectedAttachments =
        result.assets.map((asset) =>
          normaliseAttachment(
            asset,
            'library'
          )
        );

      onChange([
        ...attachments,
        ...selectedAttachments,
      ]);
    }
  };

  const selectFile = async () => {
    const result =
      await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

    if (
      !result.canceled &&
      result.assets?.length
    ) {
      const selectedAttachments =
        result.assets.map((asset) =>
          normaliseAttachment(
            asset,
            'document'
          )
        );

      onChange([
        ...attachments,
        ...selectedAttachments,
      ]);
    }
  };

  const removeAttachment = (attachmentId) => {
    const remainingAttachments =
      attachments.filter(
        (attachment) =>
          attachment.id !== attachmentId
      );

    onChange(remainingAttachments);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Attachments
      </Text>

      <Text style={styles.helpText}>
        Add photos, videos, PDFs, or other
        supporting files.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={takePhoto}
        >
          <Text style={styles.actionText}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={selectPhotoOrVideo}
        >
          <Text style={styles.actionText}>
            Photo / Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={selectFile}
        >
          <Text style={styles.actionText}>
            Choose File
          </Text>
        </TouchableOpacity>
      </View>

      {attachments.map((attachment) => (
        <View
          key={attachment.id}
          style={styles.fileRow}
        >
          <View style={styles.fileInfo}>
            <Text
              style={styles.fileName}
              numberOfLines={1}
            >
              {attachment.name}
            </Text>

            <Text
              style={styles.fileMeta}
              numberOfLines={1}
            >
              {attachment.mimeType}

              {attachment.size
                ? ` • ${(
                    attachment.size /
                    1024 /
                    1024
                  ).toFixed(2)} MB`
                : ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              removeAttachment(
                attachment.id
              )
            }
          >
            <Text style={styles.removeText}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}