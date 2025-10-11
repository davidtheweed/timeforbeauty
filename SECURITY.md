# Sigurnosne mere za sajt

## Environment varijable

### Kreiranje .env fajla
1. Kopirajte `env.example` fajl kao `.env`
2. Popunite sa vašim stvarnim vrednostima:

```bash
# Supabase konfiguracija
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Admin konfiguracija
ADMIN_EMAIL=your-admin@email.com

# Security konfiguracija
CSRF_SECRET=your-csrf-secret-here
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000

# Debug mode
DEBUG=false
```

### Važno
- **NIKAD ne commit-ujte .env fajl u git!**
- Dodajte `.env` u `.gitignore`
- Koristite različite vrednosti za development i production

## Subresource Integrity (SRI)

### Ažuriranje SRI hash-a za Supabase
Trenutno je postavljen placeholder hash `sha384-...`. Da biste dobili stvarni hash:

1. Preuzmite Supabase skriptu:
```bash
curl -o supabase.js https://unpkg.com/@supabase/supabase-js@2/dist/main/index.js
```

2. Generišite SHA384 hash:
```bash
# Linux/Mac
openssl dgst -sha384 -binary supabase.js | openssl base64 -A

# Windows PowerShell
Get-FileHash supabase.js -Algorithm SHA384 | ForEach-Object { [Convert]::ToBase64String([System.Convert]::FromHexString($_.Hash)) }
```

3. Zamenite `sha384-...` sa stvarnim hash-om u svim HTML fajlovima

## Implementirane sigurnosne mere

✅ **Environment varijable** - Osetljivi podaci izdvojeni iz koda
✅ **Input validacija** - Provera svih korisničkih unosa
✅ **Input sanitizacija** - Uklanjanje opasnih karaktera
✅ **Rate limiting** - Ograničavanje broja zahteva
✅ **CSRF zaštita** - Tokeni protiv cross-site request forgery
✅ **Security headers** - CSP, XSS zaštita, frame options
✅ **Subresource Integrity** - Zaštita od kompromitovanih eksternih skripti
✅ **Supabase RLS** - Row Level Security na bazi podataka

## Preporučene dodatne mere

1. **HTTPS** - Uvek koristite HTTPS u production
2. **Backup** - Redovno backup-ujte bazu podataka
3. **Monitoring** - Pratite sigurnosne događaje
4. **Ažuriranje** - Redovno ažurirajte zavisnosti
5. **Testiranje** - Testirajte sigurnosne mere

## Kontakt

Za sigurnosne probleme, kontaktirajte: davidheh15@gmail.com
