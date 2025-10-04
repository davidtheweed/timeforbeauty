-- Kompletno rešenje za appointments tabelu
-- Kopirajte i pokrenite ovaj kod u Supabase SQL Editor-u

-- 1. Obrišite postojeće politike ako postoje
DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow public select on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anonymous insert on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow anonymous select on appointments" ON appointments;

-- 2. Isključite RLS privremeno
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 3. Uključite RLS ponovo
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. Kreirajte nove politike koje dozvoljavaju anonimni pristup
CREATE POLICY "Allow anonymous insert on appointments" ON appointments
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select on appointments" ON appointments
    FOR SELECT 
    TO anon
    USING (true);

-- 5. Kreirajte i politike za authenticated korisnike (opciono)
CREATE POLICY "Allow authenticated insert on appointments" ON appointments
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated select on appointments" ON appointments
    FOR SELECT 
    TO authenticated
    USING (true);
