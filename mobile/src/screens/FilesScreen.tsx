import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import { useFileStore } from '../store/fileStore';
import { FileItem, FolderItem } from '../types';

export default function FilesScreen() {
  const {
    files,
    folders,
    currentFolderId,
    breadcrumbs,
    isLoading,
    setFiles,
    setFolders,
    setCurrentFolder,
    setBreadcrumbs,
    setLoading,
    setStats,
  } = useFileStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (currentFolderId) {
        const response = await apiClient.getFolder(currentFolderId);
        if (response.success) {
          setFiles(response.data.files || []);
          setFolders(response.data.subfolders || []);
        }
      } else {
        const [filesResponse, foldersResponse, statsResponse] = await Promise.all([
          apiClient.getRootFiles(),
          apiClient.getRootFolders(),
          apiClient.getStorageStats(),
        ]);
        setFiles(filesResponse.success ? filesResponse.data : []);
        setFolders(foldersResponse.success ? foldersResponse.data : []);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openFolder = async (folder: FolderItem) => {
    setLoading(true);
    try {
      const response = await apiClient.getFolder(folder.id);
      if (response.success) {
        setFiles(response.data.files || []);
        setFolders(response.data.subfolders || []);
        setCurrentFolder(folder.id, folder.name);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = async () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const parentCrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
      
      setLoading(true);
      try {
        if (parentCrumb.id === null) {
          const [filesResponse, foldersResponse] = await Promise.all([
            apiClient.getRootFiles(),
            apiClient.getRootFolders(),
          ]);
          setFiles(filesResponse.success ? filesResponse.data : []);
          setFolders(foldersResponse.success ? foldersResponse.data : []);
          setCurrentFolder(null, null);
        } else {
          const response = await apiClient.getFolder(parentCrumb.id);
          if (response.success) {
            setFiles(response.data.files || []);
            setFolders(response.data.subfolders || []);
            setCurrentFolder(parentCrumb.id, parentCrumb.name);
          }
        }
        setBreadcrumbs(newBreadcrumbs);
      } catch (error) {
        console.error('Failed to go back:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteFile = (file: FileItem) => {
    Alert.alert('Delete File', `Are you sure you want to delete "${file.originalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteFile(file.id);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete file');
          }
        },
      },
    ]);
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    Alert.alert('Delete Folder', `Are you sure you want to delete "${folder.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.deleteFolder(folder.id);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete folder');
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string | null): keyof typeof Ionicons.glyphMap => {
    if (!contentType) return 'document-outline';
    if (contentType.startsWith('image/')) return 'image-outline';
    if (contentType.startsWith('video/')) return 'videocam-outline';
    if (contentType.startsWith('audio/')) return 'musical-notes-outline';
    if (contentType.includes('pdf')) return 'document-text-outline';
    if (contentType.includes('zip') || contentType.includes('archive')) return 'archive-outline';
    return 'document-outline';
  };

  const renderItem = ({ item }: { item: FolderItem | FileItem }) => {
    const isFolder = 'subfolderCount' in item;

    if (isFolder) {
      const folder = item as FolderItem;
      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => openFolder(folder)}
          onLongPress={() => handleDeleteFolder(folder)}
        >
          <View style={[styles.iconContainer, styles.folderIcon]}>
            <Ionicons name="folder" size={24} color="#2563eb" />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{folder.name}</Text>
            <Text style={styles.itemMeta}>
              {folder.fileCount} files, {folder.subfolderCount} folders
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      );
    }

    const file = item as FileItem;
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onLongPress={() => handleDeleteFile(file)}
      >
        <View style={[styles.iconContainer, styles.fileIcon]}>
          <Ionicons name={getFileIcon(file.contentType)} size={24} color="#6b7280" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{file.originalName}</Text>
          <Text style={styles.itemMeta}>{formatFileSize(file.size)}</Text>
        </View>
        {file.isPublic && <Ionicons name="link-outline" size={20} color="#10b981" />}
      </TouchableOpacity>
    );
  };

  const allItems = [...folders, ...files];

  return (
    <View style={styles.container}>
      {/* Breadcrumb */}
      {breadcrumbs.length > 1 && (
        <TouchableOpacity style={styles.breadcrumb} onPress={goBack}>
          <Ionicons name="arrow-back" size={20} color="#2563eb" />
          <Text style={styles.breadcrumbText}>
            {breadcrumbs[breadcrumbs.length - 2].name}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading && allItems.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : allItems.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="folder-open-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>This folder is empty</Text>
          <Text style={styles.emptySubtext}>Upload files to get started</Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          renderItem={renderItem}
          keyExtractor={(item) => ('subfolderCount' in item ? `folder-${item.id}` : `file-${item.id}`)}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#2563eb']} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breadcrumbText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  list: {
    padding: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderIcon: {
    backgroundColor: '#eff6ff',
  },
  fileIcon: {
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
