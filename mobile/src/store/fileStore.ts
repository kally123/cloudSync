import { create } from 'zustand';
import { FileItem, FolderItem, StorageStats } from '../types';

interface FileState {
  files: FileItem[];
  folders: FolderItem[];
  currentFolderId: number | null;
  currentFolderName: string | null;
  breadcrumbs: { id: number | null; name: string }[];
  stats: StorageStats | null;
  isLoading: boolean;
  setFiles: (files: FileItem[]) => void;
  setFolders: (folders: FolderItem[]) => void;
  setCurrentFolder: (folderId: number | null, folderName: string | null) => void;
  setBreadcrumbs: (breadcrumbs: { id: number | null; name: string }[]) => void;
  setStats: (stats: StorageStats) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  folders: [],
  currentFolderId: null,
  currentFolderName: null,
  breadcrumbs: [{ id: null, name: 'Home' }],
  stats: null,
  isLoading: false,
  setFiles: (files) => set({ files }),
  setFolders: (folders) => set({ folders }),
  setCurrentFolder: (folderId, folderName) => set({ currentFolderId: folderId, currentFolderName: folderName }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ 
    files: [], 
    folders: [], 
    currentFolderId: null, 
    currentFolderName: null,
    breadcrumbs: [{ id: null, name: 'Home' }],
    stats: null 
  }),
}));
