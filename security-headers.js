// ========================================
// SECURITY HEADERS
// ========================================

// Funkcija za postavljanje security meta tagova
function setSecurityMetaTags() {
    // Content Security Policy
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://*.supabase.co;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    `.replace(/\s+/g, ' ').trim();
    document.head.appendChild(cspMeta);

    // X-Content-Type-Options
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);

    // X-Frame-Options
    const frameOptionsMeta = document.createElement('meta');
    frameOptionsMeta.httpEquiv = 'X-Frame-Options';
    frameOptionsMeta.content = 'DENY';
    document.head.appendChild(frameOptionsMeta);

    // X-XSS-Protection
    const xssProtectionMeta = document.createElement('meta');
    xssProtectionMeta.httpEquiv = 'X-XSS-Protection';
    xssProtectionMeta.content = '1; mode=block';
    document.head.appendChild(xssProtectionMeta);

    // Referrer Policy
    const referrerPolicyMeta = document.createElement('meta');
    referrerPolicyMeta.name = 'referrer';
    referrerPolicyMeta.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrerPolicyMeta);

    // Permissions Policy
    const permissionsPolicyMeta = document.createElement('meta');
    permissionsPolicyMeta.httpEquiv = 'Permissions-Policy';
    permissionsPolicyMeta.content = `
        camera=(),
        microphone=(),
        geolocation=(),
        payment=(),
        usb=()
    `.replace(/\s+/g, ' ').trim();
    document.head.appendChild(permissionsPolicyMeta);
}

// Funkcija za postavljanje security atributa na forme
function setSecurityFormAttributes() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Dodaj autocomplete="off" za osetljive forme
        if (form.id === 'adminLoginForm' || form.id === 'registrationForm') {
            form.setAttribute('autocomplete', 'off');
        }
        
        // Dodaj novalidate za custom validaciju
        form.setAttribute('novalidate', '');
    });
}

// Funkcija za postavljanje security atributa na input polja
function setSecurityInputAttributes() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        // Dodaj autocomplete="off" za osetljiva polja
        if (input.type === 'password' || input.name === 'adminEmail') {
            input.setAttribute('autocomplete', 'off');
        }
        
        // Dodaj spellcheck="false" za osetljiva polja
        if (input.type === 'password' || input.name === 'adminEmail') {
            input.setAttribute('spellcheck', 'false');
        }
    });
}

// Funkcija za postavljanje security atributa na linkove
function setSecurityLinkAttributes() {
    const links = document.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
        // Dodaj rel="noopener noreferrer" za eksterne linkove
        if (!link.hostname.includes(window.location.hostname)) {
            link.setAttribute('rel', 'noopener noreferrer');
            link.setAttribute('target', '_blank');
        }
    });
}

// Funkcija za postavljanje security atributa na script tagove
function setSecurityScriptAttributes() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        // Dodaj integrity i crossorigin za eksterne skripte
        if (script.src.includes('unpkg.com') || script.src.includes('cdn.')) {
            script.setAttribute('crossorigin', 'anonymous');
        }
    });
}

// Funkcija za postavljanje security atributa na iframe-ove
function setSecurityIframeAttributes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        // Dodaj sandbox atribut
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    });
}

// Funkcija za postavljanje security atributa na img tagove
function setSecurityImageAttributes() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Dodaj loading="lazy" za performanse
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Dodaj decoding="async" za performanse
        if (!img.hasAttribute('decoding')) {
            img.setAttribute('decoding', 'async');
        }
    });
}

// Funkcija za postavljanje security atributa na video tagove
function setSecurityVideoAttributes() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        // Dodaj preload="metadata" za performanse
        if (!video.hasAttribute('preload')) {
            video.setAttribute('preload', 'metadata');
        }
    });
}

// Funkcija za postavljanje security atributa na audio tagove
function setSecurityAudioAttributes() {
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
        // Dodaj preload="metadata" za performanse
        if (!audio.hasAttribute('preload')) {
            audio.setAttribute('preload', 'metadata');
        }
    });
}

// Glavna funkcija za inicijalizaciju security header-a
function initializeSecurityHeaders() {
    // Postavi meta tagove
    setSecurityMetaTags();
    
    // Postavi atribute na forme
    setSecurityFormAttributes();
    
    // Postavi atribute na input polja
    setSecurityInputAttributes();
    
    // Postavi atribute na linkove
    setSecurityLinkAttributes();
    
    // Postavi atribute na script tagove
    setSecurityScriptAttributes();
    
    // Postavi atribute na iframe-ove
    setSecurityIframeAttributes();
    
    // Postavi atribute na slike
    setSecurityImageAttributes();
    
    // Postavi atribute na video
    setSecurityVideoAttributes();
    
    // Postavi atribute na audio
    setSecurityAudioAttributes();
}

// Funkcija za postavljanje security cookie atributa
function setSecurityCookieAttributes() {
    // Postavi secure, httpOnly, sameSite za cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            // Ažuriraj cookie sa security atributima
            document.cookie = `${name}=${value}; Secure; HttpOnly; SameSite=Strict; Path=/`;
        }
    });
}

// Funkcija za postavljanje security localStorage atributa
function setSecurityLocalStorageAttributes() {
    // Proveri da li je localStorage dostupan
    if (typeof Storage !== 'undefined') {
        // Postavi timeout za localStorage podatke
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('temp_') || key.startsWith('cache_')) {
                // Ukloni stare podatke
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Ukloni nevalidne podatke
                        localStorage.removeItem(key);
                    }
                }
            }
        });
    }
}

// Export funkcija
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setSecurityMetaTags,
        setSecurityFormAttributes,
        setSecurityInputAttributes,
        setSecurityLinkAttributes,
        setSecurityScriptAttributes,
        setSecurityIframeAttributes,
        setSecurityImageAttributes,
        setSecurityVideoAttributes,
        setSecurityAudioAttributes,
        initializeSecurityHeaders,
        setSecurityCookieAttributes,
        setSecurityLocalStorageAttributes
    };
} else if (typeof window !== 'undefined') {
    window.SecurityHeaders = {
        setSecurityMetaTags,
        setSecurityFormAttributes,
        setSecurityInputAttributes,
        setSecurityLinkAttributes,
        setSecurityScriptAttributes,
        setSecurityIframeAttributes,
        setSecurityImageAttributes,
        setSecurityVideoAttributes,
        setSecurityAudioAttributes,
        initializeSecurityHeaders,
        setSecurityCookieAttributes,
        setSecurityLocalStorageAttributes
    };
}
