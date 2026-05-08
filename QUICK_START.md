# 🚀 LAAZIRI - Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

## Backend Setup (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Edit `.env` with Your Settings
```bash
# Set a strong JWT secret key
JWT_SECRET_KEY=your-very-secure-random-key-here

# Keep other defaults or customize
FLASK_ENV=development
DEBUG=False
```

### 4. Run Backend
```bash
python app.py
```

The backend will start at `http://localhost:5000`

---

## Frontend Setup (5 minutes)

### 1. Install Frontend Dependencies
```bash
cd frontend-react
npm install
```

### 2. Run Frontend Development Server
```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## Key Improvements Made

### Security ✅
- ✅ Environment-based configuration
- ✅ Strong password validation (8+ chars, uppercase, lowercase, digit)
- ✅ Input validation on all API endpoints
- ✅ Proper error handling with no sensitive data leaks

### User Experience ✅
- ✅ Toast notifications for errors and success
- ✅ Form validation feedback
- ✅ Better error messages
- ✅ Loading states ready to implement

### Code Quality ✅
- ✅ Logging system for debugging
- ✅ Standardized API responses
- ✅ Reusable validation utilities
- ✅ Centralized configuration

### API Documentation ✅
- ✅ Docstrings on all functions
- ✅ Clear error messages
- ✅ Consistent response format

---

## Testing the Improvements

### Test Registration (Password Validation)
1. Go to `/register`
2. Try password: `123` → ❌ "At least 8 characters"
3. Try password: `password123` → ❌ "Uppercase required"
4. Try password: `Password123` → ✅ Success!

### Test Error Handling
1. Try login with wrong email/password
2. Watch for toast notification
3. Check browser console for detailed error logs

### Test Toast Notifications
Open browser console and run:
```javascript
window.showToast('Test success', 'success');
window.showToast('Test error', 'error');
window.showToast('Test warning', 'warning');
```

---

## Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Environment configuration (create from .env.example) |
| `backend/config.py` | Configuration management |
| `backend/validators.py` | Input validation utilities |
| `backend/logger.py` | Logging setup |
| `frontend-react/src/components/Toast.jsx` | Toast notifications |
| `frontend-react/src/services/api.js` | API service with error handling |
| `IMPROVEMENTS.md` | Full documentation of improvements |

---

## Troubleshooting

### Backend won't start?
```bash
# Check if port 5000 is in use
# Delete database and try again
rm backend/laazari.db
python backend/app.py
```

### Frontend shows blank page?
```bash
# Clear cache and reinstall
rm -rf frontend-react/node_modules
cd frontend-react && npm install && npm run dev
```

### Toast not showing?
- Check that ToastContainer is in App.jsx
- Check browser console for JavaScript errors
- Import Toast.css in components

---

## Next Steps

1. **Test the application thoroughly**
   - Create accounts with valid/invalid data
   - Check console for logs
   - Look for error toasts

2. **Deploy when ready**
   - Set `FLASK_ENV=production`
   - Build React: `npm run build`
   - Use proper secrets management

3. **Monitor logs**
   - Check `backend/logs/app.log`
   - Use tools like PM2 or Docker in production

---

## Getting Help

- Check `IMPROVEMENTS.md` for detailed documentation
- Look at inline code comments
- Check browser console for errors
- Check `backend/logs/app.log` for server errors

Enjoy your improved LAAZIRI application! 🎉
