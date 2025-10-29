# Deployment-Anleitung

Diese Anleitung zeigt Ihnen verschiedene Möglichkeiten, die Aktivitätenmanager-App zu deployen.

## Option 1: Docker Compose (Empfohlen für Einsteiger)

### Voraussetzungen

- Docker Desktop installiert ([Download](https://www.docker.com/products/docker-desktop/))
- Git installiert

### Schritt-für-Schritt

1. **Repository klonen** (falls noch nicht geschehen)
   ```bash
   git clone <ihr-repository-url>
   cd Aktivit-tenmanager
   ```

2. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   ```

   Bearbeiten Sie `.env` und fügen Sie Ihre Azure AD Credentials ein (siehe [AZURE_SETUP.md](./AZURE_SETUP.md))

3. **App starten**
   ```bash
   docker-compose up -d
   ```

4. **Datenbank initialisieren**
   ```bash
   # Warten Sie ~30 Sekunden, bis die Datenbank bereit ist
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npm run db:seed
   ```

5. **App öffnen**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:4000](http://localhost:4000)

### Stoppen und Neustarten

```bash
# Stoppen
docker-compose down

# Starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Alles löschen (inkl. Datenbank!)
docker-compose down -v
```

## Option 2: Manuelles Deployment auf eigenem Server

### Voraussetzungen

- Node.js 20+ installiert
- PostgreSQL 16+ installiert
- Git installiert

### Backend-Deployment

1. **Repository klonen**
   ```bash
   git clone <ihr-repository-url>
   cd Aktivit-tenmanager/backend
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp ../.env.example ../.env
   # Bearbeiten Sie .env mit Ihren Werten
   ```

4. **Datenbank einrichten**
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. **App bauen und starten**
   ```bash
   npm run build
   npm start
   ```

   Oder mit PM2 (empfohlen für Produktion):
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name aktivitatenmanager-backend
   pm2 save
   pm2 startup
   ```

### Frontend-Deployment

1. **Zum Frontend-Ordner wechseln**
   ```bash
   cd ../frontend
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   # Passen Sie die API-URL an Ihren Server an
   ```

4. **App bauen**
   ```bash
   npm run build
   ```

5. **Mit Webserver bereitstellen**

   **Option A: Mit nginx**
   ```bash
   # Kopieren Sie den dist-Ordner zu nginx
   sudo cp -r dist/* /var/www/html/
   ```

   **Option B: Mit serve**
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

## Option 3: Cloud-Deployment (Heroku, Railway, etc.)

### Railway (Einfach und kostenlos für kleine Apps)

1. Gehen Sie zu [railway.app](https://railway.app)
2. Melden Sie sich an (GitHub empfohlen)
3. Klicken Sie auf "New Project" → "Deploy from GitHub repo"
4. Wählen Sie Ihr Repository
5. Railway erkennt automatisch die Dockerfiles
6. Fügen Sie Umgebungsvariablen hinzu:
   - Alle Werte aus `.env.example`
   - Setzen Sie `DATABASE_URL` auf die Railway PostgreSQL-Verbindung
7. Deploy starten

### Heroku

1. Installieren Sie Heroku CLI
2. Erstellen Sie zwei Apps (Frontend & Backend):
   ```bash
   heroku create aktivitatenmanager-backend
   heroku create aktivitatenmanager-frontend
   ```
3. Fügen Sie PostgreSQL hinzu:
   ```bash
   heroku addons:create heroku-postgresql:mini -a aktivitatenmanager-backend
   ```
4. Setzen Sie Umgebungsvariablen:
   ```bash
   heroku config:set AZURE_CLIENT_ID=xxx -a aktivitatenmanager-backend
   # ... weitere Variablen
   ```
5. Deploy:
   ```bash
   git subtree push --prefix backend heroku-backend main
   git subtree push --prefix frontend heroku-frontend main
   ```

## Option 4: VPS (Virtual Private Server)

### Beliebte VPS-Anbieter

- **Hetzner Cloud** (günstig, Europa) - ab 4€/Monat
- **DigitalOcean** (einfach) - ab 5$/Monat
- **Linode** (zuverlässig) - ab 5$/Monat
- **Contabo** (sehr günstig) - ab 5€/Monat

### Setup auf VPS

1. **Server erstellen** (Ubuntu 22.04 empfohlen)

2. **SSH-Verbindung herstellen**
   ```bash
   ssh root@ihre-server-ip
   ```

3. **Docker installieren**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Repository klonen und starten**
   ```bash
   git clone <ihr-repository-url>
   cd Aktivit-tenmanager
   cp .env.example .env
   nano .env  # Bearbeiten Sie die Werte
   docker-compose up -d
   ```

5. **Domain konfigurieren** (optional)
   - Kaufen Sie eine Domain (z.B. bei Namecheap, GoDaddy)
   - Setzen Sie A-Record auf Ihre Server-IP
   - Installieren Sie nginx als Reverse Proxy
   - Nutzen Sie Let's Encrypt für HTTPS:
     ```bash
     sudo apt install certbot python3-certbot-nginx
     sudo certbot --nginx -d ihre-domain.com
     ```

## Wichtige Sicherheitshinweise

### Für Produktion

1. **Ändern Sie alle Secrets**:
   - Generieren Sie einen starken `JWT_SECRET`
   - Verwenden Sie sichere Passwörter

2. **Aktivieren Sie HTTPS**:
   - Verwenden Sie Let's Encrypt (kostenlos)
   - Oder nutzen Sie Cloudflare

3. **Firewall konfigurieren**:
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

4. **Regelmäßige Updates**:
   ```bash
   # Auf dem Server
   docker-compose pull
   docker-compose up -d
   ```

5. **Backups**:
   ```bash
   # Datenbank-Backup
   docker-compose exec postgres pg_dump -U taskmanager aktivitatenmanager > backup.sql
   ```

## Monitoring & Logs

### Docker Logs

```bash
# Alle Logs
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Fehler
docker-compose logs -f | grep ERROR
```

### Uptime-Monitoring

Nutzen Sie kostenlose Services wie:
- [UptimeRobot](https://uptimerobot.com)
- [StatusCake](https://www.statuscake.com)

## Troubleshooting

### App startet nicht

```bash
# Prüfen Sie die Logs
docker-compose logs

# Prüfen Sie ob alle Container laufen
docker-compose ps

# Datenbank-Verbindung testen
docker-compose exec backend npx prisma db pull
```

### Datenbank-Probleme

```bash
# Datenbank neu erstellen
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run db:seed
```

### Port bereits belegt

Ändern Sie die Ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:4000"  # Statt 4000:4000
```

## Support

Bei Problemen:
1. Prüfen Sie die Logs
2. Konsultieren Sie die Dokumentation
3. Erstellen Sie ein Issue auf GitHub
