import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { useFileStore } from '../store/fileStore';

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function UploadScreen() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentFolderId } = useFileStore();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No files', 'Please select files to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        await apiClient.uploadFile(file.uri, file.name, file.type, currentFolderId || undefined);
        successCount++;
      } catch (error) {
        console.error('Upload failed:', error);
        failCount++;
      }
      setUploadProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setIsUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);

    if (failCount === 0) {
      Alert.alert('Success', `${successCount} file(s) uploaded successfully`);
    } else {
      Alert.alert('Partial Success', `${successCount} uploaded, ${failCount} failed`);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      {/* Upload Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
          <View style={styles.optionIconContainer}>
            <Ionicons name="images" size={32} color="#2563eb" />
          </View>
          <Text style={styles.optionTitle}>Photos & Videos</Text>
          <Text style={styles.optionSubtitle}>Select from gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={pickDocument}>
          <View style={styles.optionIconContainer}>
            <Ionicons name="document" size={32} color="#2563eb" />
          </View>
          <Text style={styles.optionTitle}>Documents</Text>
          <Text style={styles.optionSubtitle}>Browse files</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>
            Selected Files ({selectedFiles.length})
          </Text>
          <View style={styles.selectedList}>
            {selectedFiles.map((file, index) => (
              <View key={index} style={styles.selectedItem}>
                {file.type.startsWith('image/') ? (
                  <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.fileThumbnail}>
                    <Ionicons name="document" size={24} color="#6b7280" />
                  </View>
                )}
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeButton}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <View style={styles.uploadContainer}>
          {isUploading ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.progressText}>
                Uploading... {Math.round(uploadProgress)}%
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={uploadFiles}>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>
                Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Empty State */}
      {selectedFiles.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-upload-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>Select files to upload</Text>
          <Text style={styles.emptySubtext}>
            Choose photos, videos, or documents from your device
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  optionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  selectedContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectedList: {
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  fileThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  uploadContainer: {
    padding: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
