// ========================================
// KONFIGURACIJA SAJTA
// ========================================
// Environment varijable sa fallback vrednostima

const config = {
    // Supabase konfiguracija - koristi environment varijable
    SUPABASE_URL: window.envLoader?.get('SUPABASE_URL') || 'https://mwapsdsomjjviogysbov.supabase.co',
    SUPABASE_ANON_KEY: window.envLoader?.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YXBzZHNvbWpqdmlvZ3lzYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTM0MzYsImV4cCI6MjA3MjMyOTQzNn0.N5AFDfF5y6ngrXDXsQHRWb6xbccpOf3C5r5w10Uwjss',
    
    // Admin konfiguracija - koristi environment varijable
    ADMIN_EMAIL: window.envLoader?.get('ADMIN_EMAIL') || 'davidheh15@gmail.com',
    
    // Security konfiguracija - koristi environment varijable
    CSRF_SECRET: window.envLoader?.get('CSRF_SECRET') || 'csrf-secret-key-' + Date.now(),
    RATE_LIMIT_MAX: parseInt(window.envLoader?.get('RATE_LIMIT_MAX')) || 10,
    RATE_LIMIT_WINDOW: parseInt(window.envLoader?.get('RATE_LIMIT_WINDOW')) || 60000, // 1 minuta
    
    // Debug mode - koristi environment varijable
    DEBUG: window.envLoader?.get('DEBUG') === 'true' || false
};

// Export za korišćenje
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else if (typeof window !== 'undefined') {
    window.APP_CONFIG = config;
}

console.log('Config loaded:', config.DEBUG ? config : 'Config loaded (debug disabled)');
