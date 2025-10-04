# 📋 Kako da registrujete novog admin korisnika

## 🔧 Problem
Novi Gmail (`timeforbeauty67n@gmail.com`) se ne može ulogovati jer nije registrovana u Supabase Auth sistemu.

## ✅ Rešenje 1: Supabase Dashboard (Preporučeno)

### Korak 1: Otvorite Supabase Dashboard
1. Idite na [supabase.com](https://supabase.com)
2. Ulogujte se u vaš nalog
3. Otvorite vaš projekat

### Korak 2: Authentication → Users
1. U levom meniju kliknite **"Authentication"**
2. Kliknite **"Users"**
3. Kliknite **"Add user"** (ili "Invite user")

### Korak 3: Dodajte novog korisnika
```
Email: timeforbeauty67n@gmail.com
Password: [postavite sigurnu lozinku]
Auto Confirm User: ✅ (označite)
```

### Korak 4: Sačuvajte
- Kliknite **"Create user"**
- Korisnik će biti kreiran i moći će se ulogovati

## ✅ Rešenje 2: SQL komanda (Napredno)

```sql
-- Registruj korisnika u auth.users tabeli
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'timeforbeauty67n@gmail.com',
    crypt('vasa_lozinka', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
```

## ✅ Rešenje 3: Email Invitation (Automatsko)

```sql
-- Pošalji pozivnicu korisniku
SELECT auth.invite_user('timeforbeauty67n@gmail.com', 'admin');
```

## 🔧 Testiranje

### Korak 1: Registrujte korisnika (jedan od gornjih načina)

### Korak 2: Proverite da li je kreiran
```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'timeforbeauty67n@gmail.com';
```

### Korak 3: Testirajte login
- Idite na vašu login stranicu
- Unesite: `timeforbeauty67n@gmail.com`
- Unesite lozinku koju ste postavili
- Trebalo bi da se ulogujete

## 📞 Kontakt sa korisnikom

Pošaljite Jelena Papic sledeće informacije:
```
Email: timeforbeauty67n@gmail.com
Password: [lozinka koju ste postavili]
Login URL: [vaš login URL]
```

## ⚠️ Važno

1. **Lozinka mora biti sigurna** (minimum 6 karaktera)
2. **Email mora biti ispravan**
3. **Korisnik mora imati admin ulogu** u `korisnici` tabeli
4. **Hardkodovana lista** već sadrži njen email

## 🎯 Finalni korak

Kada se korisnik uspešno registruje i uloguje:
1. Trebalo bi da može da pristupi admin panelu
2. `is_admin()` funkcija će vratiti `true`
3. Svi admin funkcionalnosti će raditi
