-- ========================================
-- FIX ADMIN ROLE CHECK RLS ISSUES
-- ========================================

-- 1. Dodaj politiku koja dozvoljava korisnicima da proveravaju svoju ulogu
DROP POLICY IF EXISTS "Users can check their own role" ON korisnici;

CREATE POLICY "Users can check their own role" ON korisnici
    FOR SELECT
    TO authenticated
    USING (auth.email() = email);

-- 2. Dodaj politiku koja dozvoljava adminima da pristupe svim korisnicima
DROP POLICY IF EXISTS "Admins can access all users" ON korisnici;

CREATE POLICY "Admins can access all users" ON korisnici
    FOR ALL
    TO authenticated
    USING (is_admin());

-- 3. Ažuriraj is_admin() funkciju da uključuje hardkodovane admin emailove
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Proveri hardkodovane admin emailove
    IF auth.email() = 'davidheh15@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Proveri ulogu iz baze podataka
    RETURN EXISTS (
        SELECT 1 
        FROM korisnici 
        WHERE email = auth.email() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dodaj korisnika u korisnici tabelu ako ne postoji
-- Prvo proveri strukturu tabele
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'korisnici';

-- Pokušaj da dodamo korisnika sa minimalnim poljima
INSERT INTO korisnici (email, role)
VALUES (
    'davidheh15@gmail.com',
    'admin'
)
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'admin';

-- 5. Dozvoli pristup admin view-ovima
GRANT SELECT ON admin_appointments TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;

-- 6. Test funkcija za proveru admin statusa
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

-- 7. Dozvoli svima da pozovu test funkciju
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;
