# Five Star Pools - Safety Covers Website

A modern, responsive pool safety cover configurator with user authentication and quote management.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start server (uses SQLite by default)
npm start

# Server runs on http://localhost:3000
# Open http://localhost:3000 in your browser
```

### Production (Azure)

Automatically uses Azure SQL Database when these environment variables are set:
- `AZURE_SQL_SERVER`
- `AZURE_SQL_DATABASE`
- `AZURE_SQL_AUTH=AAD` (for managed identity)

## 📁 Project Structure

```
pool/
├── server.js              # Main server file
├── src/
│   ├── config.js         # Configuration (auto-detects environment)
│   ├── db/
│   │   ├── connection.js # Database abstraction layer
│   │   ├── azure-sql.js  # Azure SQL implementation
│   │   └── sqlite.js     # SQLite implementation
│   ├── routes/
│   │   ├── auth.js       # Authentication routes
│   │   └── quotes.js     # Quote management routes
│   └── middleware/
│       └── auth.js       # JWT authentication middleware
├── public/
│   ├── index.html        # Homepage
│   ├── custom-quote-form.html
│   ├── quotes-admin.html
│   ├── config.js         # Frontend API config
│   └── images/
├── docs/                 # Documentation
└── package.json
```

## 🔧 Environment Variables

Create a `.env` file:

```env
# Server
PORT=3000
JWT_SECRET=your-secret-key-change-in-production

# Database (auto-detects: Azure SQL or SQLite)
# For Azure SQL:
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database
AZURE_SQL_AUTH=AAD

# For local SQLite (default):
SQLITE_DB=./users.db
```

## 🌟 Features

- ✅ **Auto-detecting database** - Uses Azure SQL in production, SQLite locally
- ✅ **Passwordless Azure AD** - Managed identity authentication
- ✅ **User authentication** - Register, login with JWT tokens
- ✅ **Quote management** - Submit and view pool cover quotes
- ✅ **Responsive design** - Works on all devices
- ✅ **Clean architecture** - Modular, maintainable codebase

## 📚 API Endpoints

```
POST   /api/register      - Create new account
POST   /api/login         - Login with email/password  
GET    /api/user          - Get current user (protected)
GET    /api/users         - List all users
POST   /api/quote         - Submit quote (protected)
GET    /api/quotes        - List quotes (protected)
GET    /api/health        - Health check
```

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Tokens are valid for 7 days.

## 🚢 Deployment

### Azure App Service

The app automatically detects Azure environment and uses:
- Azure SQL Database with Managed Identity (passwordless)
- Auto-reconnect for token expiry
- Production-ready configuration

Just deploy and set environment variables in Azure Portal.

### Local Testing

```bash
npm start
# Visit http://localhost:3000
```

## 📖 Documentation

See `/docs` folder for:
- Backend setup guide
- Deployment instructions
- API documentation

## 🛠 Technologies

- **Backend**: Node.js, Express
- **Database**: Azure SQL / SQLite
- **Auth**: JWT, bcrypt, Azure AD Managed Identity
- **Frontend**: HTML, CSS, JavaScript

## 📝 License

Private project for Five Star Pools
