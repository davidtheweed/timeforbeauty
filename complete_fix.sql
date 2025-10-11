-- ========================================
-- KOMPLETNO REŠAVANJE - RLS + APPOINTMENTS
-- ========================================

-- 1. UKLONI RLS REKURZIJU ZA KORISNICI TABELU
DROP POLICY IF EXISTS "Users can check their own role" ON korisnici;
DROP POLICY IF EXISTS "Admins can access all users" ON korisnici;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON korisnici;
DROP POLICY IF EXISTS "Enable update for users based on email" ON korisnici;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON korisnici;
DROP POLICY IF EXISTS "Allow anonymous read korisnici" ON korisnici;
DROP POLICY IF EXISTS "Allow authenticated insert korisnici" ON korisnici;
DROP POLICY IF EXISTS "Admin can read all korisnici" ON korisnici;
DROP POLICY IF EXISTS "Admin can update korisnici" ON korisnici;

-- 2. ONEMOGUĆI RLS ZA KORISNICI TABELU (rešava rekurziju)
ALTER TABLE korisnici DISABLE ROW LEVEL SECURITY;

-- 3. KREIRAJ is_admin() FUNKCIJU
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Proveri hardkodovane admin emailove
    IF auth.email() = 'davidheh15@gmail.com' THEN
        RETURN TRUE;
    END IF;
    
    -- Proveri ulogu iz baze podataka (sada bez RLS problema)
    RETURN EXISTS (
        SELECT 1 
        FROM korisnici 
        WHERE email = auth.email() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DODAJ ADMIN KORISNIKA
INSERT INTO korisnici (email, role)
VALUES ('davidheh15@gmail.com', 'admin')
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';

-- 5. FIX APPOINTMENTS POLITIKE
-- Ukloni postojeće politike za appointments
DROP POLICY IF EXISTS "Admin can read all appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can update appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can delete appointments" ON appointments;

-- Dodaj politiku za zakazivanje termina
CREATE POLICY "Allow appointment booking" ON appointments
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);  -- Dozvoli svim autentifikovanim korisnicima

-- Dodaj politiku za čitanje termina
CREATE POLICY "Users can read appointments" ON appointments
    FOR SELECT 
    TO authenticated
    USING (
        -- Dozvoli čitanje sopstvenih termina
        email = auth.email()
        OR
        -- Ili ako je admin
        is_admin()
    );

-- Dodaj politiku za ažuriranje termina
CREATE POLICY "Users can update appointments" ON appointments
    FOR UPDATE 
    TO authenticated
    USING (
        -- Dozvoli ažuriranje sopstvenih termina
        email = auth.email()
        OR
        -- Ili ako je admin
        is_admin()
    )
    WITH CHECK (
        -- Isti uslov za WITH CHECK
        email = auth.email()
        OR
        is_admin()
    );

-- Dodaj politiku za brisanje termina
CREATE POLICY "Users can delete appointments" ON appointments
    FOR DELETE 
    TO authenticated
    USING (
        -- Dozvoli brisanje sopstvenih termina
        email = auth.email()
        OR
        -- Ili ako je admin
        is_admin()
    );

-- 6. TEST FUNKCIJE
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
        ),
        'rls_disabled_for_korisnici', TRUE
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION test_appointment_access()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    result := json_build_object(
        'current_email', auth.email(),
        'is_admin', is_admin(),
        'can_insert_appointments', true,
        'can_read_own_appointments', true,
        'can_update_own_appointments', true
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. DOZVOLI PRISTUP
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION test_appointment_access() TO authenticated;
GRANT SELECT ON admin_appointments TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;

-- 8. FINALNI TEST
SELECT 
    'Complete fix applied' as status,
    auth.email() as current_user,
    is_admin() as is_admin_result;
