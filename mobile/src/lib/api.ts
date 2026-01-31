import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { ApiResponse, AuthResponse, FileItem, FolderItem, StorageStats } from '../types';

// Web-compatible storage helper
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync('token');
};

const clearAuth = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('user');
};

// Helper to fetch file as blob for web
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

// Update this to your actual backend URL
const API_BASE_URL = 'http://localhost:8080/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth endpoints
  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  // File endpoints
  getRootFiles: async (): Promise<ApiResponse<FileItem[]>> => {
    const response = await api.get('/files');
    return response.data;
  },

  getFilesInFolder: async (folderId: number): Promise<ApiResponse<FileItem[]>> => {
    const response = await api.get(`/files/folder/${folderId}`);
    return response.data;
  },

  uploadFile: async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    folderId?: number
  ): Promise<ApiResponse<FileItem>> => {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // For web, convert URI to Blob and create a File object
      const blob = await uriToBlob(fileUri);
      const file = new File([blob], fileName, { type: mimeType });
      formData.append('file', file);
    } else {
      // For React Native, use the URI format
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);
    }
    
    if (folderId) {
      formData.append('folderId', folderId.toString());
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (fileId: number): Promise<{ uri: string }> => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  saveToExternalStorage: async (fileId: number, fileName: string): Promise<{ success: boolean; uri?: string; error?: string }> => {
    try {
      if (Platform.OS === 'web') {
        // For web, use File System Access API (similar to frontend)
        if (!('showSaveFilePicker' in window)) {
          return { success: false, error: 'File System Access API is not supported in this browser.' };
        }

        const response = await api.get(`/files/${fileId}/download`, {
          responseType: 'blob',
        });
        const blob = response.data;

        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'All Files', accept: { '*/*': [] } }],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        return { success: true, uri: fileName };
      } else {
        // For React Native (Android/iOS)
        const FileSystem = await import('expo-file-system');
        const Sharing = await import('expo-sharing');

        // First download to cache directory
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        const downloadResumable = FileSystem.createDownloadResumable(
          `${API_BASE_URL}/files/${fileId}/download`,
          fileUri,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );

        const result = await downloadResumable.downloadAsync();
        if (!result) {
          return { success: false, error: 'Download failed' };
        }

        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          // Use the share dialog which allows saving to Files app, Google Drive, etc.
          await Sharing.shareAsync(result.uri, {
            UTI: '*/*',
            mimeType: '*/*',
            dialogTitle: 'Save to...',
          });
          return { success: true, uri: result.uri };
        } else {
          // Fallback: file is saved in cache
          return { success: true, uri: result.uri };
        }
      }
    } catch (error: any) {
      console.error('Save to external storage failed:', error);
      if (error.name === 'AbortError') {
        return { success: false, error: 'Save cancelled by user' };
      }
      return { success: false, error: error.message || 'Failed to save file' };
    }
  },

  deleteFile: async (fileId: number): Promise<ApiResponse<void>> => {
    console.log('deleteFile API called with fileId:', fileId);
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  renameFile: async (fileId: number, newName: string): Promise<ApiResponse<FileItem>> => {
    const response = await api.put(`/files/${fileId}/rename`, null, {
      params: { name: newName },
    });
    return response.data;
  },

  shareFile: async (fileId: number): Promise<ApiResponse<FileItem>> => {
    const response = await api.post(`/files/${fileId}/share`);
    return response.data;
  },

  unshareFile: async (fileId: number): Promise<ApiResponse<FileItem>> => {
    const response = await api.delete(`/files/${fileId}/share`);
    return response.data;
  },

  // Folder endpoints
  getRootFolders: async (): Promise<ApiResponse<FolderItem[]>> => {
    const response = await api.get('/folders');
    return response.data;
  },

  getFolder: async (folderId: number): Promise<ApiResponse<FolderItem>> => {
    const response = await api.get(`/folders/${folderId}`);
    return response.data;
  },

  createFolder: async (name: string, parentId?: number): Promise<ApiResponse<FolderItem>> => {
    const response = await api.post('/folders', { name, parentId });
    return response.data;
  },

  deleteFolder: async (folderId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/folders/${folderId}`);
    return response.data;
  },

  renameFolder: async (folderId: number, newName: string): Promise<ApiResponse<FolderItem>> => {
    const response = await api.put(`/folders/${folderId}/rename`, null, {
      params: { name: newName },
    });
    return response.data;
  },

  // Storage stats
  getStorageStats: async (): Promise<ApiResponse<StorageStats>> => {
    const response = await api.get('/files/stats');
    return response.data;
  },
};

export default api;
