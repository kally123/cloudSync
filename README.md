# CloudSync - Self-Hosted Cloud Storage Software

A full-featured cloud storage solution built with Java and Spring Boot. Host your own cloud storage server with file upload, download, sharing, folder organization, and user authentication.

## Features

- 🔐 **User Authentication** - Secure JWT-based authentication
- 📁 **File Management** - Upload, download, rename, delete files
- 📂 **Folder Organization** - Create nested folder structures
- 🔗 **File Sharing** - Generate public share links
- 📊 **Storage Quotas** - Per-user storage limits
- 🔍 **File Search** - Search files by name
- 📱 **Web Interface** - Modern responsive UI
- 📖 **API Documentation** - Swagger/OpenAPI documentation

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.2
- **Database**: H2 (development), PostgreSQL (production)
- **Security**: Spring Security, JWT
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **API Docs**: SpringDoc OpenAPI

## Getting Started

You can run CloudSync either with Docker (recommended) or manually.

### Option 1: Docker (Recommended)

#### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kally123/cloudSync.git
   cd cloudSync
   ```

2. **Configure environment variables (optional)**
   ```bash
   cp .env.example .env
   # Edit .env to customize settings (JWT secret, database credentials, etc.)
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 8080
   - Frontend web app on port 3000

4. **Access the application**
   - Web UI: http://localhost:3000
   - API Docs: http://localhost:8080/swagger-ui.html
   - Backend API: http://localhost:8080

5. **View logs**
   ```bash
   # View all logs
   docker-compose logs -f
   
   # View specific service logs
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

6. **Stop the application**
   ```bash
   docker-compose down
   
   # Stop and remove volumes (deletes all data)
   docker-compose down -v
   ```

### Option 2: Manual Installation

#### Prerequisites

- Java 21 or higher
- Maven 3.6+
- Node.js 18+ and npm

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kally123/cloudSync.git
   cd cloudSync
   ```

2. **Build and run the backend**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

3. **Build and run the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
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

## Production Deployment

### Docker Deployment (Recommended)

1. **Create a production environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file with production values**
   ```env
   JWT_SECRET=your-super-secret-key-change-this-in-production
   POSTGRES_PASSWORD=your-strong-database-password
   ```

3. **Start services in production mode**
   ```bash
   docker-compose up -d
   ```

4. **Configure reverse proxy (optional)**
   
   For production, use Nginx or Traefik as a reverse proxy:
   
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Enable HTTPS** - Use Let's Encrypt or your SSL certificate provider

### Manual Production Deployment

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
