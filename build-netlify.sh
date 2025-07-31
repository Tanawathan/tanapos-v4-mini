#!/bin/bash
# Netlify build script with error handling

set -e  # Exit on any error

echo "Starting Netlify build process..."

echo "Node.js version:"
node --version

echo "NPM version:"
npm --version

echo "Installing dependencies..."
npm ci

echo "Checking TypeScript..."
npx tsc --version

echo "Running TypeScript check..."
npx tsc --noEmit

echo "Building with Vite..."
npx vite build

echo "Build completed successfully!"
