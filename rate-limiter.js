// ========================================
// RATE LIMITING
// ========================================

class RateLimiter {
    constructor() {
        this.requests = new Map();
        this.config = window.APP_CONFIG || {};
        this.maxRequests = this.config.RATE_LIMIT_MAX || 10;
        this.windowMs = this.config.RATE_LIMIT_WINDOW || 60000; // 1 minuta
    }

    // Generiši ključ za korisnika
    generateKey(identifier) {
        return `rate_limit_${identifier}`;
    }

    // Proveri da li je korisnik prekoračio limit
    isAllowed(identifier) {
        const key = this.generateKey(identifier);
        const now = Date.now();
        
        // Uzmi postojeće zahteve
        let userRequests = this.requests.get(key) || [];
        
        // Ukloni stare zahteve (starije od windowMs)
        userRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
        
        // Proveri da li je prekoračen limit
        if (userRequests.length >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: Math.min(...userRequests) + this.windowMs
            };
        }
        
        // Dodaj novi zahtev
        userRequests.push(now);
        this.requests.set(key, userRequests);
        
        return {
            allowed: true,
            remaining: this.maxRequests - userRequests.length,
            resetTime: Math.min(...userRequests) + this.windowMs
        };
    }

    // Očisti stare zahteve
    cleanup() {
        const now = Date.now();
        for (const [key, requests] of this.requests.entries()) {
            const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
            if (validRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, validRequests);
            }
        }
    }

    // Dobij statistike za korisnika
    getStats(identifier) {
        const key = this.generateKey(identifier);
        const userRequests = this.requests.get(key) || [];
        const now = Date.now();
        const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
        
        return {
            count: validRequests.length,
            remaining: Math.max(0, this.maxRequests - validRequests.length),
            resetTime: validRequests.length > 0 ? Math.min(...validRequests) + this.windowMs : now
        };
    }
}

// Globalna instanca
const rateLimiter = new RateLimiter();

// Očisti stare zahteve svakih 5 minuta
setInterval(() => {
    rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Funkcija za proveru rate limita
function checkRateLimit(identifier) {
    return rateLimiter.isAllowed(identifier);
}

// Funkcija za dobijanje statistika
function getRateLimitStats(identifier) {
    return rateLimiter.getStats(identifier);
}

// Middleware funkcija za Supabase operacije
async function withRateLimit(identifier, operation) {
    const result = checkRateLimit(identifier);
    
    if (!result.allowed) {
        const resetTime = new Date(result.resetTime);
        throw new Error(`Rate limit prekoračen. Pokušajte ponovo posle ${resetTime.toLocaleTimeString()}`);
    }
    
    try {
        const operationResult = await operation();
        return operationResult;
    } catch (error) {
        throw error;
    }
}

// Export funkcija
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RateLimiter,
        checkRateLimit,
        getRateLimitStats,
        withRateLimit
    };
} else if (typeof window !== 'undefined') {
    window.RateLimiter = {
        checkRateLimit,
        getRateLimitStats,
        withRateLimit
    };
}
