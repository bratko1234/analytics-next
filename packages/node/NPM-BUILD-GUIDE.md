# Building with npm (No Yarn Required!)

## Quick Build

Use the automated build script:

### Windows:
```bash
cd analytics-next/packages/node
.\build-standalone.bat
```

### Linux/Mac:
```bash
cd analytics-next/packages/node
chmod +x build-standalone.sh
./build-standalone.sh
```

That's it! The script will:
1. Build `@segment/analytics-generic-utils` dependency
2. Build `@segment/analytics-core` dependency  
3. Build `@bratrax/analytics-node` package

## What Changed for npm?

The package.json was updated to:
- ✅ Remove Yarn-specific scripts
- ✅ Use `file:` references for local dependencies
- ✅ Simplify build scripts for npm
- ✅ Remove workspace protocol dependencies

## Manual Build (if you prefer)

```bash
# Step 1: Build generic-utils
cd analytics-next/packages/generic-utils
npm install
npm run build

# Step 2: Build core
cd ../core
npm install
npm run build

# Step 3: Build node package
cd ../node
npm install
npm run build
```

## Publish to npm

After building:

```bash
npm login
npm publish --access public
```

## Install in Your Apps

```bash
npm install @bratrax/analytics-node
```

## Usage

```javascript
import { Analytics } from '@bratrax/analytics-node'

const analytics = new Analytics({
  writeKey: 'vidtao-test-write-key'
})

analytics.track({
  userId: 'user123',
  event: 'Payment Processed',
  properties: { amount: 99.99 }
})
```

## Troubleshooting

### Error: "Unsupported URL Type workspace:"
This means you need to build the dependencies first. Use the build-standalone script.

### Error: "Cannot find module '@segment/analytics-core'"
The core dependency hasn't been built yet. Run:
```bash
cd ../core && npm install && npm run build
```

### TypeScript not found
Install it:
```bash
npm install -g typescript
```

Or add it to devDependencies (already included in package.json).

## That's It!

No Yarn required. Just npm and the build script. 🎉

