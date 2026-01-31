'use client'

import { StorageStats } from '@/types'
import { FiHardDrive } from 'react-icons/fi'

interface StorageInfoProps {
  stats: StorageStats
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function StorageInfo({ stats }: StorageInfoProps) {
  return (
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <FiHardDrive className="h-5 w-5" />
          <span className="text-sm font-medium">Storage</span>
        </div>
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">
              {formatBytes(stats.usedStorage)} of {formatBytes(stats.maxStorage)} used
            </span>
            <span className="text-gray-500">{stats.usedPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.usedPercentage, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-900">{stats.totalFiles}</span> files
          </div>
          <div>
            <span className="font-medium text-gray-900">{stats.totalFolders}</span> folders
          </div>
        </div>
      </div>
    </div>
  )
}
