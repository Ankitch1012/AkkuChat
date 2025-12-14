# 🚀 Deployment Guide - AkkuChat

This guide explains how to deploy the chat application to various platforms.

## ⚠️ Important: Socket.IO & Vercel

**Vercel does NOT support Socket.IO** because:
- Vercel is serverless (functions timeout)
- Socket.IO needs persistent WebSocket connections
- WebSockets require a constantly running server

**Use these platforms instead** (recommended in order):

---

## 1️⃣ Railway (Recommended - Easiest) 🚂

### Why Railway?
- Free tier available
- Simple deployment
- Automatic HTTPS
- Supports WebSockets perfectly

### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Install Railway CLI** (Optional, or use web dashboard)
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   railway link
   ```

4. **Set Port (Important!)**
   - Railway provides `PORT` environment variable
   - Update `server.js` to use: `const PORT = process.env.PORT || 3000;`

5. **Deploy**
   ```bash
   railway up
   ```
   
   OR use Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Railway auto-detects Node.js and deploys

6. **Add Environment Variables** (if needed)
   - Railway dashboard → Project → Variables

7. **Get Your URL**
   - Railway provides a URL like: `https://your-app.railway.app`

### ✅ Done! Your app is live!

---

## 2️⃣ Render 🎨

### Why Render?
- Free tier (spins down after inactivity)
- Great for testing
- Easy setup

### Steps:

1. **Create Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name:** `akkuchat` (or any name)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free (or paid)

4. **Environment Variables**
   - Add if needed (usually none required)

5. **Update server.js Port**
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Render builds and deploys automatically

### ✅ Done! URL: `https://your-app.onrender.com`

---

## 3️⃣ Fly.io 🪰

### Why Fly.io?
- Good free tier
- Global edge locations
- Fast deployment

### Steps:

1. **Install Fly CLI**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Initialize App**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Select region
   - Don't deploy yet

4. **Create fly.toml** (if not auto-generated)
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]

   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

5. **Update server.js**
   ```javascript
   const PORT = process.env.PORT || 3000;
   server.listen(PORT, '0.0.0.0', () => {
     console.log(`🚀 Server is running on http://localhost:${PORT}`);
   });
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

### ✅ Done! URL: `https://your-app.fly.dev`

---

## 4️⃣ Heroku 🟣

### Why Heroku?
- Well-established platform
- Easy deployment
- Paid only (free tier removed)

### Steps:

1. **Install Heroku CLI**
   - Download from [devcenter.heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   heroku create your-app-name
   ```

4. **Create Procfile** (in project root)
   ```
   web: node server.js
   ```

5. **Update server.js**
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

6. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-app-name
   git push heroku main
   ```

### ✅ Done! URL: `https://your-app-name.herokuapp.com`

---

## 5️⃣ DigitalOcean App Platform 🌊

### Why DigitalOcean?
- Reliable infrastructure
- Simple deployment
- Pay-as-you-go

### Steps:

1. **Create Account**
   - Go to [digitalocean.com](https://digitalocean.com)

2. **Create App**
   - Click "Create" → "Apps"
   - Connect GitHub repository

3. **Configure**
   - **Type:** Web Service
   - **Build Command:** `npm install`
   - **Run Command:** `node server.js`
   - **Plan:** Basic ($5/month minimum)

4. **Deploy**
   - Click "Create Resources"

### ✅ Done!

---

## 🔧 Required Code Changes for All Platforms

### Update `server.js` - Port Configuration

**Find this line:**
```javascript
const PORT = 3000;
```

**Replace with:**
```javascript
const PORT = process.env.PORT || 3000;
```

**And update the listen call:**
```javascript
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
```

For Fly.io, use:
```javascript
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
```

---

## 📝 Pre-Deployment Checklist

- [ ] Update `server.js` to use `process.env.PORT`
- [ ] Add `.gitignore` (if using Git):
  ```
  node_modules/
  uploads/*
  !uploads/.gitkeep
  .env
  ```
- [ ] Test locally: `npm install && npm start`
- [ ] Ensure `package.json` has correct start script
- [ ] Create uploads/.gitkeep file (to preserve directory in Git)

---

## 🆓 Free Tier Comparison

| Platform | Free Tier | WebSocket Support | Best For |
|----------|-----------|-------------------|----------|
| **Railway** | ✅ $5 credit/month | ✅ Yes | Easiest, most reliable |
| **Render** | ✅ Free (spins down) | ✅ Yes | Testing, demos |
| **Fly.io** | ✅ 3 shared VMs | ✅ Yes | Global edge, fast |
| **Heroku** | ❌ Paid only | ✅ Yes | Established projects |
| **DigitalOcean** | ❌ Paid only | ✅ Yes | Production apps |

---

## 🎯 Quick Recommendation

**For Beginners:** Use **Railway** or **Render**
- Simplest setup
- Free tier available
- Great documentation

**For Production:** Use **Railway** or **Fly.io**
- More reliable
- Better performance
- Good free tiers

---

## 🐛 Troubleshooting

### Port Already in Use
- Ensure you use `process.env.PORT || 3000`

### Images Not Uploading
- Check `uploads/` directory permissions
- Verify Multer configuration

### WebSocket Connection Failed
- Ensure platform supports WebSockets (not Vercel)
- Check firewall/security settings

### App Crashes on Startup
- Check logs: `railway logs` or platform dashboard
- Verify all dependencies in `package.json`
- Ensure Node.js version is compatible (14+)

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Socket.IO Deployment Guide](https://socket.io/docs/v4/deployment/)

---

## ✅ After Deployment

1. Test your app at the provided URL
2. Share the URL with friends
3. Try joining the same room from different devices
4. Test image uploads

**Enjoy your live chat app! 🎉**

