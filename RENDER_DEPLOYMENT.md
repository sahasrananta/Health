# 🚀 Render Deployment - Auto-Update from GitHub

## ✅ GitHub Status
- **Repository**: https://github.com/sahasrananta/Health
- **Branch**: main
- **Latest Commit**: Email verification system with OTP and admin credentials
- **Status**: ✅ Ready to deploy

---

## 📋 Step-by-Step Guide to Deploy on Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

### Step 2: Connect GitHub Repository
1. Click **"New +"** button
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select: **`sahasrananta/Health`**
5. Click **"Connect"**

### Step 3: Configure Build Settings
```
Name: hospital-management-system
Environment: Node
Region: (your closest region)
Branch: main
Build Command: cd Backend && npm install
Start Command: cd Backend && npm start
```

### Step 4: Add Environment Variables
Click **"Add Environment Variable"** for each:

```
PORT=4000
NODE_ENV=production
JWT_SECRET=<generate-strong-random-string>
DATABASE_PATH=/tmp/app.db
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://<your-render-domain>.onrender.com

# Email Configuration
EMAIL_USER=<your-gmail-here>
EMAIL_PASS=<your-16-char-app-password>

# Resend API (Optional)
RESEND_API_KEY=<your-resend-key>

# Twilio SMS
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>

# Admin
ADMIN_PASSWORD=<strong-admin-password>
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run build commands
   - Start the server
   - Assign a URL

### Step 6: Enable Auto-Deploy
1. Go to your service settings
2. Under **"Deploy"** section
3. Enable **"Auto-Deploy"** → select "Yes"
4. This will auto-redeploy on every push to main

---

## 🔄 Auto-Deployment Workflow

```
You push code to GitHub
        ↓
GitHub webhook triggers Render
        ↓
Render pulls latest code
        ↓
Runs: npm install
        ↓
Runs: npm start
        ↓
Service updates automatically ✅
```

---

## 📊 Deployment Checklist

- [ ] GitHub account connected to Render
- [ ] Repository linked (`sahasrananta/Health`)
- [ ] Branch selected (`main`)
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables added
- [ ] JWT_SECRET set to secure random value
- [ ] Email credentials configured
- [ ] Auto-Deploy enabled
- [ ] Initial deployment successful
- [ ] Health Check passing
- [ ] Application responding to requests

---

## 🧪 Test Deployment

After deployment completes:

```bash
# 1. Visit your Render URL
https://<service-name>.onrender.com

# 2. Test registration
Go to /register.html
Fill form and test OTP

# 3. Test login
Go to /login.html
Login with created account

# 4. Check admin dashboard
Go to /admin/dashboard.html
Login with admin@healthclo.com
```

---

## 🔐 Security Notes

### Production Settings
- ✅ Use strong JWT_SECRET (32+ characters)
- ✅ Use environment variables for all secrets
- ✅ Never commit .env file (already in .gitignore)
- ✅ Set NODE_ENV=production
- ✅ Use verified domain (add custom domain in Render)

### Database
- 📍 SQLite stored at `/tmp/app.db`
- ⚠️ Data resets when service restarts
- **For production**, upgrade to PostgreSQL:
  - Render provides managed PostgreSQL
  - Update DATABASE to connect string
  - Migrate schema (see db.js)

---

## 📱 Frontend Update

Update `Frontend/js/auth.js` API endpoint:

```javascript
// Change from:
const res = await fetch('/api/auth/send-otp', {

// For production:
const baseURL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000'
  : 'https://<your-render-url>.onrender.com';

const res = await fetch(baseURL + '/api/auth/send-otp', {
```

**OR** Configure CORS in Backend to allow frontend requests.

---

## 🔧 Troubleshooting

### "Deployment Failed"
1. Check build logs in Render
2. Verify `npm install` completes
3. Check package.json exists in Backend/
4. Verify all env vars are set

### "Application not responding"
1. Check logs: Click service → Logs
2. Verify PORT environment variable
3. Check database permissions
4. Restart service manually

### "OTP not sending"
1. Verify EMAIL credentials
2. Check Twilio account has credits
3. Test with MOCK mode first
4. Check backend logs

### "Slow response"
1. Check CPU/Memory usage in Render dashboard
2. Upgrade instance type if needed
3. Profile database queries
4. Consider adding PostgreSQL

---

## 📈 Monitoring

After deployment, monitor your service:

1. **Render Dashboard**
   - View logs in real-time
   - Check CPU/Memory usage
   - Monitor response times
   - Check deployment history

2. **Add Error Tracking** (Optional)
   ```bash
   npm install sentry-node
   # Configure in index.js
   ```

3. **Set Up Alerts**
   - Enable Render notifications
   - Alert on deploy failures
   - Alert on high memory usage

---

## 🔄 Continuous Updates

Every time you push to GitHub's main branch:

```bash
git add -A
git commit -m "Your changes here"
git push origin main

# Render automatically:
# 1. Pulls latest code
# 2. Rebuilds
# 3. Restarts service
# ✅ Done! No manual steps needed
```

---

## 📊 Production Checklist

- [ ] Custom domain configured
- [ ] HTTPS/SSL enabled
- [ ] Environment variables secure
- [ ] Database backed up
- [ ] Error tracking configured
- [ ] Logs monitored
- [ ] Email delivery verified
- [ ] SMS delivery verified
- [ ] Login flow tested
- [ ] Registration tested
- [ ] Admin panel working
- [ ] Analytics setup

---

## 🚀 Next Steps

1. **Deploy Now**
   - Follow steps 1-5 above
   - Test the application
   - Share Render URL

2. **Custom Domain** (Optional)
   - Add your domain in Render settings
   - Point domain DNS to Render
   - Enable auto-renewing SSL

3. **Database Upgrade** (Recommended for Production)
   - Add PostgreSQL add-on in Render
   - Migrate from SQLite
   - Enable automated backups

4. **Monitoring** (Recommended)
   - Set up error tracking (Sentry)
   - Configure alerts
   - Monitor performance

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Node.js Deployment**: https://render.com/docs/deploy-node-express-app
- **Environment Variables**: https://render.com/docs/environment-variables
- **Auto-Deploy**: https://render.com/docs/deploy-from-github

---

**GitHub Repository**: https://github.com/sahasrananta/Health  
**Current Branch**: main  
**Auto-Deploy Status**: Ready to configure  
**Deployment Platform**: Render.com

**Your system is ready for production deployment!** 🎉
