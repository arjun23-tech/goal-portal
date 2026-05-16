#!/bin/bash
set -e
echo "🎨 Setting up GoalFlow Frontend..."

cd "$(dirname "$0")/frontend"

npm install

echo ""
echo "✅ Frontend ready! Starting dev server..."
echo "🌐 App will be available at: http://localhost:3000"
echo ""

npm run dev
