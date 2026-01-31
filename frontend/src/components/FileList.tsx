'use client'

import { useState } from 'react'
import { useFileStore } from '@/store/fileStore'
import { apiClient } from '@/lib/api'
import { FileItem, FolderItem } from '@/types'
import { format } from 'date-fns'
import {
  FiFolder,
  FiFile,
  FiImage,
  FiVideo,
  FiMusic,
  FiFileText,
  FiArchive,
  FiMoreVertical,
  FiDownload,
  FiTrash2,
  FiShare2,
  FiEdit2,
  FiLink,
} from 'react-icons/fi'

interface FileListProps {
  onRefresh: () => void
}

function getFileIcon(contentType: string | null) {
  if (!contentType) return FiFile
  if (contentType.startsWith('image/')) return FiImage
  if (contentType.startsWith('video/')) return FiVideo
  if (contentType.startsWith('audio/')) return FiMusic
  if (contentType.includes('pdf') || contentType.includes('document')) return FiFileText
  if (contentType.includes('zip') || contentType.includes('archive')) return FiArchive
  return FiFile
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileList({ onRefresh }: FileListProps) {
  const { files, folders, setCurrentFolder, setBreadcrumbs, breadcrumbs, setFiles, setFolders, setLoading } = useFileStore()
  const [activeMenu, setActiveMenu] = useState<{ type: 'file' | 'folder'; id: number } | null>(null)
  const [renameItem, setRenameItem] = useState<{ type: 'file' | 'folder'; id: number; name: string } | null>(null)

  const openFolder = async (folder: FolderItem) => {
    setLoading(true)
    try {
      const response = await apiClient.getFolder(folder.id)
      if (response.success) {
        setFiles(response.data.files || [])
        setFolders(response.data.subfolders || [])
        setCurrentFolder(response.data, folder.id)
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
      }
    } catch (error) {
      console.error('Failed to open folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const blob = await apiClient.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
    setActiveMenu(null)
  }

  const handleDelete = async (type: 'file' | 'folder', id: number) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return
    try {
      if (type === 'file') {
        await apiClient.deleteFile(id)
      } else {
        await apiClient.deleteFolder(id)
      }
      onRefresh()
    } catch (error) {
      console.error('Delete failed:', error)
    }
    setActiveMenu(null)
  }

  const handleShare = async (file: FileItem) => {
    try {
      if (file.isPublic) {
        await apiClient.unshareFile(file.id)
      } else {
        const response = await apiClient.shareFile(file.id)
        if (response.success && response.data.shareToken) {
          const shareUrl = `${window.location.origin}/share/${response.data.shareToken}`
          await navigator.clipboard.writeText(shareUrl)
          alert('Share link copied to clipboard!')
        }
      }
      onRefresh()
    } catch (error) {
      console.error('Share failed:', error)
    }
    setActiveMenu(null)
  }

  const handleRename = async () => {
    if (!renameItem || !renameItem.name.trim()) return
    try {
      if (renameItem.type === 'file') {
        await apiClient.renameFile(renameItem.id, renameItem.name)
      } else {
        await apiClient.renameFolder(renameItem.id, renameItem.name)
      }
      onRefresh()
    } catch (error) {
      console.error('Rename failed:', error)
    }
    setRenameItem(null)
  }

  const isEmpty = files.length === 0 && folders.length === 0

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FiFolder className="h-16 w-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">This folder is empty</p>
        <p className="text-sm">Upload files or create folders to get started</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={`folder-${folder.id}`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group relative"
        >
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => openFolder(folder)}
          >
            <div className="p-3 bg-primary-50 rounded-lg">
              <FiFolder className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              {renameItem?.type === 'folder' && renameItem.id === folder.id ? (
                <input
                  type="text"
                  value={renameItem.name}
                  onChange={(e) => setRenameItem({ ...renameItem, name: e.target.value })}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="w-full px-2 py-1 border rounded text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <p className="font-medium text-gray-900 truncate">{folder.name}</p>
              )}
              <p className="text-sm text-gray-500">
                {folder.fileCount} files, {folder.subfolderCount} folders
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setActiveMenu(activeMenu?.id === folder.id ? null : { type: 'folder', id: folder.id })
            }}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiMoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          {activeMenu?.type === 'folder' && activeMenu.id === folder.id && (
            <div className="absolute top-12 right-4 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
              <button
                onClick={() => {
                  setRenameItem({ type: 'folder', id: folder.id, name: folder.name })
                  setActiveMenu(null)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FiEdit2 className="h-4 w-4" /> Rename
              </button>
              <button
                onClick={() => handleDelete('folder', folder.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <FiTrash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Files */}
      {files.map((file) => {
        const FileIcon = getFileIcon(file.contentType)
        return (
          <div
            key={`file-${file.id}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group relative"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <FileIcon className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                {renameItem?.type === 'file' && renameItem.id === file.id ? (
                  <input
                    type="text"
                    value={renameItem.name}
                    onChange={(e) => setRenameItem({ ...renameItem, name: e.target.value })}
                    onBlur={handleRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    className="w-full px-2 py-1 border rounded text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                )}
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(file.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              {file.isPublic && (
                <FiLink className="h-4 w-4 text-green-500" title="Shared" />
              )}
            </div>
            <button
              onClick={() => setActiveMenu(activeMenu?.id === file.id ? null : { type: 'file', id: file.id })}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiMoreVertical className="h-5 w-5 text-gray-500" />
            </button>
            {activeMenu?.type === 'file' && activeMenu.id === file.id && (
              <div className="absolute top-12 right-4 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={() => handleDownload(file)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiDownload className="h-4 w-4" /> Download
                </button>
                <button
                  onClick={() => handleShare(file)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiShare2 className="h-4 w-4" /> {file.isPublic ? 'Unshare' : 'Share'}
                </button>
                <button
                  onClick={() => {
                    setRenameItem({ type: 'file', id: file.id, name: file.originalName })
                    setActiveMenu(null)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FiEdit2 className="h-4 w-4" /> Rename
                </button>
                <button
                  onClick={() => handleDelete('file', file.id)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
