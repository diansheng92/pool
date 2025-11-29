# Five Star Pools - Safety Covers Website

A responsive, interactive website for Five Star Pools safety cover configurator and product showcase with **real user authentication**.

## 🌟 Features

- **Interactive Pool Shape Configurator**: Multi-step workflow for selecting pool covers
- **Shape-Specific Logic**: Different workflows for different pool shapes (Rectangle, Lazy-L, Round, etc.)
- **Real User Authentication**: Register, login, and session management with database storage
- **Secure Backend**: JWT tokens, bcrypt password hashing, SQLite database
- **Responsive Design**: Mobile-friendly layout using CSS Grid
- **Multiple Page Variants**: 
  - Main configurator with full workflow
  - Simple gallery view
  - Quick selector
  - Product catalog
  - Dedicated Lazy-L configurator

## 📁 Project Structure

```
pool/
├── index.html                      # Landing page with navigation
├── safety-covers-template.html     # Main interactive configurator with auth
├── simple-gallery.html             # Basic shape gallery
├── quick-selector.html             # Single-click shape selector
├── product-catalog.html            # E-commerce product listing
├── lazy-l-configurator.html        # Dedicated L-shaped pool configurator
├── server.js                       # Express backend API server
├── package.json                    # Node.js dependencies
├── .env                           # Environment variables (not in git)
├── users.db                       # SQLite database (not in git)
├── images/                        # All product and UI images
├── BACKEND_README.md              # Backend setup documentation
└── README.md
```

## 🚀 Quick Start

### Frontend Only (Static Site)

1. Clone the repository:
```bash
git clone https://github.com/diansheng92/pool.git
cd pool
```

2. Start a local server:
```bash
python3 -m http.server 8000
```

3. Open your browser to:
```
http://localhost:8000/safety-covers-template.html
```

### Full Stack (With Authentication)

1. **Install Backend Dependencies:**
```bash
npm install
```

2. **Configure Environment:**
Edit `.env` file (or keep defaults for development):
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
```

3. **Start Backend Server:**
```bash
npm start
```
Backend runs on: `http://localhost:3000`

4. **Start Frontend Server** (in a new terminal):
```bash
python3 -m http.server 8000
```
Frontend runs on: `http://localhost:8000`

5. **Test Authentication:**
- Open: `http://localhost:8000/safety-covers-template.html`
- Click "Sign In/Up" in the header
- Create an account and login!

## 💡 Shape Workflows

The configurator implements different workflows based on pool shape:

- **Rectangle, Grecian, Roman**: Full 4-step workflow (Shape → Corner → Step → Size)
- **Lazy-L**: Custom cover required (Shape → Send Measurements)
- **Round, Oval**: Simplified workflow (Shape → Size, skips corner & step)
- **Square-L**: 3-step workflow (Shape → Step → Size)

## 🔐 Authentication Features

- ✅ User registration with name, email, password
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Session persistence in localStorage
- ✅ Auto-login on page reload
- ✅ SQLite database for user storage
- ✅ Protected API routes

### API Endpoints

```
POST   /api/register  - Create new account
POST   /api/login     - Login with email/password
GET    /api/user      - Get current user (requires token)
GET    /api/health    - Health check
```

See [BACKEND_README.md](BACKEND_README.md) for full API documentation.

## 🎨 Technologies Used

### Frontend
- Pure HTML5/CSS3/JavaScript (no frameworks)
- CSS Grid for responsive layouts
- Vanilla JavaScript for interactivity
- SVG for pool shape diagrams
- LocalStorage for session management
- Fetch API for backend communication

### Backend
- Node.js + Express - API server
- SQLite3 - Lightweight database
- bcrypt - Password hashing
- JWT - Authentication tokens
- CORS - Cross-origin requests
- dotenv - Environment variables

## 📝 Customization

### Modify Shape Workflows
Edit the `shapeWorkflows` object in `safety-covers-template.html`:

```javascript
const shapeWorkflows = {
    'rectangle': { hasCorner: true, hasStep: true, hasSize: true },
    'lazy-l': { hasCorner: false, hasStep: false, hasSize: false, requiresCustom: true },
    // ... add more shapes
};
```

### Add New API Endpoints
Edit `server.js`:

```javascript
app.post('/api/your-endpoint', async (req, res) => {
    // Your logic here
});
```

## 🌐 Live Demo

### GitHub Pages (Frontend Only)
- https://diansheng92.github.io/pool/safety-covers-template.html

**Note:** GitHub Pages only serves static files. To use authentication, deploy the backend separately.

### Deployment Options

**Frontend:**
- GitHub Pages (free, static only)
- Netlify (free, static)
- Vercel (free, static)

**Backend:**
- Heroku (free tier)
- Railway (easy deployment)
- DigitalOcean ($5/month)
- AWS/Azure (enterprise)

## 🔧 Development

### View Database
```bash
sqlite3 users.db
sqlite> SELECT * FROM users;
sqlite> .quit
```

### Test API
```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'
```

## 📄 License

Private project for Five Star Pools

## 🤝 Contributing

This is a private repository. Contact the repository owner for access.

## 📧 Support

For questions or issues, please contact the development team.
