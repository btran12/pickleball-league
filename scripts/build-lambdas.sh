#!/bin/bash
# ============================================================
# PicklePal - Lambda Build & Package Script
# ============================================================
# Builds and packages Lambda functions for deployment
# Usage: ./build-lambdas.sh
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/.build/lambda"

echo "🥒 PicklePal Lambda Builder"
echo "=========================="
echo ""

# Clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Function to build a Lambda package
build_lambda() {
  local name=$1
  local src_dir=$2
  local output="$BUILD_DIR/${name}.zip"

  echo "📦 Building: $name"
  
  # Create temp directory
  local temp_dir=$(mktemp -d)
  
  # Copy source files
  cp -r "$src_dir"/* "$temp_dir/"
  
  # Install dependencies
  cd "$temp_dir"
  if [ -f "package.json" ]; then
    echo "   Installing dependencies..."
    npm install --production --silent 2>/dev/null
  fi
  
  # Create zip
  echo "   Creating package..."
  zip -r -q "$output" . -x "*.test.*" "*.spec.*" "node_modules/.cache/*"
  
  # Cleanup
  cd "$PROJECT_ROOT"
  rm -rf "$temp_dir"
  
  local size=$(du -h "$output" | cut -f1)
  echo "   ✅ Created: $output ($size)"
  echo ""
}

# Build each Lambda function
build_lambda "api-handler" "$PROJECT_ROOT/src/lambda/api-handler"
build_lambda "auto-confirm" "$PROJECT_ROOT/src/lambda/auto-confirm"
build_lambda "weekly-reminder" "$PROJECT_ROOT/src/lambda/weekly-reminder"

echo "=========================="
echo "✅ All Lambda packages built!"
echo ""
echo "Output directory: $BUILD_DIR"
echo ""
echo "Deploy with:"
echo "  aws lambda update-function-code \\"
echo "    --function-name picklepal-dev-api-handler \\"
echo "    --zip-file fileb://$BUILD_DIR/api-handler.zip"
echo ""
echo "  aws lambda update-function-code \\"
echo "    --function-name picklepal-dev-auto-confirm \\"
echo "    --zip-file fileb://$BUILD_DIR/auto-confirm.zip"
echo ""
echo "  aws lambda update-function-code \\"
echo "    --function-name picklepal-dev-weekly-reminder \\"
echo "    --zip-file fileb://$BUILD_DIR/weekly-reminder.zip"
