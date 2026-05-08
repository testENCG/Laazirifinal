#!/bin/bash
echo "========================================"
echo "   LAAZIRI TRAVEL - Démarrage"
echo "========================================"
echo ""

echo "[1/2] Démarrage du Backend Flask..."
cd backend && python app.py &
BACKEND_PID=$!
cd ..

sleep 2

echo "[2/2] Démarrage du Frontend React..."
cd frontend-react && npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo "✅ Application lancée !"
echo ""
echo "🌐 Ouvrir dans le navigateur :"
echo "   → http://localhost:5173"
echo ""
echo "Pour arrêter : Ctrl+C"
wait
