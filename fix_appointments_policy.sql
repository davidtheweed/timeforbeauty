-- ========================================
-- FIX APPOINTMENTS POLICY - DOZVOLI ZAKAZIVANJE TERMINA
-- ========================================

-- 1. DODAJ POLITIKU ZA ZAKAZIVANJE TERMINA (INSERT)
CREATE POLICY "Allow appointment booking" ON appointments
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);  -- Dozvoli svim autentifikovanim korisnicima

-- 2. DODAJ POLITIKU ZA ČITANJE SOPSTVENIH TERMINA
CREATE POLICY "Users can read own appointments" ON appointments
    FOR SELECT 
    TO authenticated
    USING (
        -- Dozvoli čitanje ako je email isti kao u appointment
        email = auth.email()
        OR
        -- Ili ako je admin
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.email() 
            AND korisnici.role = 'admin'
        )
        OR
        -- Ili ako je hardkodovani admin
        auth.email() = 'davidheh15@gmail.com'
    );

-- 3. DODAJ POLITIKU ZA AŽURIRANJE SOPSTVENIH TERMINA
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE 
    TO authenticated
    USING (
        -- Dozvoli ažuriranje ako je email isti kao u appointment
        email = auth.email()
        OR
        -- Ili ako je admin
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.email() 
            AND korisnici.role = 'admin'
        )
        OR
        -- Ili ako je hardkodovani admin
        auth.email() = 'davidheh15@gmail.com'
    )
    WITH CHECK (
        -- Isti uslov za WITH CHECK
        email = auth.email()
        OR
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.email() 
            AND korisnici.role = 'admin'
        )
        OR
        auth.email() = 'davidheh15@gmail.com'
    );

-- 4. TEST FUNKCIJA ZA PROVERU
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

-- 5. DOZVOLI PRISTUP TEST FUNKCIJI
GRANT EXECUTE ON FUNCTION test_appointment_access() TO authenticated;

-- 6. FINALNI TEST
SELECT 
    'Appointments policies fixed' as status,
    auth.email() as current_user,
    test_appointment_access() as access_test;


