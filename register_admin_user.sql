-- ========================================
-- REGISTRACIJA NOVOG ADMIN KORISNIKA
-- ========================================

-- 1. Proveri da li korisnik već postoji u auth.users
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'timeforbeauty67@gmail.com';

-- 2. Registruj korisnika u auth.users tabeli
-- VAŽNO: Zamenite 'admin123' sa sigurnom lozinkom!
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
    'timeforbeauty67@gmail.com',
    crypt('admin123', gen_salt('bf')),  -- ZAMENITE SA SIGURNOM LOZINKOM!
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

-- 3. Proveri da li je korisnik kreiran
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'timeforbeauty67@gmail.com';

-- 4. Ažuriraj ili dodaj u korisnici tabelu
INSERT INTO korisnici (email, role, first_name, last_name, phone, created_at)
VALUES (
    'timeforbeauty67@gmail.com',
    'admin',
    'Jelena',
    'Papic',
    '+063 220 665',
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
    role = 'admin',
    first_name = 'Jelena',
    last_name = 'Papic',
    phone = '+063 220 665';

-- 5. Proveri finalni rezultat
SELECT 
    k.email,
    k.role,
    k.first_name,
    k.last_name,
    au.email_confirmed_at,
    au.created_at as auth_created
FROM korisnici k
LEFT JOIN auth.users au ON k.email = au.email
WHERE k.email = 'timeforbeauty67n@gmail.com';

-- ========================================
-- UPUTSTVO:
-- ========================================
-- 1. Zamenite 'admin123' sa sigurnom lozinkom
-- 2. Pokrenite ovaj skript u Supabase SQL Editor-u
-- 3. Jelena moći će se ulogovati sa:
--    Email: timeforbeauty67@gmail.com
--    Password: [lozinka koju ste postavili]


