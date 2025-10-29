# Demo-Modus

Der Demo-Modus ermöglicht es Ihnen, die App sofort zu testen, **ohne Azure AD konfigurieren zu müssen**.

## Was ist der Demo-Modus?

- **Sofortiger Zugriff**: Keine Microsoft-Konto-Anmeldung erforderlich
- **Vorkonfigurierte Benutzer**: 3 Demo-Accounts mit unterschiedlichen Rollen
- **Volle Funktionalität**: Alle Features wie mit echten Accounts
- **Sicher**: Demo-Modus kann in Produktion deaktiviert werden

## Demo-Accounts

Nach dem Seed der Datenbank stehen folgende Demo-Accounts zur Verfügung:

### 1. Admin-Account
- **E-Mail**: `admin@demo.com`
- **Rolle**: ADMIN
- **Team**: LeadGen + Mailakquise
- **Punkte**: 1,250
- **Level**: 5
- **Berechtigungen**:
  - Vollzugriff auf alle Features
  - Kann Teams verwalten
  - Sieht alle Dashboards
  - Kann Aufgaben allen zuweisen

### 2. Team Leader-Account
- **E-Mail**: `teamleader@demo.com`
- **Rolle**: TEAM_LEADER
- **Team**: Akquise
- **Punkte**: 850
- **Level**: 4
- **Berechtigungen**:
  - Sieht Team-Dashboard
  - Kann Aufgaben im eigenen Team zuweisen
  - Kann Team-Statistiken einsehen

### 3. Member-Account
- **E-Mail**: `member@demo.com`
- **Rolle**: MEMBER
- **Team**: Sales Development
- **Punkte**: 420
- **Level**: 2
- **Berechtigungen**:
  - Sieht nur eigene Aufgaben
  - Kann Unteraufgaben erstellen
  - Kann Aufgaben kommentieren

## Aktivierung

### Standardmäßig aktiviert

Der Demo-Modus ist standardmäßig in der Entwicklungsumgebung aktiviert:

```env
DEMO_MODE="true"
```

### Manuell aktivieren/deaktivieren

Bearbeiten Sie die `.env` Datei:

```env
# Demo-Modus aktivieren
DEMO_MODE="true"

# Demo-Modus deaktivieren
DEMO_MODE="false"
```

## Verwendung

### 1. Login-Seite

Auf der Login-Seite (`http://localhost:3000`) sehen Sie, wenn Demo-Modus aktiviert ist:

- **3 farbige Buttons** für die Demo-Accounts:
  - 🎯 Als Admin einloggen (Lila)
  - 👥 Als Team Leader einloggen (Blau)
  - 👤 Als Member einloggen (Grün)

- **Trennlinie** mit "oder"

- **Microsoft-Login Button** (falls Sie Azure AD konfiguriert haben)

### 2. Schnell-Login

Klicken Sie einfach auf einen der Demo-Buttons und Sie werden sofort eingeloggt.

### 3. Rollen testen

Probieren Sie alle drei Rollen aus, um die unterschiedlichen Berechtigungen zu sehen:

```bash
# 1. Als Admin einloggen
# → Sehen Sie alle Funktionen und Dashboards

# 2. Ausloggen und als Team Leader einloggen
# → Sehen Sie nur Ihr Team-Dashboard

# 3. Ausloggen und als Member einloggen
# → Sehen Sie nur Ihre eigenen Aufgaben
```

## API-Endpunkte

### Demo-Status prüfen

```http
GET /api/auth/demo/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "demoUsers": [
      {
        "email": "admin@demo.com",
        "role": "ADMIN",
        "team": "LeadGen + Mailakquise"
      },
      {
        "email": "teamleader@demo.com",
        "role": "TEAM_LEADER",
        "team": "Akquise"
      },
      {
        "email": "member@demo.com",
        "role": "MEMBER",
        "team": "Sales Development"
      }
    ]
  }
}
```

### Demo-Login

```http
POST /api/auth/demo/login
Content-Type: application/json

{
  "email": "admin@demo.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@demo.com",
      "name": "Max Mustermann (Admin)",
      "role": "ADMIN",
      "team": { ... },
      "totalPoints": 1250,
      "level": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Sicherheit

### Entwicklung vs. Produktion

**Entwicklung** (Lokal):
- Demo-Modus ist aktiviert
- Schneller Zugriff zum Testen
- Keine echten Nutzerdaten

**Produktion** (Veröffentlicht):
- Demo-Modus sollte deaktiviert werden:
  ```env
  DEMO_MODE="false"
  NODE_ENV="production"
  ```
- Nur Microsoft-Login erlauben
- Demo-Accounts können gelöscht werden

### Demo-Accounts in Produktion

Wenn Sie Demo-Accounts in Produktion entfernen möchten:

```bash
# Mit Prisma Studio (GUI)
npx prisma studio

# Oder via SQL
docker-compose exec postgres psql -U taskmanager -d aktivitatenmanager -c \
  "DELETE FROM \"User\" WHERE email LIKE '%@demo.com';"
```

## Troubleshooting

### Demo-Buttons werden nicht angezeigt

**Ursache**: Demo-Modus ist deaktiviert oder Backend nicht erreichbar

**Lösung**:
```bash
# 1. Prüfen Sie .env
grep DEMO_MODE .env
# Sollte: DEMO_MODE="true"

# 2. Backend neu starten
docker-compose restart backend

# 3. Status prüfen
curl http://localhost:4000/api/auth/demo/status
```

### "Demo user not found"

**Ursache**: Datenbank wurde nicht geseeded

**Lösung**:
```bash
# Datenbank seeden
docker-compose exec backend npm run db:seed
```

### Demo-Login funktioniert nicht

**Ursache**: JWT Token-Problem oder Datenbank-Verbindung

**Lösung**:
```bash
# 1. Logs prüfen
docker-compose logs backend

# 2. Datenbank prüfen
docker-compose exec backend npx prisma studio

# 3. JWT Secret prüfen
grep JWT_SECRET .env
# Sollte einen Wert haben
```

## Vorteile des Demo-Modus

✅ **Schneller Start**: Keine Azure AD-Konfiguration nötig
✅ **Rollentest**: Alle drei Rollen ausprobieren
✅ **Entwicklung**: Schnelles Testen ohne Login-Umweg
✅ **Präsentationen**: Zeigen Sie die App sofort vor
✅ **CI/CD**: Automatisierte Tests ohne externe Auth

## Einschränkungen

⚠️ **Keine echte Authentifizierung**: Demo-Login ist nicht für Produktion geeignet
⚠️ **Gemeinsame Accounts**: Alle verwenden die gleichen Demo-Accounts
⚠️ **Keine Personalisierung**: Demo-Accounts sind vorkonfiguriert

## Von Demo zu Produktion

Wenn Sie bereit sind, die App zu veröffentlichen:

1. **Azure AD einrichten**: Siehe [AZURE_SETUP.md](./AZURE_SETUP.md)
2. **Demo-Modus deaktivieren**:
   ```env
   DEMO_MODE="false"
   NODE_ENV="production"
   ```
3. **Demo-Accounts entfernen** (optional)
4. **Echte User einladen**: Via Microsoft-Login

## Weitere Hilfe

- **Azure AD Setup**: [AZURE_SETUP.md](./AZURE_SETUP.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Development**: [DEVELOPMENT.md](./DEVELOPMENT.md)
