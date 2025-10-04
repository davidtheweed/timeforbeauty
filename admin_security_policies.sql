-- ========================================
-- ADMIN SECURITY POLICIES
-- ========================================
-- Kopirajte i pokrenite ovaj kod u Supabase SQL Editor-u

-- ========================================
-- 1. ADMIN POLITIKE ZA APPOINTMENTS TABELU
-- ========================================

-- Obrišite postojeće politike
DROP POLICY IF EXISTS "Allow anonymous insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anonymous select on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow authenticated select on appointments" ON appointments;

-- Omogućite RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CLIENT OPERATIONS (za sve korisnike)
-- ========================================

-- Dozvoli anonimnim korisnicima da zakazuju termine
CREATE POLICY "Allow anonymous insert appointments" ON appointments
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- ========================================
-- ADMIN OPERATIONS (samo za admin korisnike)
-- ========================================

-- Admin može da čita sve termine
CREATE POLICY "Admin can read all appointments" ON appointments
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );

-- Admin može da ažurira termine
CREATE POLICY "Admin can update appointments" ON appointments
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );

-- Admin može da briše termine
CREATE POLICY "Admin can delete appointments" ON appointments
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );

-- ========================================
-- 2. ADMIN POLITIKE ZA KORISNICI TABELU
-- ========================================

-- Obrišite postojeće politike
DROP POLICY IF EXISTS "Allow authenticated read on korisnici" ON korisnici;
DROP POLICY IF EXISTS "Allow anonymous read on korisnici" ON korisnici;
DROP POLICY IF EXISTS "Allow authenticated insert on korisnici" ON korisnici;
DROP POLICY IF EXISTS "Allow authenticated update on korisnici" ON korisnici;

-- Omogućite RLS
ALTER TABLE korisnici ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CLIENT OPERATIONS
-- ========================================

-- Dozvoli anonimnim korisnicima da čitaju korisnike (za login)
CREATE POLICY "Allow anonymous read korisnici" ON korisnici
    FOR SELECT 
    TO anon
    USING (true);

-- Dozvoli autentifikovanim korisnicima da se registruju
CREATE POLICY "Allow authenticated insert korisnici" ON korisnici
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' = email);

-- ========================================
-- ADMIN OPERATIONS
-- ========================================

-- Admin može da čita sve korisnike
CREATE POLICY "Admin can read all korisnici" ON korisnici
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );

-- Admin može da ažurira korisnike
CREATE POLICY "Admin can update korisnici" ON korisnici
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );

-- ========================================
-- 3. KREIRANJE ADMIN FUNKCIJE
-- ========================================

-- Funkcija za proveru admin statusa
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM korisnici 
            WHERE korisnici.email = auth.jwt() ->> 'email' 
            AND korisnici.role = 'admin'
        )
        OR 
        auth.jwt() ->> 'email' = 'davidheh15@gmail.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. KREIRANJE ADMIN VIEW-A
-- ========================================

-- Kreiranje admin view-a za sigurniji pristup
CREATE OR REPLACE VIEW admin_appointments AS
SELECT * FROM appointments
WHERE is_admin();

-- Kreiranje admin view-a za korisnike
CREATE OR REPLACE VIEW admin_users AS
SELECT * FROM korisnici
WHERE is_admin();

-- ========================================
-- 5. GRANT DOZVOLE
-- ========================================

-- Dozvoli anonimnim korisnicima da pristupe appointments tabeli
GRANT SELECT, INSERT ON appointments TO anon;

-- Dozvoli autentifikovanim korisnicima da pristupe appointments tabeli
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;

-- Dozvoli anonimnim korisnicima da pristupe korisnici tabeli (za login)
GRANT SELECT ON korisnici TO anon;

-- Dozvoli autentifikovanim korisnicima da pristupe korisnici tabeli
GRANT SELECT, INSERT, UPDATE ON korisnici TO authenticated;

-- Dozvoli pristup admin view-ovima
GRANT SELECT ON admin_appointments TO authenticated;
GRANT SELECT ON admin_users TO authenticated;

-- ========================================
-- 6. KREIRANJE ADMIN API FUNKCIJA
-- ========================================

-- Funkcija za admin statistike
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    RETURN json_build_object(
        'total_appointments', (SELECT COUNT(*) FROM appointments),
        'today_appointments', (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE),
        'total_users', (SELECT COUNT(*) FROM korisnici)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funkcija za admin izveštaje
CREATE OR REPLACE FUNCTION get_admin_report(start_date DATE, end_date DATE)
RETURNS TABLE (
    appointment_date DATE,
    appointment_time TIME,
    first_name TEXT,
    service TEXT
) AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    RETURN QUERY
    SELECT 
        a.appointment_date,
        a.appointment_time,
        a.first_name,
        a.service
    FROM appointments a
    WHERE a.appointment_date BETWEEN start_date AND end_date
    ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. KREIRANJE ADMIN TRIGGER-A
-- ========================================

-- Trigger za logovanje admin aktivnosti
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF is_admin() THEN
        INSERT INTO admin_activity_log (
            admin_email,
            table_name,
            operation,
            old_data,
            new_data,
            timestamp
        ) VALUES (
            auth.jwt() ->> 'email',
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kreiranje admin activity log tabele
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id BIGSERIAL PRIMARY KEY,
    admin_email TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Omogućite RLS za admin activity log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Samo admini mogu da čitaju admin activity log
CREATE POLICY "Admin can read activity log" ON admin_activity_log
    FOR SELECT 
    TO authenticated
    USING (is_admin());

-- Dodajte trigger-e na appointments tabelu
DROP TRIGGER IF EXISTS admin_activity_appointments ON appointments;
CREATE TRIGGER admin_activity_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

-- Dodajte trigger-e na korisnici tabelu
DROP TRIGGER IF EXISTS admin_activity_korisnici ON korisnici;
CREATE TRIGGER admin_activity_korisnici
    AFTER INSERT OR UPDATE OR DELETE ON korisnici
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
