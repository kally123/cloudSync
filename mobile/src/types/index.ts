export interface User {
  id: number;
  username: string;
  email: string;
}

export interface FileItem {
  id: number;
  originalName: string;
  storedName: string;
  contentType: string | null;
  size: number;
  isPublic: boolean;
  shareToken: string | null;
  folderId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  files?: FileItem[];
  subfolders?: FolderItem[];
  fileCount: number;
  subfolderCount: number;
}

export interface StorageStats {
  usedStorage: number;
  maxStorage: number;
  usedPercentage: number;
  totalFiles: number;
  totalFolders: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
}
