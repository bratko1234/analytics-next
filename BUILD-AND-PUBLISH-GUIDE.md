# Build and Publish Guide

## Current Setup

### Package Names (Internal Workspace)
- **Browser:** `@segment/analytics-next` 
- **Node:** `@segment/analytics-node`
- **Core:** `@segment/analytics-core`
- **Generic Utils:** `@segment/analytics-generic-utils`

These names MUST stay as-is for the Yarn workspace to function properly.

### What's Fixed
✅ **Browser Package:** HTTPS protocol enforced in `packages/browser/src/plugins/custom-segmentio/index.ts` (line 55)
✅ **Workspace:** All internal packages use correct `@segment/` scoped names
✅ **Dependencies:** Workspace references work correctly

---

## How to Build Browser Package (Frontend SDK)

```powershell
# Navigate to browser package
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\browser"

# Generate version file
$version = (Get-Content package.json | ConvertFrom-Json).version
if (-not (Test-Path src/generated)) { New-Item -ItemType Directory -Path src/generated }
"// This file is generated.`nexport const version = '$version'" | Out-File -FilePath src/generated/version.ts -Encoding utf8

# Build UMD bundle
$env:NODE_ENV="production"
yarn umd
```

**Output:** `dist/umd/standalone.js` (~112 KB)

**Upload to:** https://console.cloud.google.com/storage/browser/bratrax-analytics-js as `browser-umd.js`

---

## How to Build Node Package (Backend SDK)

```powershell
# Navigate to node package
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\node"

# Build
yarn build
```

**Output:** 
- `dist/cjs/` - CommonJS modules
- `dist/esm/` - ES modules  
- `dist/types/` - TypeScript declarations

---

## How to Publish Node Package to npm

### Step 1: Change Package Name for Publishing

Edit `packages/node/package.json`:
```json
{
  "name": "bratrax-analytics-node",  // Change from @segment/analytics-node
  "version": "1.0.1",  // Increment version
  ...
}
```

### Step 2: Build the Package

```powershell
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\node"
yarn build
```

### Step 3: Publish to npm

```powershell
# Make sure you're logged in
npm whoami

# If not logged in
npm login

# Publish (will open browser for authentication)
npm publish
```

### Step 4: Revert Package Name (Important!)

After publishing, change `packages/node/package.json` back:
```json
{
  "name": "@segment/analytics-node",  // Revert back
  "version": "2.2.0",
  ...
}
```

Then run:
```powershell
cd "C:\Inceptly\Vidtao + CPM\analytics-next"
yarn install
```

This ensures the workspace continues to function properly.

---

## Quick Reference

### Browser Build (One-Liner)
```powershell
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\browser"; $version = (Get-Content package.json | ConvertFrom-Json).version; if (-not (Test-Path src/generated)) { New-Item -ItemType Directory -Path src/generated }; "// This file is generated.`nexport const version = '$version'" | Out-File -FilePath src/generated/version.ts -Encoding utf8; $env:NODE_ENV="production"; yarn umd
```

### Node Build + Publish Workflow
```powershell
# 1. Edit package.json (change name to bratrax-analytics-node, bump version)
# 2. Build
cd "C:\Inceptly\Vidtao + CPM\analytics-next\packages\node"; yarn build

# 3. Publish
npm publish

# 4. Revert package.json (change name back to @segment/analytics-node)
# 5. Reinstall
cd "C:\Inceptly\Vidtao + CPM\analytics-next"; yarn install
```

---

## Important Notes

1. **Never commit** the `bratrax-analytics-node` name to git - it's only for publishing
2. **Always revert** the node package name after publishing
3. **Browser package** doesn't need name changes - it's not published to npm
4. **HTTPS is enforced** in the browser package - all requests go to https://api.bratrax.com
5. **Windows commands** are used throughout (del, PowerShell syntax)

---

## Troubleshooting

### "Workspace not found" Error
- Make sure all package names have correct `@segment/` prefix
- Run `yarn install` from the root

### "rm is not recognized" Error  
- Ignore it, the build scripts have been updated for Windows

### Browser Build Fails
- Make sure `src/generated/version.ts` exists (run the version generation command)
- Check that you're in the `packages/browser` directory

### npm Publish Requires 2FA
- Either use the browser authentication flow (Press ENTER when prompted)
- Or change package name to unscoped (e.g., `bratrax-analytics-node` instead of `@bratrax/analytics-node`)

---

## Summary

- ✅ Browser SDK: Built and ready for GCP upload
- ✅ Node SDK: Built and ready for npm publish (with name swap)
- ✅ HTTPS enforced for all browser requests
- ✅ Workspace functional with correct package names

