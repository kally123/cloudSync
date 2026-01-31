'use client'

import { FiCloud, FiFolder, FiHardDrive, FiLogOut, FiSettings, FiHome } from 'react-icons/fi'
import { useFileStore } from '@/store/fileStore'

interface SidebarProps {
  onLogout: () => void
  username: string
}

export default function Sidebar({ onLogout, username }: SidebarProps) {
  const { setCurrentFolder, setBreadcrumbs } = useFileStore()

  const goHome = () => {
    setCurrentFolder(null, null)
    setBreadcrumbs([{ id: null, name: 'Home' }])
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FiCloud className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">CloudSync</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={goHome}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
        >
          <FiHome className="h-5 w-5" />
          <span>Home</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors">
          <FiFolder className="h-5 w-5" />
          <span>All Files</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors">
          <FiHardDrive className="h-5 w-5" />
          <span>Storage</span>
        </button>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-3">
          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{username}</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
