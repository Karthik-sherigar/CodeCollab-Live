#!/bin/bash

echo "🚀 CollabCode Live - Setup Helper"
echo "=================================="
echo ""

# Check if MySQL is running
echo "Checking MySQL status..."
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL is not running. Starting MySQL..."
    sudo systemctl start mysql
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure MySQL Database:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE collabcode_db;"
echo "   exit"
echo ""
echo "2. Update backend/.env with your MySQL password"
echo ""
echo "3. Get Google OAuth Credentials:"
echo "   - Visit: https://console.cloud.google.com/"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add http://localhost:5173 to authorized origins"
echo "   - Update backend/.env and frontend/.env with Client ID"
echo ""
echo "4. Start the servers:"
echo "   Terminal 1: cd backend && npm start"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "=================================="
