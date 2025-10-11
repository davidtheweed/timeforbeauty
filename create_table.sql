-- Kreiranje tabele za zakazivanje termina
-- Kopirajte i pokrenite ovaj kod u Supabase SQL Editor-u

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    service TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kreiranje indeksa za bolje performanse
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_email ON appointments(email);

-- Omogućavanje RLS (Row Level Security)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Kreiranje politike koja dozvoljava unos podataka
CREATE POLICY "Allow public insert on appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- Kreiranje politike koja dozvoljava čitanje podataka (opciono)
CREATE POLICY "Allow public select on appointments" ON appointments
    FOR SELECT USING (true);

-- Ako postoje problemi sa politikama, možete ih obrisati i kreirati ponovo:
-- DROP POLICY IF EXISTS "Allow public insert on appointments" ON appointments;
-- DROP POLICY IF EXISTS "Allow public select on appointments" ON appointments;
