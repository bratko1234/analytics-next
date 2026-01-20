# Build and Publish Instructions for @bratrax/analytics-node

## Prerequisites

- Node.js >= 18
- npm package manager
- npm account (for publishing)

## Building the Package

### Option 1: Automated Build (Recommended)

**Windows:**
```bash
cd analytics-next/packages/node
.\build-standalone.bat
```

**Linux/Mac:**
```bash
cd analytics-next/packages/node
chmod +x build-standalone.sh
./build-standalone.sh
```

This will automatically build all dependencies (generic-utils, core) and then build the node package.

### Option 2: Manual Build

1. **Navigate to the package directory:**
   ```bash
   cd analytics-next/packages/node
   ```

2. **Build dependencies first:**
   ```bash
   # Build generic-utils
   cd ../generic-utils
   npm install
   npm run build
   
   # Build core
   cd ../core
   npm install
   npm run build
   
   # Go back to node package
   cd ../node
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Build the package:**
   ```bash
   npm run build
   ```

   This will create:
   - `dist/cjs/` - CommonJS build
   - `dist/esm/` - ES Module build
   - `dist/types/` - TypeScript definitions

5. **Verify the build:**
   ```bash
   dir dist\ # Windows
   ls -la dist/ # Linux/Mac
   ```

## Publishing to npm

### First Time Setup

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Update package.json if needed:**
   - Change the repository URL
   - Update the version number
   - Add any additional metadata

### Publishing

1. **Test the package locally (optional):**
   ```bash
   npm pack
   ```
   This creates a `.tgz` file you can test install in another project.

2. **Publish to npm:**
   ```bash
   npm publish --access public
   ```

   Note: Add `--access public` if publishing a scoped package (@bratrax/analytics-node) for the first time.

3. **Verify the publication:**
   ```bash
   npm info @bratrax/analytics-node
   ```

## Using in Your Projects

After publishing, install in your backend applications:

```bash
npm install @bratrax/analytics-node
# or
yarn add @bratrax/analytics-node
```

## Testing Before Publishing

You can test the package locally without publishing:

1. **Build the package:**
   ```bash
   yarn build
   ```

2. **In your test project, install from local path:**
   ```bash
   npm install /path/to/analytics-next/packages/node
   ```

   Or use npm link:
   ```bash
   # In the package directory
   npm link
   
   # In your test project
   npm link @bratrax/analytics-node
   ```

## Version Management

Update version before publishing:

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch

# Minor version (1.0.0 -> 1.1.0)
npm version minor

# Major version (1.0.0 -> 2.0.0)
npm version major
```

## Build Scripts Reference

- `yarn build` - Full build (CJS + ESM + types)
- `yarn build:cjs` - CommonJS build only
- `yarn build:esm` - ES Module build only
- `yarn watch` - Watch mode for development
- `yarn test` - Run tests
- `yarn lint` - Run linter

## Troubleshooting

### Build Errors

If you get TypeScript errors:
1. Make sure all dependencies are installed: `yarn install`
2. Clean the dist folder: `rm -rf dist`
3. Rebuild: `yarn build`

### Monorepo Context

This package is part of the analytics-next monorepo. If building from the monorepo root:

```bash
# From monorepo root
yarn workspace @bratrax/analytics-node build
```

### Publishing Private Package

If you want to publish to a private npm registry:

```bash
npm publish --registry https://your-private-registry.com
```

## Post-Publication

After publishing, update your backend applications:

```bash
npm install @bratrax/analytics-node@latest
```

Or specify the exact version:

```bash
npm install @bratrax/analytics-node@1.0.0
```

