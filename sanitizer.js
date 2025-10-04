// ========================================
// INPUT SANITIZATION
// ========================================

// Ukloni HTML tagove
function stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '');
}

// Escape HTML karaktere
function escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Ukloni potencijalno opasne karaktere
function sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';
    
    // Ukloni HTML tagove
    let sanitized = stripHtml(input);
    
    // Ukloni potencijalno opasne karaktere
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

// Sanitizuj email
function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    
    // Ukloni whitespace i konvertuj u lowercase
    let sanitized = email.trim().toLowerCase();
    
    // Ukloni potencijalno opasne karaktere
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    return sanitized;
}

// Sanitizuj telefon
function sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    
    // Ukloni sve osim brojeva, +, -, (, ), i space
    let sanitized = phone.replace(/[^0-9+\-\(\)\s]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

// Sanitizuj ime
function sanitizeName(name) {
    if (!name || typeof name !== 'string') return '';
    
    // Ukloni HTML tagove i opasne karaktere
    let sanitized = stripHtml(name);
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Ograniči dužinu
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }
    
    return sanitized;
}

// Sanitizuj napomenu
function sanitizeNotes(notes) {
    if (!notes || typeof notes !== 'string') return '';
    
    // Ukloni HTML tagove
    let sanitized = stripHtml(notes);
    
    // Ukloni potencijalno opasne karaktere
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Ograniči dužinu
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 500);
    }
    
    return sanitized;
}

// Sanitizuj datum
function sanitizeDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return '';
    
    // Ukloni sve osim brojeva i -
    let sanitized = dateString.replace(/[^0-9\-]/g, '');
    
    // Proveri format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitized)) {
        return '';
    }
    
    return sanitized;
}

// Sanitizuj vreme
function sanitizeTime(timeString) {
    if (!timeString || typeof timeString !== 'string') return '';
    
    // Ukloni sve osim brojeva i :
    let sanitized = timeString.replace(/[^0-9:]/g, '');
    
    // Proveri format HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(sanitized)) {
        return '';
    }
    
    return sanitized;
}

// Sanitizuj uslugu
function sanitizeService(service) {
    if (!service || typeof service !== 'string') return '';
    
    // Ukloni HTML tagove i opasne karaktere
    let sanitized = stripHtml(service);
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

// Sanitizuj radnika
function sanitizeWorker(worker) {
    if (!worker || typeof worker !== 'string') return '';
    
    // Ukloni HTML tagove i opasne karaktere
    let sanitized = stripHtml(worker);
    sanitized = sanitized.replace(/[<>'"&]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

// Sanitizuj trajanje
function sanitizeDuration(duration) {
    if (!duration) return '';
    
    // Konvertuj u string ako nije
    let sanitized = String(duration);
    
    // Ukloni sve osim brojeva
    sanitized = sanitized.replace(/[^0-9]/g, '');
    
    return sanitized;
}

// Glavna sanitizaciona funkcija za appointment podatke
function sanitizeAppointmentData(data) {
    return {
        firstName: sanitizeName(data.firstName),
        phone: sanitizePhone(data.phone),
        email: sanitizeEmail(data.email),
        service: sanitizeService(data.service),
        worker: sanitizeWorker(data.worker),
        date: sanitizeDate(data.date),
        time: sanitizeTime(data.time),
        notes: sanitizeNotes(data.notes)
    };
}

// Sanitizuj admin obavezu
function sanitizeTaskData(data) {
    return {
        worker: sanitizeWorker(data.worker),
        duration: sanitizeDuration(data.duration),
        date: sanitizeDate(data.date),
        time: sanitizeTime(data.time),
        description: sanitizeNotes(data.description)
    };
}

// Sanitizuj registraciju korisnika
function sanitizeRegistrationData(data) {
    return {
        firstName: sanitizeName(data.firstName),
        lastName: sanitizeName(data.lastName),
        email: sanitizeEmail(data.email),
        phone: sanitizePhone(data.phone),
        password: data.password, // Password se ne sanitizuje
        confirmPassword: data.confirmPassword // Password se ne sanitizuje
    };
}

// Export funkcija
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        stripHtml,
        escapeHtml,
        sanitizeString,
        sanitizeEmail,
        sanitizePhone,
        sanitizeName,
        sanitizeNotes,
        sanitizeDate,
        sanitizeTime,
        sanitizeService,
        sanitizeWorker,
        sanitizeDuration,
        sanitizeAppointmentData,
        sanitizeTaskData,
        sanitizeRegistrationData
    };
} else if (typeof window !== 'undefined') {
    window.Sanitizer = {
        stripHtml,
        escapeHtml,
        sanitizeString,
        sanitizeEmail,
        sanitizePhone,
        sanitizeName,
        sanitizeNotes,
        sanitizeDate,
        sanitizeTime,
        sanitizeService,
        sanitizeWorker,
        sanitizeDuration,
        sanitizeAppointmentData,
        sanitizeTaskData,
        sanitizeRegistrationData
    };
}
