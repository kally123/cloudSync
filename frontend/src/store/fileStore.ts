import { create } from 'zustand'
import { FileItem, FolderItem } from '@/types'

interface FileState {
  currentFolderId: number | null
  currentFolder: FolderItem | null
  files: FileItem[]
  folders: FolderItem[]
  breadcrumbs: { id: number | null; name: string }[]
  isLoading: boolean
  setCurrentFolder: (folder: FolderItem | null, folderId: number | null) => void
  setFiles: (files: FileItem[]) => void
  setFolders: (folders: FolderItem[]) => void
  setBreadcrumbs: (breadcrumbs: { id: number | null; name: string }[]) => void
  setLoading: (loading: boolean) => void
  addFile: (file: FileItem) => void
  removeFile: (fileId: number) => void
  addFolder: (folder: FolderItem) => void
  removeFolder: (folderId: number) => void
}

export const useFileStore = create<FileState>((set) => ({
  currentFolderId: null,
  currentFolder: null,
  files: [],
  folders: [],
  breadcrumbs: [{ id: null, name: 'Home' }],
  isLoading: false,
  setCurrentFolder: (folder, folderId) => set({ currentFolder: folder, currentFolderId: folderId }),
  setFiles: (files) => set({ files }),
  setFolders: (folders) => set({ folders }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setLoading: (isLoading) => set({ isLoading }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  removeFile: (fileId) => set((state) => ({ 
    files: state.files.filter((f) => f.id !== fileId) 
  })),
  addFolder: (folder) => set((state) => ({ folders: [...state.folders, folder] })),
  removeFolder: (folderId) => set((state) => ({ 
    folders: state.folders.filter((f) => f.id !== folderId) 
  })),
}))
