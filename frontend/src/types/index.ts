export interface User {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    username: string
    email: string
  }
}

export interface FileItem {
  id: number
  name: string
  originalName: string
  contentType: string
  size: number
  path: string
  folderId: number | null
  folderName: string | null
  isPublic: boolean
  shareToken: string | null
  downloadCount: number
  createdAt: string
  updatedAt: string
}

export interface FolderItem {
  id: number
  name: string
  path: string
  parentId: number | null
  parentName: string | null
  fileCount: number
  subfolderCount: number
  createdAt: string
  updatedAt: string
  subfolders?: FolderItem[]
  files?: FileItem[]
}

export interface StorageStats {
  usedStorage: number
  maxStorage: number
  availableStorage: number
  totalFiles: number
  totalFolders: number
  usedPercentage: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
