// ========================================
// ENVIRONMENT VARIJABLE LOADER
// ========================================
// Jednostavan loader za environment varijable u browser-u

class EnvLoader {
    constructor() {
        this.env = {};
        this.loadEnv();
    }

    // Učitaj environment varijable iz localStorage ili default vrednosti
    loadEnv() {
        // Proveri da li postoje environment varijable u localStorage
        const storedEnv = localStorage.getItem('app_env');
        if (storedEnv) {
            try {
                this.env = JSON.parse(storedEnv);
                return;
            } catch (e) {
                console.warn('Greška pri učitavanju environment varijabli:', e);
            }
        }

        // Fallback na default vrednosti
        this.env = {
            SUPABASE_URL: 'https://mwapsdsomjjviogysbov.supabase.co',
            SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss',
            ADMIN_EMAIL: 'davidheh15@gmail.com',
            CSRF_SECRET: 'csrf-secret-key-' + Date.now(),
            RATE_LIMIT_MAX: 10,
            RATE_LIMIT_WINDOW: 60000,
            DEBUG: false
        };
    }

    // Uzmi environment varijablu
    get(key, defaultValue = null) {
        return this.env[key] || defaultValue;
    }

    // Postavi environment varijablu
    set(key, value) {
        this.env[key] = value;
        this.saveEnv();
    }

    // Sačuvaj environment varijable u localStorage
    saveEnv() {
        try {
            localStorage.setItem('app_env', JSON.stringify(this.env));
        } catch (e) {
            console.warn('Greška pri čuvanju environment varijabli:', e);
        }
    }

    // Učitaj environment varijable iz .env fajla (za development)
    async loadFromFile() {
        try {
            const response = await fetch('/.env');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split('\n');
                
                lines.forEach(line => {
                    line = line.trim();
                    if (line && !line.startsWith('#')) {
                        const [key, ...valueParts] = line.split('=');
                        if (key && valueParts.length > 0) {
                            const value = valueParts.join('=').trim();
                            this.env[key.trim()] = value;
                        }
                    }
                });
                
                this.saveEnv();
                console.log('Environment varijable učitane iz .env fajla');
            }
        } catch (e) {
            console.warn('Nije moguće učitati .env fajl:', e);
        }
    }

    // Export sve environment varijable
    getAll() {
        return { ...this.env };
    }
}

// Globalna instanca
const envLoader = new EnvLoader();

// Export za korišćenje
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnvLoader, envLoader };
} else if (typeof window !== 'undefined') {
    window.EnvLoader = EnvLoader;
    window.envLoader = envLoader;
}
