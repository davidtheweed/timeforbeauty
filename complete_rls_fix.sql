-- ========================================
-- KOMPLETNO REŠAVANJE RLS REKURZIJE
-- ========================================

-- 1. UKLONI SVE POSTOJEĆE POLITIKE ZA KORISNICI TABELU
DROP POLICY IF EXISTS "Users can check their own role" ON korisnici;
DROP POLICY IF EXISTS "Admins can access all users" ON korisnici;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable update for users based on email" ON korisnici;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON korISNICI;

-- 2. ONEMOGUĆI RLS PRIVREMENO ZA KORISNICI TABELU
ALTER TABLE korisnici DISABLE ROW LEVEL SECURITY;

-- 3. KREIRAJ NOVU is_admin() FUNKCIJU KOJA NE KORISTI RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Prvo proveri hardkodovane admin emailove
    IF auth.email() = 'davidheh15@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Zatim proveri ulogu iz baze podataka
    -- Koristimo SECURITY DEFINER da zaobiđemo RLS
    BEGIN
        SELECT role INTO user_role
        FROM korisnici 
        WHERE email = auth.email();
        
        RETURN user_role = 'admin';
    EXCEPTION
        WHEN OTHERS THEN
            -- Ako ne možemo da pristupimo bazi, korisnik nije admin
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DODAJ ADMIN KORISNIKA U BAZU
INSERT INTO korisnici (email, role)
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- 5. KREIRAJ JEDNOSTAVNU POLITIKU KOJA NE KORISTI is_admin()
CREATE POLICY "Simple access policy" ON korisnici
    FOR ALL
    TO authenticated
    USING (
        -- Dozvoli pristup ako korisnik proverava svoju ulogu
        auth.email() = email
        OR
        -- Dozvoli pristup za hardkodovane admin emaile
        auth.email() = 'davidheh15@gmail.com'
    );

-- 6. OMOGUĆI RLS PONOVO
ALTER TABLE korisnici ENABLE ROW LEVEL SECURITY;

-- 7. TEST FUNKCIJA
CREATE OR REPLACE FUNCTION test_admin_status()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'current_email', auth.email(),
        'is_admin_function', is_admin(),
        'has_korisnici_record', EXISTS (
            SELECT 1 FROM korisnici WHERE email = auth.email()
        ),
        'role_from_db', (
            SELECT role FROM korisnici WHERE email = auth.email()
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. DOZVOLI SVIMA DA POZOVU TEST FUNKCIJU
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;

-- 9. DOZVOLI PRISTUP ADMIN VIEW-OVIMA
GRANT SELECT ON admin_appointments TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;

-- 10. FINALNI TEST - proveri da li sve radi
SELECT 
    'RLS Fix Complete' as status,
    auth.email() as current_user,
    is_admin() as is_admin_result;


