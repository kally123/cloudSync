// CloudSync Frontend Application
const API_BASE = '/api';
let authToken = null;
let currentUser = null;
let currentFolderId = null;
let selectedItem = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const mainApp = document.getElementById('mainApp');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    authToken = localStorage.getItem('token');
    currentUser = localStorage.getItem('username');
    
    if (authToken && currentUser) {
        showMainApp();
        loadFiles();
        loadStorageStats();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
    mainApp.style.display = 'none';
}

function showRegister() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    mainApp.style.display = 'none';
}

function showMainApp() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    mainApp.style.display = 'block';
    document.getElementById('userDisplay').textContent = currentUser;
}

function setupEventListeners() {
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
    document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // File operations
    document.getElementById('uploadZone').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('newFolderBtn').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('newFolderModal')).show();
    });
    document.getElementById('createFolderBtn').addEventListener('click', handleCreateFolder);

    // Drag and drop
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', handleDrop);

    // Navigation
    document.getElementById('navAllFiles').addEventListener('click', (e) => { 
        e.preventDefault(); 
        currentFolderId = null;
        document.getElementById('searchBar').style.display = 'none';
        loadFiles(); 
    });
    document.getElementById('navSearch').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('searchBar').style.display = 'block';
    });
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Context menu
    document.addEventListener('click', () => hideContextMenu());
    document.getElementById('contextDownload').addEventListener('click', handleDownload);
    document.getElementById('contextShare').addEventListener('click', handleShare);
    document.getElementById('contextRename').addEventListener('click', handleRename);
    document.getElementById('contextDelete').addEventListener('click', handleDelete);
}

// Auth handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.username;
            localStorage.setItem('token', authToken);
            localStorage.setItem('username', currentUser);
            showMainApp();
            loadFiles();
            loadStorageStats();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (data.success) {
            authToken = data.data.token;
            currentUser = data.data.username;
            localStorage.setItem('token', authToken);
            localStorage.setItem('username', currentUser);
            showMainApp();
            loadFiles();
            loadStorageStats();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    authToken = null;
    currentUser = null;
    showLogin();
}

// File operations
async function loadFiles() {
    try {
        let url = currentFolderId 
            ? `${API_BASE}/files/folder/${currentFolderId}`
            : `${API_BASE}/files/root`;
        
        const [filesResponse, foldersResponse] = await Promise.all([
            fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } }),
            currentFolderId 
                ? fetch(`${API_BASE}/folders/${currentFolderId}/subfolders`, { headers: { 'Authorization': `Bearer ${authToken}` } })
                : fetch(`${API_BASE}/folders`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        ]);

        const filesData = await filesResponse.json();
        const foldersData = await foldersResponse.json();

        const files = filesData.success ? filesData.data : [];
        const folders = foldersData.success ? foldersData.data : [];

        renderFilesAndFolders(folders, files);
        updateBreadcrumb();
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

function renderFilesAndFolders(folders, files) {
    const grid = document.getElementById('filesGrid');
    const emptyState = document.getElementById('emptyState');

    if (folders.length === 0 && files.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = '';

    // Render folders
    folders.forEach(folder => {
        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card file-card h-100" data-type="folder" data-id="${folder.id}" 
                     ondblclick="openFolder(${folder.id})" oncontextmenu="showContextMenu(event, 'folder', ${folder.id})">
                    <div class="card-body text-center">
                        <i class="bi bi-folder-fill folder-icon display-4"></i>
                        <p class="card-text mt-2 mb-0 text-truncate">${folder.name}</p>
                        <small class="text-muted">${folder.fileCount || 0} files</small>
                    </div>
                </div>
            </div>
        `;
    });

    // Render files
    files.forEach(file => {
        const icon = getFileIcon(file.contentType);
        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card file-card h-100" data-type="file" data-id="${file.id}"
                     oncontextmenu="showContextMenu(event, 'file', ${file.id})">
                    <div class="card-body text-center">
                        <i class="bi ${icon} file-icon display-4"></i>
                        <p class="card-text mt-2 mb-0 text-truncate">${file.originalName}</p>
                        <small class="text-muted">${file.formattedSize || formatBytes(file.size)}</small>
                    </div>
                </div>
            </div>
        `;
    });
}

function getFileIcon(contentType) {
    if (!contentType) return 'bi-file-earmark';
    if (contentType.startsWith('image/')) return 'bi-file-earmark-image';
    if (contentType.startsWith('video/')) return 'bi-file-earmark-play';
    if (contentType.startsWith('audio/')) return 'bi-file-earmark-music';
    if (contentType.includes('pdf')) return 'bi-file-earmark-pdf';
    if (contentType.includes('word') || contentType.includes('document')) return 'bi-file-earmark-word';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'bi-file-earmark-excel';
    if (contentType.includes('zip') || contentType.includes('archive')) return 'bi-file-earmark-zip';
    if (contentType.includes('text')) return 'bi-file-earmark-text';
    return 'bi-file-earmark';
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function openFolder(folderId) {
    currentFolderId = folderId;
    loadFiles();
}

async function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '<li class="breadcrumb-item"><a href="#" onclick="goToRoot(); return false;">My Files</a></li>';
    
    if (currentFolderId) {
        try {
            const response = await fetch(`${API_BASE}/folders/${currentFolderId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if (data.success) {
                breadcrumb.innerHTML += `<li class="breadcrumb-item active">${data.data.name}</li>`;
            }
        } catch (error) {
            console.error('Error updating breadcrumb:', error);
        }
    }
}

function goToRoot() {
    currentFolderId = null;
    loadFiles();
}

async function handleFileUpload() {
    const files = document.getElementById('fileInput').files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }
    if (currentFolderId) {
        formData.append('folderId', currentFolderId);
    }

    const progressDiv = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('uploadStatus');

    progressDiv.style.display = 'block';
    progressBar.style.width = '0%';
    statusText.textContent = 'Uploading...';

    try {
        const response = await fetch(`${API_BASE}/files/upload/multiple`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            progressBar.style.width = '100%';
            statusText.textContent = 'Upload complete!';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
                progressDiv.style.display = 'none';
                loadFiles();
                loadStorageStats();
            }, 1000);
        } else {
            statusText.textContent = 'Upload failed: ' + data.message;
        }
    } catch (error) {
        statusText.textContent = 'Upload failed: ' + error.message;
    }

    document.getElementById('fileInput').value = '';
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    document.getElementById('fileInput').files = files;
    handleFileUpload();
}

async function handleCreateFolder() {
    const name = document.getElementById('newFolderName').value.trim();
    if (!name) return;

    try {
        const url = new URL(`${API_BASE}/folders`, window.location.origin);
        url.searchParams.append('name', name);
        if (currentFolderId) {
            url.searchParams.append('parentId', currentFolderId);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('newFolderModal')).hide();
            document.getElementById('newFolderName').value = '';
            loadFiles();
        } else {
            alert(data.message || 'Failed to create folder');
        }
    } catch (error) {
        alert('Failed to create folder: ' + error.message);
    }
}

async function loadStorageStats() {
    try {
        const response = await fetch(`${API_BASE}/files/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            const stats = data.data;
            document.getElementById('storageProgress').style.width = `${stats.usedPercentage}%`;
            document.getElementById('storageText').textContent = 
                `${stats.formattedUsedStorage} / ${stats.formattedMaxStorage}`;
        }
    } catch (error) {
        console.error('Error loading storage stats:', error);
    }
}

// Context menu
function showContextMenu(e, type, id) {
    e.preventDefault();
    selectedItem = { type, id };
    
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    // Hide download/share for folders
    document.getElementById('contextDownload').style.display = type === 'file' ? 'block' : 'none';
    document.getElementById('contextShare').style.display = type === 'file' ? 'block' : 'none';
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

async function handleDownload() {
    if (!selectedItem || selectedItem.type !== 'file') return;
    
    window.location.href = `${API_BASE}/files/${selectedItem.id}/download?token=${authToken}`;
    
    // Alternative: Use fetch with blob
    try {
        const response = await fetch(`${API_BASE}/files/${selectedItem.id}/download`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) filename = match[1];
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        alert('Download failed: ' + error.message);
    }
}

async function handleShare() {
    if (!selectedItem || selectedItem.type !== 'file') return;
    
    try {
        const response = await fetch(`${API_BASE}/files/${selectedItem.id}/share`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            const shareUrl = `${window.location.origin}/api/share/${data.data.shareToken}`;
            await navigator.clipboard.writeText(shareUrl);
            alert('Share link copied to clipboard:\n' + shareUrl);
        } else {
            alert(data.message || 'Failed to share file');
        }
    } catch (error) {
        alert('Failed to share file: ' + error.message);
    }
}

async function handleRename() {
    if (!selectedItem) return;
    
    const newName = prompt('Enter new name:');
    if (!newName) return;

    const endpoint = selectedItem.type === 'file' 
        ? `${API_BASE}/files/${selectedItem.id}/rename?name=${encodeURIComponent(newName)}`
        : `${API_BASE}/folders/${selectedItem.id}/rename?name=${encodeURIComponent(newName)}`;

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadFiles();
        } else {
            alert(data.message || 'Failed to rename');
        }
    } catch (error) {
        alert('Failed to rename: ' + error.message);
    }
}

async function handleDelete() {
    if (!selectedItem) return;
    
    if (!confirm('Are you sure you want to delete this item?')) return;

    const endpoint = selectedItem.type === 'file'
        ? `${API_BASE}/files/${selectedItem.id}`
        : `${API_BASE}/folders/${selectedItem.id}`;

    try {
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            loadFiles();
            loadStorageStats();
        } else {
            alert(data.message || 'Failed to delete');
        }
    } catch (error) {
        alert('Failed to delete: ' + error.message);
    }
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${API_BASE}/files/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        if (data.success) {
            renderFilesAndFolders([], data.data);
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}
