# CloudSync - Self-Hosted Cloud Storage Software

A full-featured cloud storage solution built with Java and Spring Boot. Host your own cloud storage server with file upload, download, sharing, folder organization, and user authentication.

## Features

- 🔐 **User Authentication** - Secure JWT-based authentication
- 📁 **File Management** - Upload, download, rename, delete files
- 📂 **Folder Organization** - Create nested folder structures
- 🔗 **File Sharing** - Generate public share links
- 📊 **Storage Quotas** - Per-user storage limits
- 🔍 **File Search** - Search files by name
- 💾 **External Storage** - Save files to USB drives/pendrives and external storage
- 📱 **Web Interface** - Modern responsive UI
- 📖 **API Documentation** - Swagger/OpenAPI documentation

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.2
- **Database**: H2 (development), PostgreSQL (production)
- **Security**: Spring Security, JWT
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **API Docs**: SpringDoc OpenAPI

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+

### Installation

1. **Clone the repository**
   ```bash
   cd cloudSync
   ```

2. **Build the project**
   ```bash
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Access the application**
   - Web UI: http://localhost:8080
   - API Docs: http://localhost:8080/swagger-ui.html
   - H2 Console: http://localhost:8080/h2-console

## Configuration

Edit `src/main/resources/application.yml` to customize:

```yaml
cloudsync:
  storage:
    path: ./storage                    # File storage directory
    max-user-storage: 10737418240      # Max storage per user (10 GB)
  
  jwt:
    secret: your-secret-key            # Change in production!
    expiration: 86400000               # Token expiration (24 hours)

server:
  port: 8080                           # Server port
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload` | Upload file |
| POST | `/api/files/upload/multiple` | Upload multiple files |
| GET | `/api/files` | Get all files |
| GET | `/api/files/root` | Get root files |
| GET | `/api/files/{id}` | Get file details |
| GET | `/api/files/{id}/download` | Download file |
| DELETE | `/api/files/{id}` | Delete file |
| PUT | `/api/files/{id}/rename` | Rename file |
| PUT | `/api/files/{id}/move` | Move file |
| POST | `/api/files/{id}/share` | Share file |
| GET | `/api/files/search?q=` | Search files |
| GET | `/api/files/stats` | Get storage stats |

### Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/folders` | Create folder |
| GET | `/api/folders` | Get root folders |
| GET | `/api/folders/{id}` | Get folder with contents |
| PUT | `/api/folders/{id}/rename` | Rename folder |
| PUT | `/api/folders/{id}/move` | Move folder |
| DELETE | `/api/folders/{id}` | Delete folder |

### Public Sharing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/share/{token}` | Download shared file |
| GET | `/api/share/{token}/info` | Get shared file info |

## Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"secret123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secret123"}'
```

### Upload a file
```bash
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf"
```

### Download a file
```bash
curl -X GET http://localhost:8080/api/files/1/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded-file.pdf
```

## Saving Files to USB Drives/Pendrives

CloudSync supports saving files directly to USB drives, external hard drives, and other storage devices through the web and mobile interfaces.

### Web Interface (Chrome, Edge, Opera)

1. Navigate to your files in the CloudSync web interface
2. Click on the file menu (three dots) for any file
3. Select **"Save to Local Storage"**
4. A system file picker dialog will appear
5. Navigate to your USB drive or any location on your computer
6. Choose where to save the file and click "Save"

**Note:** This feature requires modern browsers with File System Access API support (Chrome 86+, Edge 86+, Opera 72+). For other browsers, use the standard "Download" option.

### Mobile App (iOS & Android)

1. Open the CloudSync mobile app
2. Tap on any file to open the file menu
3. Select **"Save to External Storage"**
4. Choose your destination:
   - **iOS**: Save to Files app, iCloud Drive, or connected external storage
   - **Android**: Save to Downloads, Google Drive, USB OTG devices, or SD card

The file will be downloaded and saved to your chosen location, accessible even after disconnecting from CloudSync.

## Production Deployment

1. **Use PostgreSQL**
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/cloudsync
       username: your_username
       password: your_password
     jpa:
       hibernate:
         ddl-auto: validate
   ```

2. **Change JWT secret** - Use a strong, unique secret key

3. **Configure storage path** - Use a dedicated storage volume

4. **Enable HTTPS** - Configure SSL/TLS

5. **Build production JAR**
   ```bash
   mvn clean package -DskipTests
   java -jar target/cloudsync-1.0.0-SNAPSHOT.jar
   ```

## Project Structure

```
src/main/java/com/cloudsync/
├── CloudSyncApplication.java     # Main application
├── config/                       # Configuration classes
├── controller/                   # REST controllers
├── dto/                          # Data transfer objects
├── entity/                       # JPA entities
├── exception/                    # Exception handling
├── repository/                   # Data repositories
├── security/                     # Security configuration
└── service/                      # Business logic

src/main/resources/
├── application.yml               # Application config
└── static/                       # Frontend files
    ├── index.html
    └── js/app.js
```

## License

MIT License - feel free to use for personal or commercial projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
