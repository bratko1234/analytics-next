#!/bin/bash
set -e

echo "Building @bratrax/analytics-node standalone package..."
echo ""

echo "Step 1: Building generic-utils dependency..."
cd ../generic-utils
npm install
npm run build
echo "✓ generic-utils built successfully"
echo ""

echo "Step 2: Building core dependency..."
cd ../core
npm install
npm run build
echo "✓ core built successfully"
echo ""

echo "Step 3: Building node package..."
cd ../node
npm install
npm run build
echo "✓ node package built successfully"
echo ""

echo "========================================"
echo "Build complete! Package is ready to publish."
echo "========================================"
echo ""
echo "To publish:"
echo "  npm login"
echo "  npm publish --access public"
echo ""

