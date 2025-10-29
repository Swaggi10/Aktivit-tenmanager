# Aktivitätenmanager

Eine moderne, gamifizierte Aufgabenmanagement-Plattform mit Microsoft-Login, Echtzeit-Kollaboration und Team-Management.

## Features

- 🔐 Microsoft Account Login (Azure AD)
- 🎮 Gamification (Punkte, Leaderboards, Badges)
- ⚡ Echtzeit-Kollaboration mit Live-Updates
- 👥 Team-Management mit 3 festen Teams
- 📊 Intelligente Dashboards und Auslastungs-Visualisierung
- 🎯 Aufgaben mit Unteraufgaben und Deadlines
- 💬 Live-Kommentare und @Mentions
- 🎉 Feier-Animationen bei Erfolgen

## Tech-Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL mit Prisma ORM
- Socket.io für Echtzeit-Updates
- MSAL für Microsoft Authentication
- JWT für Session-Management

### Frontend
- React + TypeScript
- Vite als Build-Tool
- TailwindCSS für Styling
- Socket.io-client für Echtzeit
- Framer Motion für Animationen

## Schnellstart mit Docker

```bash
# 1. Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeiten Sie .env und fügen Sie Ihre Azure AD Credentials ein

# 2. App starten
docker-compose up -d

# 3. Im Browser öffnen
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000
```

## Entwicklung ohne Docker

Siehe [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) für Details.

## Deployment

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für Deployment-Anleitungen.

## Microsoft Azure AD Setup

Siehe [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md) für die Einrichtung des Microsoft-Logins.

## Lizenz

Proprietary - Alle Rechte vorbehalten
