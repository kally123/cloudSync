'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useFileStore } from '@/store/fileStore'
import { apiClient } from '@/lib/api'
import { StorageStats } from '@/types'
import Sidebar from '@/components/Sidebar'
import FileList from '@/components/FileList'
import FileUpload from '@/components/FileUpload'
import Breadcrumbs from '@/components/Breadcrumbs'
import StorageInfo from '@/components/StorageInfo'
import { FiPlus, FiUpload } from 'react-icons/fi'

export default function DashboardPage() {
  const router = useRouter()
  const { token, username, logout } = useAuthStore()
  const { 
    currentFolderId, 
    setFiles, 
    setFolders, 
    setBreadcrumbs, 
    setLoading,
    isLoading 
  } = useFileStore()
  
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    
    // Check both localStorage and sessionStorage as fallback
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token && !storedToken) {
      router.push('/login')
      return
    }
    loadData()
  }, [isHydrated, token, currentFolderId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load storage stats
      const statsResponse = await apiClient.getStorageStats()
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      // Load files and folders
      if (currentFolderId) {
        const folderResponse = await apiClient.getFolder(currentFolderId)
        if (folderResponse.success) {
          setFiles(folderResponse.data.files || [])
          setFolders(folderResponse.data.subfolders || [])
        }
      } else {
        const [filesResponse, foldersResponse] = await Promise.all([
          apiClient.getRootFiles(),
          apiClient.getRootFolders(),
        ])
        if (filesResponse.success) setFiles(filesResponse.data)
        if (foldersResponse.success) setFolders(foldersResponse.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const response = await apiClient.createFolder(newFolderName, currentFolderId || undefined)
      if (response.success) {
        loadData()
        setShowNewFolder(false)
        setNewFolderName('')
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!token && !localStorage.getItem('token')) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} username={username || ''} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Breadcrumbs />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiPlus className="h-4 w-4" />
                New Folder
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FiUpload className="h-4 w-4" />
                Upload
              </button>
            </div>
          </div>
        </header>

        {/* Storage Stats */}
        {stats && <StorageInfo stats={stats} />}

        {/* File List */}
        <main className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <FileList onRefresh={loadData} />
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => {
            setShowUpload(false)
            loadData()
          }}
          folderId={currentFolderId}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNewFolder(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
