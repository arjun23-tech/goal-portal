#!/bin/bash
set -e
echo "🚀 Setting up GoalFlow Backend..."

cd "$(dirname "$0")/backend"

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

echo ""
echo "✅ Backend ready! Starting server..."
echo "📡 API will be available at: http://localhost:8000"
echo "📚 API docs at: http://localhost:8000/docs"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
