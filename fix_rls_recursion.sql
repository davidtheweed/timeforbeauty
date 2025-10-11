-- ========================================
-- FIX RLS INFINITE RECURSION
-- ========================================

-- 1. Ukloni problematične politike
DROP POLICY IF EXISTS "Users can check their own role" ON korisnici;
DROP POLICY IF EXISTS "Admins can access all users" ON korisnici;

-- 2. Kreiraj jednostavnu politiku koja ne koristi is_admin() funkciju
CREATE POLICY "Allow role check for authenticated users" ON korisnici
    FOR SELECT
    TO authenticated
    USING (
        -- Dozvoli pristup ako je korisnik proverava svoju ulogu
        auth.email() = email
        OR
        -- Dozvoli pristup za hardkodovane admin emaile
        auth.email() = 'davidheh15@gmail.com'
    );

-- 3. Ažuriraj is_admin() funkciju da izbegne rekurziju
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

-- 4. Dodaj admin korisnika ako ne postoji
INSERT INTO korisnici (email, role)
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- 5. Test funkcija za proveru
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

-- 6. Dozvoli svima da pozovu test funkciju
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;
