# Microsoft Azure AD Setup

Diese Anleitung zeigt Ihnen, wie Sie die Microsoft-Login-Funktion einrichten.

## Schritt 1: Azure Portal öffnen

1. Gehen Sie zu [https://portal.azure.com](https://portal.azure.com)
2. Melden Sie sich mit Ihrem Microsoft-Konto an

## Schritt 2: App-Registrierung erstellen

1. Suchen Sie nach **"Azure Active Directory"** oder **"Microsoft Entra ID"**
2. Klicken Sie im linken Menü auf **"App registrations"** (App-Registrierungen)
3. Klicken Sie auf **"+ New registration"** (+ Neue Registrierung)

### Registrierungsdetails

- **Name**: `Aktivitätenmanager`
- **Supported account types**:
  - Wählen Sie "Accounts in this organizational directory only" für nur Ihre Organisation
  - ODER "Accounts in any organizational directory" für alle Microsoft-Konten
- **Redirect URI**:
  - Platform: `Web`
  - URI: `http://localhost:4000/api/auth/microsoft/callback`

  (Für Produktion später anpassen!)

4. Klicken Sie auf **"Register"**

## Schritt 3: Client-Daten notieren

Nach der Registrierung sehen Sie die Übersichtsseite:

1. Kopieren Sie die **Application (client) ID** → Das ist Ihre `AZURE_CLIENT_ID`
2. Kopieren Sie die **Directory (tenant) ID** → Das ist Ihre `AZURE_TENANT_ID`

## Schritt 4: Client Secret erstellen

1. Klicken Sie im linken Menü auf **"Certificates & secrets"** (Zertifikate & Geheimnisse)
2. Unter **"Client secrets"** klicken Sie auf **"+ New client secret"**
3. Geben Sie eine Beschreibung ein (z.B. "Aktivitätenmanager Secret")
4. Wählen Sie eine Gültigkeitsdauer (empfohlen: 24 Monate)
5. Klicken Sie auf **"Add"**
6. **WICHTIG**: Kopieren Sie sofort den **Value** (Wert) → Das ist Ihre `AZURE_CLIENT_SECRET`

   ⚠️ Sie können diesen Wert nur EINMAL sehen! Speichern Sie ihn sicher.

## Schritt 5: API-Berechtigungen konfigurieren

1. Klicken Sie im linken Menü auf **"API permissions"** (API-Berechtigungen)
2. Sie sollten bereits "User.Read" sehen (automatisch hinzugefügt)
3. Falls nicht, klicken Sie auf **"+ Add a permission"**:
   - Wählen Sie **"Microsoft Graph"**
   - Wählen Sie **"Delegated permissions"**
   - Suchen und wählen Sie:
     - `User.Read`
     - `openid`
     - `profile`
     - `email`
4. Klicken Sie auf **"Add permissions"**

## Schritt 6: Umgebungsvariablen konfigurieren

Kopieren Sie `.env.example` zu `.env` und fügen Sie Ihre Werte ein:

```bash
cp .env.example .env
```

Bearbeiten Sie `.env`:

```env
# Ihre kopierten Werte aus Azure
AZURE_CLIENT_ID="ihre-application-client-id"
AZURE_CLIENT_SECRET="ihr-client-secret-value"
AZURE_TENANT_ID="ihre-directory-tenant-id"

# Für lokale Entwicklung
AZURE_REDIRECT_URI="http://localhost:4000/api/auth/microsoft/callback"
FRONTEND_URL="http://localhost:3000"
```

## Schritt 7: Für Produktion anpassen

Wenn Sie die App später veröffentlichen:

1. Gehen Sie zurück zu Ihrer App-Registrierung in Azure
2. Klicken Sie auf **"Authentication"** (Authentifizierung)
3. Fügen Sie eine neue Redirect URI hinzu:
   - z.B. `https://ihre-domain.com/api/auth/microsoft/callback`
4. Aktualisieren Sie Ihre Produktions-`.env`:

```env
AZURE_REDIRECT_URI="https://ihre-domain.com/api/auth/microsoft/callback"
FRONTEND_URL="https://ihre-domain.com"
```

## Troubleshooting

### Fehler: "AADSTS500011: The resource principal named ... was not found"

- Stellen Sie sicher, dass alle API-Berechtigungen korrekt hinzugefügt wurden
- Klicken Sie auf "Grant admin consent" falls erforderlich

### Fehler: "Redirect URI mismatch"

- Überprüfen Sie, ob die Redirect URI in Azure EXAKT mit der in `.env` übereinstimmt
- Keine Trailing Slashes!

### Fehler: "Invalid client secret"

- Das Client Secret ist möglicherweise abgelaufen
- Erstellen Sie ein neues Secret und aktualisieren Sie `.env`

## Weitere Informationen

- [Microsoft Identity Platform Dokumentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Dokumentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
