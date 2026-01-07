# 🔧 Fixing Production Login Issue

## Problem
Your frontend and backend are deployed successfully, but login fails because **your production database is empty** - it has no users!

## ✅ Solution: Seed Your Production Database

You have a seed script (`seedDatabase.js`) that will create:
- **Admin user** - Enrollment: `ADMIN001`, Password: `admin123`
- **Student user** - Enrollment: `2024001`, Password: `student123`  
- **Driver user** - Enrollment: `DRV001`, Password: `driver123`
- Sample bus routes

---

## 📋 Steps to Seed Production Database

### **Option 1: Run Seed Script Locally** (Recommended)

1. **Update your local `.env` file** with production MongoDB URI:
   ```bash
   # In server/.env
   MONGODB_URI=your_production_mongodb_atlas_connection_string
   ```

2. **Run the seed script**:
   ```bash
   cd server
   node seedDatabase.js
   ```

3. **Revert your `.env`** back to local settings after seeding

---

### **Option 2: Add Seed Script to Package.json and Run on Render**

1. Add seed script to `server/package.json`:
   ```json
   "scripts": {
     "seed": "node seedDatabase.js"
   }
   ```

2. **SSH into Render** or use Render Shell:
   - Go to your Render service dashboard
   - Click "Shell" tab
   - Run: `npm run seed`

---

### **Option 3: Use Render One-off Job**

1. In Render Dashboard → Your Service
2. Click "Manual Deploy" dropdown → "Run Command"  
3. Enter command: `node seedDatabase.js`
4. Click "Run"

---

## 🎯 After Seeding - Test Login

Once seeded, try logging in with:

**Admin:**
- Enrollment: `ADMIN001`
- Password: `admin123`

**Student:**
- Enrollment: `2024001`
- Password: `student123`

---

## ⚠️ Important Notes

- Change these default passwords after first login for security!
- The seed script is safe to run multiple times (it checks if users exist)
- Make sure your production MongoDB allows connections from Render's IPs
