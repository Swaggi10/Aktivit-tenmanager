# Beitragen zum Aktivitätenmanager

Vielen Dank für Ihr Interesse, zum Projekt beizutragen! Hier sind einige Richtlinien.

## Wie kann ich beitragen?

### Bugs melden

Wenn Sie einen Bug finden:
1. Prüfen Sie, ob der Bug bereits als Issue existiert
2. Wenn nicht, erstellen Sie ein neues Issue mit:
   - Klarer Beschreibung des Problems
   - Schritten zur Reproduktion
   - Erwartetes vs. tatsächliches Verhalten
   - Screenshots (falls relevant)
   - Ihre Umgebung (Browser, OS, etc.)

### Features vorschlagen

Feature-Vorschläge sind willkommen! Erstellen Sie ein Issue mit:
- Klarer Beschreibung des Features
- Warum es nützlich wäre
- Mögliche Implementierungsansätze (optional)

### Code beitragen

1. **Fork** das Repository
2. **Clone** Ihren Fork
   ```bash
   git clone https://github.com/IHR-USERNAME/Aktivit-tenmanager.git
   ```
3. **Branch** erstellen
   ```bash
   git checkout -b feature/mein-neues-feature
   ```
4. **Änderungen** machen und committen
   ```bash
   git add .
   git commit -m "feat: Beschreibung des Features"
   ```
5. **Push** zu Ihrem Fork
   ```bash
   git push origin feature/mein-neues-feature
   ```
6. **Pull Request** erstellen

## Code-Style

- Verwenden Sie TypeScript für Type Safety
- Folgen Sie den ESLint-Regeln
- Schreiben Sie aussagekräftige Commit-Messages
- Kommentieren Sie komplexen Code
- Halten Sie Funktionen klein und fokussiert

## Commit-Messages

Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Neue Features
- `fix:` Bug-Fixes
- `docs:` Dokumentations-Änderungen
- `style:` Code-Formatierung
- `refactor:` Code-Refactoring
- `test:` Tests hinzufügen/ändern
- `chore:` Build, Dependencies, etc.

Beispiel:
```
feat: Add user profile page
fix: Resolve task update race condition
docs: Update deployment guide
```

## Pull Request Checklist

- [ ] Code folgt dem Projekt-Style
- [ ] Alle Tests bestehen
- [ ] Neue Features haben Tests
- [ ] Dokumentation wurde aktualisiert
- [ ] Commit-Messages sind aussagekräftig
- [ ] Branch ist aktuell mit main

## Fragen?

Bei Fragen erstellen Sie ein Issue oder kontaktieren Sie die Maintainer.

Vielen Dank für Ihren Beitrag! 🎉
