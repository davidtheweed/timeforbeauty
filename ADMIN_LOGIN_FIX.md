# 🔧 ADMIN LOGIN FIX - Rešavanje problema sa autentifikacijom

## 🚨 Problem
Greška: "Korisnik nema definisanu ulogu" kada pokušavate da se ulogujete kao admin.

## 🔍 Uzrok
RLS (Row Level Security) politike blokiraju pristup `korisnici` tabeli za proveru admin uloge, što stvara "catch-22" situaciju:
- Trebamo admin ulogu da pristupimo tabeli
- Ali trebamo pristup tabeli da proverimo admin ulogu

## ✅ Rešenje

### Korak 1: Pokrenite SQL fix skript
```sql
-- Kopirajte i pokrenite ceo sadržaj fajla fix_admin_role_check.sql u Supabase SQL Editor
```

Ovaj skript će:
- ✅ Dodati politike koje dozvoljavaju korisnicima da proveravaju svoju ulogu
- ✅ Ažurirati `is_admin()` funkciju da uključuje hardkodovane admin emailove
- ✅ Dodati `davidheh15@gmail.com` u `korisnici` tabelu sa admin ulogom
- ✅ Kreirati test funkciju za debugging

### Korak 2: Testiranje
1. **Otvorite admin.html**
2. **Otvorite Developer Console** (F12)
3. **Kliknite "Admin Login"**
4. **Pogledajte console logove** - trebalo bi da vidite:
   ```
   Admin status test: {current_email: "davidheh15@gmail.com", is_admin_function: true, ...}
   Admin auth result: {isAdmin: true, user: {...}, error: null}
   ```

### Korak 3: Dodavanje novih admin korisnika
Da dodate novog admin korisnika, pokrenite:
```sql
INSERT INTO korisnici (email, role, first_name, last_name, phone, created_at)
VALUES (
    'novi-admin@email.com',
    'admin',
    'Ime',
    'Prezime',
    '+381123456789',
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';
```

## 🔧 Alternativno rešenje (ako SQL fix ne radi)

### Opcija A: Dodajte hardkodovane admin emailove
U `admin-middleware.js`, ažurirajte liniju 52:
```javascript
const adminEmails = ['davidheh15@gmail.com', 'drugi-admin@email.com'];
```

### Opcija B: Onemogućite RLS privremeno
```sql
-- SAMO ZA TESTIRANJE - NE PRODUKCIJA!
ALTER TABLE korisnici DISABLE ROW LEVEL SECURITY;
```

## 🎯 Očekivani rezultat
- ✅ Admin login radi bez grešaka
- ✅ Console logovi pokazuju uspešnu autentifikaciju
- ✅ Admin panel se otvara nakon login-a
- ✅ Svi admin funkcionalnosti rade

## 🚨 Ako i dalje ne radi
1. **Proverite da li je email tačno `davidheh15@gmail.com`**
2. **Proverite da li ste pokrenuli SQL fix skript**
3. **Pogledajte console logove za detaljne greške**
4. **Kontaktirajte za dodatnu pomoć**

