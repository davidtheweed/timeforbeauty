// ========================================
// CSRF PROTECTION
// ========================================

class CSRFProtection {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.secret = this.config.CSRF_SECRET || 'csrf-secret-key-' + Date.now();
        this.tokenName = 'csrf_token';
        this.headerName = 'X-CSRF-Token';
    }

    // Generiši CSRF token
    generateToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const data = `${timestamp}:${random}:${this.secret}`;
        
        // Jednostavna hash funkcija
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Konvertuj u 32-bit integer
        }
        
        return `${timestamp}:${random}:${Math.abs(hash).toString(36)}`;
    }

    // Validiraj CSRF token
    validateToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        const parts = token.split(':');
        if (parts.length !== 3) {
            return false;
        }

        const [timestamp, random, hash] = parts;
        
        // Proveri da li je token star (max 1 sat)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 sat
        
        if (now - tokenTime > maxAge) {
            return false;
        }

        // Rekonstruiši token i proveri hash
        const data = `${timestamp}:${random}:${this.secret}`;
        let expectedHash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            expectedHash = ((expectedHash << 5) - expectedHash) + char;
            expectedHash = expectedHash & expectedHash;
        }

        return Math.abs(expectedHash).toString(36) === hash;
    }

    // Postavi CSRF token u localStorage
    setToken() {
        const token = this.generateToken();
        localStorage.setItem(this.tokenName, token);
        return token;
    }

    // Uzmi CSRF token iz localStorage
    getToken() {
        return localStorage.getItem(this.tokenName);
    }

    // Ukloni CSRF token
    removeToken() {
        localStorage.removeItem(this.tokenName);
    }

    // Proveri da li postoji validan token
    hasValidToken() {
        const token = this.getToken();
        return this.validateToken(token);
    }

    // Generiši novi token ako je potreban
    ensureToken() {
        if (!this.hasValidToken()) {
            return this.setToken();
        }
        return this.getToken();
    }
}

// Globalna instanca
const csrfProtection = new CSRFProtection();

// Funkcija za dobijanje CSRF tokena
function getCSRFToken() {
    return csrfProtection.ensureToken();
}

// Funkcija za validaciju CSRF tokena
function validateCSRFToken(token) {
    return csrfProtection.validateToken(token);
}

// Funkcija za postavljanje CSRF tokena u formu
function setCSRFTokenInForm(form) {
    const token = getCSRFToken();
    
    // Ukloni postojeći CSRF input
    const existingInput = form.querySelector(`input[name="${csrfProtection.tokenName}"]`);
    if (existingInput) {
        existingInput.remove();
    }
    
    // Dodaj novi CSRF input
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = csrfProtection.tokenName;
    csrfInput.value = token;
    form.appendChild(csrfInput);
    
    return token;
}

// Funkcija za postavljanje CSRF tokena u headers
function setCSRFTokenInHeaders(headers = {}) {
    const token = getCSRFToken();
    headers[csrfProtection.headerName] = token;
    return headers;
}

// Middleware funkcija za Supabase operacije
async function withCSRFProtection(operation) {
    const token = getCSRFToken();
    
    if (!validateCSRFToken(token)) {
        throw new Error('CSRF token nije validan');
    }
    
    try {
        const result = await operation();
        return result;
    } catch (error) {
        throw error;
    }
}

// Funkcija za inicijalizaciju CSRF zaštite
function initializeCSRFProtection() {
    // Postavi token kada se stranica učita
    getCSRFToken();
    
    // Dodaj event listener za sve forme
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form.tagName === 'FORM') {
            setCSRFTokenInForm(form);
        }
    });
    
    // Obnovi token svakih 30 minuta
    setInterval(() => {
        csrfProtection.setToken();
    }, 30 * 60 * 1000);
}

// Export funkcija
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CSRFProtection,
        getCSRFToken,
        validateCSRFToken,
        setCSRFTokenInForm,
        setCSRFTokenInHeaders,
        withCSRFProtection,
        initializeCSRFProtection
    };
} else if (typeof window !== 'undefined') {
    window.CSRFProtection = {
        getCSRFToken,
        validateCSRFToken,
        setCSRFTokenInForm,
        setCSRFTokenInHeaders,
        withCSRFProtection,
        initializeCSRFProtection
    };
}
