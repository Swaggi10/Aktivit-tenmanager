# Entwickler-Dokumentation

Anleitung für lokale Entwicklung und Beitrag zum Projekt.

## Voraussetzungen

- Node.js 20+
- npm oder yarn
- PostgreSQL 16+ (oder Docker)
- Git

## Lokales Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd Aktivit-tenmanager
```

### 2. Datenbank starten (mit Docker)

```bash
# PostgreSQL in Docker starten
docker run --name aktivitaten-postgres \
  -e POSTGRES_DB=aktivitatenmanager \
  -e POSTGRES_USER=taskmanager \
  -e POSTGRES_PASSWORD=taskmanager_password \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### 3. Backend einrichten

```bash
cd backend

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp ../.env.example ../.env
# Bearbeiten Sie .env mit Ihren Azure AD Credentials

# Datenbank migrieren und seeden
npx prisma migrate dev
npm run db:seed

# Entwicklungsserver starten
npm run dev
```

Backend läuft auf: [http://localhost:4000](http://localhost:4000)

### 4. Frontend einrichten

```bash
cd ../frontend

# Dependencies installieren
npm install

# Umgebungsvariablen
cp .env.example .env

# Entwicklungsserver starten
npm run dev
```

Frontend läuft auf: [http://localhost:3000](http://localhost:3000)

## Projektstruktur

```
Aktivit-tenmanager/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── config/         # Konfiguration
│   │   ├── controllers/    # Request Handler
│   │   ├── middleware/     # Express Middleware
│   │   ├── routes/         # API Routes
│   │   ├── services/       # Business Logic
│   │   ├── socket/         # Socket.io Events
│   │   ├── types/          # TypeScript Types
│   │   └── utils/          # Hilfsfunktionen
│   ├── prisma/
│   │   └── schema.prisma   # Datenbankschema
│   └── package.json
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   ├── pages/          # Seiten/Views
│   │   ├── hooks/          # Custom Hooks
│   │   ├── services/       # API Calls
│   │   ├── store/          # Zustand Store
│   │   ├── types/          # TypeScript Types
│   │   └── utils/          # Hilfsfunktionen
│   └── package.json
├── docs/                   # Dokumentation
├── docker-compose.yml      # Docker Setup
└── .env.example            # Beispiel-Umgebungsvariablen
```

## Wichtige Befehle

### Backend

```bash
# Entwicklung
npm run dev              # Dev-Server mit Hot-Reload

# Datenbank
npx prisma studio        # Datenbank UI öffnen
npx prisma migrate dev   # Neue Migration erstellen
npm run db:seed          # Datenbank mit Testdaten füllen

# Build & Start
npm run build            # TypeScript kompilieren
npm start                # Produktions-Server starten

# Checks
npm run lint             # Code linting
npm run type-check       # TypeScript prüfen
```

### Frontend

```bash
# Entwicklung
npm run dev              # Dev-Server mit Hot-Reload

# Build
npm run build            # Produktions-Build erstellen
npm run preview          # Build-Vorschau

# Checks
npm run lint             # Code linting
npm run type-check       # TypeScript prüfen
```

## API-Endpunkte

### Authentifizierung

- `GET /api/auth/microsoft` - Microsoft Login URL
- `GET /api/auth/microsoft/callback` - OAuth Callback
- `GET /api/auth/me` - Aktuellen User abrufen
- `POST /api/auth/logout` - Logout

### Aufgaben

- `GET /api/tasks` - Alle Aufgaben
- `GET /api/tasks/:id` - Einzelne Aufgabe
- `POST /api/tasks` - Neue Aufgabe erstellen
- `PATCH /api/tasks/:id` - Aufgabe aktualisieren
- `POST /api/tasks/:id/subtasks` - Unteraufgabe erstellen
- `PATCH /api/tasks/subtasks/:id/complete` - Unteraufgabe abschließen

### Teams

- `GET /api/teams` - Alle Teams
- `GET /api/teams/:id/statistics` - Team-Statistiken
- `GET /api/teams/statistics` - Alle Team-Statistiken (Admin)
- `GET /api/teams/members/underutilized` - Unterausgelastete Mitglieder

### Gamification

- `GET /api/gamification/leaderboard` - Leaderboard
- `GET /api/gamification/leaderboard/teams` - Team-Leaderboard
- `GET /api/gamification/achievements` - Alle Achievements
- `GET /api/gamification/achievements/me` - Eigene Achievements
- `GET /api/gamification/rank/me` - Eigener Rang

## Socket.io Events

### Client → Server

- `task:subscribe` - Task-Updates abonnieren
- `task:unsubscribe` - Abonnement beenden
- `task:update` - Task-Änderung broadcasten
- `comment:typing` - Typing-Indikator
- `comment:new` - Neuer Kommentar

### Server → Client

- `task:updated` - Task wurde aktualisiert
- `task:changed` - Allgemeine Task-Änderung
- `comment:typing` - Jemand tippt
- `comment:created` - Neuer Kommentar erstellt
- `user:online` - User ist online
- `user:offline` - User ist offline

## Datenbankschema

Siehe `backend/prisma/schema.prisma` für das vollständige Schema.

Wichtigste Modelle:
- **User** - Benutzer mit Rolle, Team, Punkten
- **Team** - 3 feste Teams mit Kapazität
- **Task** - Aufgaben mit Status, Priorität, Deadline
- **Subtask** - Unteraufgaben
- **Comment** - Kommentare mit @Mentions
- **Achievement** - Verfügbare Achievements
- **UserAchievement** - Freigeschaltete Achievements
- **Notification** - Benachrichtigungen

## Testing

```bash
# Backend Tests (TODO: Tests hinzufügen)
cd backend
npm test

# Frontend Tests (TODO: Tests hinzufügen)
cd frontend
npm test
```

## Code-Style

Das Projekt nutzt:
- **ESLint** für Linting
- **TypeScript** für Type Safety
- **Prettier** für Code Formatting (empfohlen)

### Empfohlene VSCode Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## Häufige Entwicklungs-Probleme

### Port bereits belegt

```bash
# Prozess auf Port finden und beenden
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Datenbank-Verbindung fehlgeschlagen

```bash
# Prüfen ob PostgreSQL läuft
docker ps

# Neu starten
docker restart aktivitaten-postgres
```

### Prisma Client veraltet

```bash
npx prisma generate
```

### Frontend kann Backend nicht erreichen

Prüfen Sie die Proxy-Konfiguration in `frontend/vite.config.ts`

## Hilfe & Support

- Dokumentation: `docs/`
- Issues: GitHub Issues
- Fragen: GitHub Discussions
