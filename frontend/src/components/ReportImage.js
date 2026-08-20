import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getReportImage } from '../api/reports';
import { colors } from '../theme/colors';
import styles from '../styles/ReportImage.styles';

/**
 * components/ReportImage.js
 * ----------------------------------------------------------------
 * Renders one attachment image in a report's detail view, as a
 * thumbnail. `imageRef` is a structured object ({reportLinkName,
 * recordId, subformName, fieldName, subformRecordId}) - the backend
 * reconstructs the real Zoho download URL from these 5 pieces and
 * returns a base64 data URI (see api/reports.js's getReportImage).
 *
 * NEW: tapping the thumbnail opens a full-screen modal showing the
 * SAME already-loaded image at full size (resizeMode="contain", so
 * it scales to fit the screen without cropping or distortion) - no
 * second fetch needed, the data URI is already in memory. A close
 * (X) button sits at the top to dismiss back to the report.
 * ----------------------------------------------------------------
 */
export default function ReportImage({ imageRef }) {
  const insets = useSafeAreaInsets();

  const [dataUri, setDataUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setHasError(false);

      try {
        const response = await getReportImage(imageRef);

        if (!cancelled) {
          setDataUri(response.data?.dataUri || null);
        }
      } catch (error) {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageRef]);

  if (loading) {
    return (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" color={colors.blue} />
      </View>
    );
  }

  if (hasError || !dataUri) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="image-outline" size={20} color={colors.textFaint} />
        <Text style={styles.errorText}>Could not load</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerVisible(true)}>
        <Image source={{ uri: dataUri }} style={styles.image} resizeMode="cover" />
      </TouchableOpacity>

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerBackdrop}>
          <TouchableOpacity
            style={[styles.viewerCloseButton, { top: insets.top + 12 }]}
            onPress={() => setViewerVisible(false)}
            accessibilityLabel="Close"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color={colors.textOnDark} />
          </TouchableOpacity>

          <Image
            source={{ uri: dataUri }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
}