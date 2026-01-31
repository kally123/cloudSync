'use client'

import { useFileStore } from '@/store/fileStore'
import { apiClient } from '@/lib/api'
import { FiChevronRight, FiHome } from 'react-icons/fi'

export default function Breadcrumbs() {
  const { breadcrumbs, setCurrentFolder, setBreadcrumbs, setFiles, setFolders, setLoading } = useFileStore()

  const navigateTo = async (index: number) => {
    const crumb = breadcrumbs[index]
    setLoading(true)

    try {
      if (crumb.id === null) {
        // Navigate to root
        const [filesResponse, foldersResponse] = await Promise.all([
          apiClient.getRootFiles(),
          apiClient.getRootFolders(),
        ])
        setFiles(filesResponse.success ? filesResponse.data : [])
        setFolders(foldersResponse.success ? foldersResponse.data : [])
        setCurrentFolder(null, null)
      } else {
        // Navigate to folder
        const response = await apiClient.getFolder(crumb.id)
        if (response.success) {
          setFiles(response.data.files || [])
          setFolders(response.data.subfolders || [])
          setCurrentFolder(response.data, crumb.id)
        }
      }
      // Update breadcrumbs to remove items after clicked one
      setBreadcrumbs(breadcrumbs.slice(0, index + 1))
    } catch (error) {
      console.error('Navigation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id ?? 'home'} className="flex items-center">
          {index > 0 && <FiChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
          <button
            onClick={() => navigateTo(index)}
            className={`flex items-center gap-1 hover:text-primary-600 transition-colors ${
              index === breadcrumbs.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-500'
            }`}
          >
            {index === 0 && <FiHome className="h-4 w-4" />}
            {crumb.name}
          </button>
        </div>
      ))}
    </nav>
  )
}
