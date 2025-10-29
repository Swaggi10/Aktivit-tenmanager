# Aktivitätenmanager

Eine moderne, gamifizierte Aufgabenmanagement-Plattform mit Microsoft-Login, Echtzeit-Kollaboration und Team-Management.

## Features

- 🎮 **Demo-Modus** - Sofort loslegen ohne Azure AD!
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

## 🎮 Schnellstart mit Demo-Modus (Empfohlen!)

**Ohne Azure AD - sofort loslegen:**

```bash
# 1. App starten
docker-compose up -d

# 2. Datenbank initialisieren (nach ~30 Sekunden warten)
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed

# 3. Im Browser öffnen: http://localhost:3000

# 4. Mit Demo-Accounts einloggen:
#    - admin@demo.com (Admin-Rechte)
#    - teamleader@demo.com (Team-Leader)
#    - member@demo.com (Mitarbeiter)
```

**Weitere Infos**: [docs/DEMO_MODE.md](docs/DEMO_MODE.md)

## Schnellstart mit Microsoft-Login

Falls Sie Microsoft-Authentifizierung nutzen möchten:

```bash
# 1. Azure AD konfigurieren (siehe docs/AZURE_SETUP.md)
# 2. .env-Datei mit Azure-Credentials bearbeiten
# 3. App starten
docker-compose up -d
```

## Entwicklung ohne Docker

Siehe [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) für Details.

## Deployment

Siehe [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) für Deployment-Anleitungen.

## Microsoft Azure AD Setup

Siehe [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md) für die Einrichtung des Microsoft-Logins.

## Lizenz

Proprietary - Alle Rechte vorbehalten
