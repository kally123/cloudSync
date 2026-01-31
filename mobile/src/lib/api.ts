import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, AuthResponse, FileItem, FolderItem, StorageStats } from '../types';

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
    const token = await SecureStore.getItemAsync('token');
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
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth endpoints
  login: async (usernameOrEmail: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', { usernameOrEmail, password });
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
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
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

  deleteFile: async (fileId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  renameFile: async (fileId: number, newName: string): Promise<ApiResponse<FileItem>> => {
    const response = await api.patch(`/files/${fileId}/rename`, null, {
      params: { newName },
    });
    return response.data;
  },

  shareFile: async (fileId: number): Promise<ApiResponse<FileItem>> => {
    const response = await api.post(`/files/${fileId}/share`);
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
    const response = await api.patch(`/folders/${folderId}/rename`, null, {
      params: { newName },
    });
    return response.data;
  },

  // Storage stats
  getStorageStats: async (): Promise<ApiResponse<StorageStats>> => {
    const response = await api.get('/storage/stats');
    return response.data;
  },
};

export default api;
