#!/bin/bash

# Install dependencies
npm install

# Build the project
npm run build

# Copy _redirects to dist if it exists in public
if [ -f "public/_redirects" ]; then
  cp public/_redirects dist/_redirects
  echo "✓ Copied _redirects to dist/"
fi

echo "✓ Build completed successfully!"
