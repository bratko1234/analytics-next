# Deployment Guide

Complete step-by-step guide for deploying browser and node packages.

---

## 🌐 Deploy Browser Package (Frontend SDK)

### Step 1: Make Your Code Changes
Edit files in `packages/browser/src/` as needed.

### Step 2: Build Browser Package

```powershell
# Navigate to browser package
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\browser"

# Generate version file
$version = (Get-Content package.json | ConvertFrom-Json).version; if (-not (Test-Path src/generated)) { New-Item -ItemType Directory -Path src/generated }; "// This file is generated.`nexport const version = '$version'" | Out-File -FilePath src/generated/version.ts -Encoding utf8

# Build UMD bundle
$env:NODE_ENV="production"; yarn umd
```

### Step 3: Verify Build
```powershell
# Check that the file exists
dir dist\umd\standalone.js
```

You should see `standalone.js` (~112 KB)

### Step 4: Upload to Google Cloud Storage

1. Go to: https://console.cloud.google.com/storage/browser/bratrax-analytics-js
2. Click **"Upload files"**
3. Select: `dist\umd\standalone.js`
4. Rename it to: `browser-umd.js` (or overwrite existing)
5. Ensure it's **publicly accessible**

### Step 5: Test in Production
- Clear browser cache (Ctrl+Shift+Delete)
- Reload your Angular app (Ctrl+F5)
- Open DevTools → Network tab
- Verify requests go to: `https://api.bratrax.com/vidtao/...`

✅ **Browser package deployed!**

---

## 📦 Deploy Node Package (Backend SDK)

### Step 1: Make Your Code Changes
Edit files in `packages/node/src/` as needed.

### Step 2: Build Node Package

```powershell
# Navigate to node package
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\node"

# Build (name should be @segment/analytics-node at this point)
yarn build
```

### Step 3: Verify Build
```powershell
# Check dist folders exist
dir dist
```

You should see: `cjs`, `esm`, and `types` folders

### Step 4: Update Version & Change Name

**Manually edit `packages/node/package.json`:**
- Line 2: Change `"@segment/analytics-node"` → `"bratrax-analytics-node"`
- Line 3: Increment version (e.g., `"1.0.1"` → `"1.0.2"`)

**Or use PowerShell:**
```powershell
# Change name and bump version
(Get-Content package.json) -replace '"name": "@segment/analytics-node"', '"name": "bratrax-analytics-node"' -replace '"version": "1.0.1"', '"version": "1.0.2"' | Set-Content package.json
```

### Step 5: Publish to npm

```powershell
# Check you're logged in
npm whoami

# If not logged in
npm login

# Publish
npm publish
```

When prompted:
1. Press **ENTER** to open browser
2. Authenticate with npm
3. Wait for "Published successfully" message

### Step 6: Verify Published Package

```powershell
npm view bratrax-analytics-node
```

Should show your new version.

### Step 7: Revert Name (Important!)

**Manually edit `packages/node/package.json`:**
- Line 2: Change `"bratrax-analytics-node"` → `"@segment/analytics-node"`
- Line 3: Change back to `"2.2.0"`

**Or use PowerShell:**
```powershell
# Revert name and version
(Get-Content package.json) -replace '"name": "bratrax-analytics-node"', '"name": "@segment/analytics-node"' -replace '"version": "1.0.2"', '"version": "2.2.0"' | Set-Content package.json
```

### Step 8: Test Installation

```powershell
# In a separate test directory
npm install bratrax-analytics-node
```

✅ **Node package deployed!**

---

## 📝 Quick Reference

### Browser Deployment

**Run each command separately:**
```powershell
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\browser"
```
```powershell
$version = (Get-Content package.json | ConvertFrom-Json).version; if (-not (Test-Path src/generated)) { New-Item -ItemType Directory -Path src/generated }; "// This file is generated.`nexport const version = '$version'" | Out-File -FilePath src/generated/version.ts -Encoding utf8
```
```powershell
$env:NODE_ENV="production"; yarn umd
```
Then upload `dist/umd/standalone.js` to GCP.

### Node Deployment

**Run each command separately:**

**1. Navigate and Build:**
```powershell
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\node"
```
```powershell
yarn build
```

**2. Rename & Bump Version (adjust version as needed):**
```powershell
(Get-Content package.json) -replace '"name": "@segment/analytics-node"', '"name": "bratrax-analytics-node"' -replace '"version": "1.0.1"', '"version": "1.0.2"' | Set-Content package.json
```

**3. Publish:**
```powershell
npm publish
```

**4. Revert Name:**
```powershell
(Get-Content package.json) -replace '"name": "bratrax-analytics-node"', '"name": "@segment/analytics-node"' -replace '"version": "1.0.2"', '"version": "2.2.0"' | Set-Content package.json
```

---

## 🔍 Troubleshooting

### Browser Build Fails
- Make sure `src/generated/version.ts` exists
- Check you're in `packages/browser` directory
- Try: `yarn install` first

### Node Publish Requires 2FA
- Use browser authentication (Press ENTER when prompted)
- Or keep package name unscoped (e.g., `bratrax-analytics-node`)

### "Workspace not found" Error
- Make sure node package name is `@segment/analytics-node` before running `yarn build`
- Only change to `bratrax-analytics-node` right before `npm publish`
- Always revert after publishing

---

## 📊 Version History

Track your published versions:

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | Initial | First release |
| 1.0.1   | TBD | Current version |
| 1.0.2   | TBD | Next version |

Update this table after each deployment!

