import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
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

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');

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
    console.log('Delete File Triggered:', file);
    setShowFileMenu(false);
    Alert.alert('Delete File', `Are you sure you want to delete "${file.originalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Before calling deleteFile API for file ID:', file.id);
            await apiClient.deleteFile(file.id);
            console.log('File deleted successfully');
            loadData();
          } catch (error) {
            console.error('Error occurred while calling deleteFile API:', error);
            Alert.alert('Error', 'Failed to delete file');
          }
        },
      },
    ]);
  };

  const handleDeleteFolder = (folder: FolderItem) => {
    console.log('Delete Folder Triggered:', folder);
    setShowFolderMenu(false);
    Alert.alert('Delete Folder', `Are you sure you want to delete "${folder.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Calling deleteFolder API for folder ID:', folder.id);
            await apiClient.deleteFolder(folder.id);
            console.log('Folder deleted successfully');
            loadData();
          } catch (error) {
            console.error('Error deleting folder:', error);
            Alert.alert('Error', 'Failed to delete folder');
          }
        },
      },
    ]);
  };

  const handleShareFile = async (file: FileItem) => {
    setShowFileMenu(false);
    try {
      const response = await apiClient.shareFile(file.id);
      if (response.success && response.data.shareLink) {
        const shareUrl = `http://localhost:8080${response.data.shareLink}`;
        Alert.alert('File Shared', `Share link copied!\n\n${shareUrl}`, [
          { text: 'OK' },
          { 
            text: 'Open', 
            onPress: () => {
              if (Platform.OS === 'web') {
                window.open(shareUrl, '_blank');
              } else {
                Linking.openURL(shareUrl);
              }
            }
          },
        ]);
        loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleUnshareFile = async (file: FileItem) => {
    setShowFileMenu(false);
    try {
      await apiClient.unshareFile(file.id);
      Alert.alert('Success', 'File is no longer shared');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to unshare file');
    }
  };

  const handleRenameFile = async () => {
    if (!selectedFile || !newName.trim()) return;
    setShowRenameModal(false);
    try {
      await apiClient.renameFile(selectedFile.id, newName.trim());
      loadData();
      setNewName('');
      setSelectedFile(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename file');
    }
  };

  const handleRenameFolder = async () => {
    if (!selectedFolder || !newName.trim()) return;
    setShowRenameModal(false);
    try {
      await apiClient.renameFolder(selectedFolder.id, newName.trim());
      loadData();
      setNewName('');
      setSelectedFolder(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to rename folder');
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    setShowFileMenu(false);
    try {
      const downloadUrl = `http://localhost:8080/api/files/${file.id}/download`;
      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
      } else {
        Linking.openURL(downloadUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleSaveToStorage = async (file: FileItem) => {
    setShowFileMenu(false);
    try {
      const result = await apiClient.saveToExternalStorage(file.id, file.originalName);
      if (result.success) {
        if (Platform.OS === 'web') {
          Alert.alert('Success', 'File saved successfully!');
        } else {
          Alert.alert('Success', 'File saved successfully! You can now access it from your Files app or chosen location.');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to save file');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save file to storage');
    }
  };

  const openFileMenu = (file: FileItem) => {
    setSelectedFile(file);
    setShowFileMenu(true);
  };

  const openFolderMenu = (folder: FolderItem) => {
    setSelectedFolder(folder);
    setShowFolderMenu(true);
  };

  const openRenameModal = (isFolder: boolean) => {
    if (isFolder && selectedFolder) {
      setNewName(selectedFolder.name);
    } else if (selectedFile) {
      const nameWithoutExt = selectedFile.originalName.replace(/\.[^/.]+$/, '');
      setNewName(nameWithoutExt);
    }
    setShowFileMenu(false);
    setShowFolderMenu(false);
    setShowRenameModal(true);
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
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => openFolderMenu(folder)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    const file = item as FileItem;
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openFileMenu(file)}
      >
        <View style={[styles.iconContainer, styles.fileIcon]}>
          <Ionicons name={getFileIcon(file.contentType)} size={24} color="#6b7280" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{file.originalName}</Text>
          <Text style={styles.itemMeta}>{formatFileSize(file.size)}</Text>
        </View>
        {file.isPublic && (
          <View style={styles.sharedBadge}>
            <Ionicons name="link" size={14} color="#10b981" />
          </View>
        )}
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => openFileMenu(file)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
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

      {/* File Action Menu */}
      <Modal
        visible={showFileMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFileMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFileMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {selectedFile?.originalName}
            </Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => selectedFile && handleDownloadFile(selectedFile)}
            >
              <Ionicons name="download-outline" size={22} color="#374151" />
              <Text style={styles.menuItemText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => selectedFile && handleSaveToStorage(selectedFile)}
            >
              <Ionicons name="save-outline" size={22} color="#374151" />
              <Text style={styles.menuItemText}>Save to External Storage</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => openRenameModal(false)}
            >
              <Ionicons name="pencil-outline" size={22} color="#374151" />
              <Text style={styles.menuItemText}>Rename</Text>
            </TouchableOpacity>

            {selectedFile?.isPublic ? (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => selectedFile && handleUnshareFile(selectedFile)}
              >
                <Ionicons name="link-outline" size={22} color="#ef4444" />
                <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Remove Share Link</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => selectedFile && handleShareFile(selectedFile)}
              >
                <Ionicons name="share-outline" size={22} color="#374151" />
                <Text style={styles.menuItemText}>Share</Text>
              </TouchableOpacity>
            )}

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                console.log('Delete button clicked. Selected file:', selectedFile);
                selectedFile && handleDeleteFile(selectedFile);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowFileMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Folder Action Menu */}
      <Modal
        visible={showFolderMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFolderMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {selectedFolder?.name}
            </Text>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => openRenameModal(true)}
            >
              <Ionicons name="pencil-outline" size={22} color="#374151" />
              <Text style={styles.menuItemText}>Rename</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => selectedFolder && handleDeleteFolder(selectedFolder)}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowFolderMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowRenameModal(false)}
        >
          <View style={styles.renameContainer}>
            <Text style={styles.renameTitle}>
              Rename {selectedFolder ? 'Folder' : 'File'}
            </Text>
            <TextInput
              style={styles.renameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter new name"
              autoFocus
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity 
                style={styles.renameCancelButton} 
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.renameConfirmButton} 
                onPress={selectedFolder ? handleRenameFolder : handleRenameFile}
              >
                <Text style={styles.renameConfirmText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuButton: {
    padding: 8,
    marginLeft: 4,
  },
  sharedBadge: {
    backgroundColor: '#d1fae5',
    padding: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  deleteText: {
    color: '#ef4444',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  renameContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 16,
    padding: 24,
  },
  renameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
  },
  renameCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  renameConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
  },
  renameConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
