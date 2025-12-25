# 🔧 Installing MongoDB Database Tools on Windows

## Method 1: Direct Download (Recommended)

### Step 1: Download
1. Open this URL in your browser:
   https://www.mongodb.com/try/download/database-tools

2. Select:
   - **Version:** Latest (100.x.x)
   - **Platform:** Windows x64
   - **Package:** ZIP

3. Click **Download**

### Step 2: Extract
1. Extract the downloaded ZIP file
2. You'll see a folder like: `mongodb-database-tools-windows-x86_64-100.x.x`

### Step 3: Add to PATH
1. Copy the `bin` folder path, for example:
   `C:\Users\Lenovo\Downloads\mongodb-database-tools-windows-x86_64-100.9.5\bin`

2. Open **Environment Variables:**
   - Press `Win + X` → Select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"

3. Edit **Path:**
   - Under "User variables" or "System variables", find **Path**
   - Click **Edit**
   - Click **New**
   - Paste the bin folder path
   - Click **OK** on all dialogs

4. **Restart your terminal/IDE**

### Step 4: Verify Installation
Open a NEW terminal and run:
```bash
mongodump --version
mongorestore --version
```

Expected output:
```
mongodump version: 100.x.x
mongorestore version: 100.x.x
```

---

## Method 2: Using Chocolatey (If you have it)

```powershell
# Run PowerShell as Administrator
choco install mongodb-database-tools

# Verify
mongodump --version
```

---

## Method 3: Using winget (Windows Package Manager)

```powershell
# Run PowerShell
winget install MongoDB.DatabaseTools

# Verify
mongodump --version
```

---

## ✅ After Installation

Once mongodump is available, come back and we'll create your first backup!

Test with:
```bash
mongodump --version
```

If you see the version number, you're ready! 🎉
