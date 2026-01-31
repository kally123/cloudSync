# CloudSync Frontend

A modern Next.js web application for cloud file storage and management.

## Features

- 🔐 User authentication (login/register)
- 📁 File and folder management
- ⬆️ Drag-and-drop file uploads
- 🔗 File sharing with public links
- 📊 Storage usage statistics
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: React Icons
- **File Upload**: react-dropzone

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Main dashboard page
│   ├── login/              # Authentication page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (redirect)
├── components/             # Reusable React components
│   ├── Breadcrumbs.tsx     # Folder navigation
│   ├── FileList.tsx        # File/folder grid display
│   ├── FileUpload.tsx      # Upload modal with dropzone
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── StorageInfo.tsx     # Storage usage bar
├── lib/
│   └── api.ts              # Axios API client
├── store/
│   ├── authStore.ts        # Authentication state
│   └── fileStore.ts        # Files/folders state
└── types/
    └── index.ts            # TypeScript interfaces
```

## API Configuration

Update the API base URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

## License

MIT
