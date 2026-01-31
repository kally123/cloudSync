import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' 
        ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
        : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
            sessionStorage.removeItem('token')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async login(username: string, password: string) {
    const response = await this.client.post('/api/auth/login', { username, password })
    return response.data
  }

  async register(username: string, email: string, password: string) {
    const response = await this.client.post('/api/auth/register', { username, email, password })
    return response.data
  }

  // Files
  async uploadFile(file: File, folderId?: number) {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId.toString())
    }
    const response = await this.client.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  async uploadFiles(files: File[], folderId?: number) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    if (folderId) {
      formData.append('folderId', folderId.toString())
    }
    const response = await this.client.post('/api/files/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  async getFiles() {
    const response = await this.client.get('/api/files')
    return response.data
  }

  async getRootFiles() {
    const response = await this.client.get('/api/files/root')
    return response.data
  }

  async getFilesInFolder(folderId: number) {
    const response = await this.client.get(`/api/files/folder/${folderId}`)
    return response.data
  }

  async getFile(fileId: number) {
    const response = await this.client.get(`/api/files/${fileId}`)
    return response.data
  }

  async downloadFile(fileId: number) {
    const response = await this.client.get(`/api/files/${fileId}/download`, {
      responseType: 'blob',
    })
    return response.data
  }

  async saveToLocalStorage(fileId: number, fileName: string) {
    // Check if File System Access API is supported
    if (!('showSaveFilePicker' in window)) {
      throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.')
    }

    try {
      // Download the file as blob first
      const blob = await this.downloadFile(fileId)
      
      // Show save file dialog to let user choose location (including USB drives)
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'All Files',
            accept: { '*/*': [] },
          },
        ],
      })

      // Create a writable stream
      const writable = await handle.createWritable()
      
      // Write the blob to the file
      await writable.write(blob)
      
      // Close the file and commit changes
      await writable.close()
      
      return { success: true, message: 'File saved successfully' }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Save cancelled by user')
      }
      throw error
    }
  }

  async deleteFile(fileId: number) {
    const response = await this.client.delete(`/api/files/${fileId}`)
    return response.data
  }

  async renameFile(fileId: number, newName: string) {
    const response = await this.client.put(`/api/files/${fileId}/rename`, null, {
      params: { name: newName },
    })
    return response.data
  }

  async shareFile(fileId: number) {
    const response = await this.client.post(`/api/files/${fileId}/share`)
    return response.data
  }

  async unshareFile(fileId: number) {
    const response = await this.client.delete(`/api/files/${fileId}/share`)
    return response.data
  }

  async getStorageStats() {
    const response = await this.client.get('/api/files/stats')
    return response.data
  }

  // Folders
  async createFolder(name: string, parentId?: number) {
    const response = await this.client.post('/api/folders', null, {
      params: { name, parentId },
    })
    return response.data
  }

  async getRootFolders() {
    const response = await this.client.get('/api/folders')
    return response.data
  }

  async getFolder(folderId: number) {
    const response = await this.client.get(`/api/folders/${folderId}`)
    return response.data
  }

  async getSubfolders(folderId: number) {
    const response = await this.client.get(`/api/folders/${folderId}/subfolders`)
    return response.data
  }

  async renameFolder(folderId: number, newName: string) {
    const response = await this.client.put(`/api/folders/${folderId}/rename`, null, {
      params: { name: newName },
    })
    return response.data
  }

  async deleteFolder(folderId: number) {
    const response = await this.client.delete(`/api/folders/${folderId}`)
    return response.data
  }
}

export const apiClient = new ApiClient()
