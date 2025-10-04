// ========================================
// SERVER-SIDE VALIDACIJA
// ========================================

// Validacija email adrese
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validacija telefona
function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
    return phoneRegex.test(phone);
}

// Validacija imena
function validateName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && trimmedName.length <= 50;
}

// Validacija datuma
function validateDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date instanceof Date && !isNaN(date) && date >= today;
}

// Validacija vremena
function validateTime(timeString) {
    if (!timeString) return false;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

// Validacija usluge
function validateService(service) {
    const validServices = [
        'konsultacija', 'pregled', 'terapija', 'masaža', 'drugo',
        // NOKTI
        'manikir', 'lakiranje', 'urasli_nokat', 'izlivanje_m', 'izlivanje_l', 'izlivanje_xl',
        'ojacavanje_s', 'ojacavanje_m', 'ojacavanje_l', 'gel_lak_m', 'gel_lak_l',
        'korekcija_s', 'korekcija_m', 'korekcija_l', 'korekcija_xl', 'badem_korekcija',
        'skidanje_gela', 'saranje_dva_nokta', 'medicinski_pedikir', 'protetika_noznog_nokta',
        'pedikir', 'kopca_noznog_nokta', 'izlivanje_jednog_nokta',
        // TRETMANI LICA
        'higijenski_tretman', 'mezoterapija_lica', 'masaza_lica', 'kraljevski_tretman',
        'parafin', 'solarijum', 'korektivna_sminka', 'sminka',
        // DEPILACIJA
        'depilacija_prepona', 'depilacija_pola_nogu', 'depilacija_intime', 'depilacija_celih_nogu',
        'depilacija_dugih_nogu', 'depilacija_ruku', 'depilacija_pazuha', 'depilacija_stomaka',
        'nausnice', 'obrve_depilacija',
        // MASAŽE
        'relax_masaza', 'anticelulit_masaza',
        // OBRVE
        'puder_obrve', 'japanske_obrve', 'korekcija_puder_obrve', 'osvezavanje_japanskih_obrva',
        // ADMIN OBAVEZE
        'obaveza'
    ];
    return validServices.includes(service);
}

// Validacija radnika
function validateWorker(worker) {
    const validWorkers = ['radnik1', 'radnik2'];
    return validWorkers.includes(worker);
}

// Validacija trajanja
function validateDuration(duration) {
    const validDurations = ['15', '30', '45', '60', '90', '120', '180'];
    return validDurations.includes(duration.toString());
}

// Validacija napomene
function validateNotes(notes) {
    if (!notes) return true; // Opciono polje
    return typeof notes === 'string' && notes.length <= 500;
}

// Glavna validaciona funkcija za appointment
function validateAppointmentData(data) {
    const errors = [];

    // Validacija imena
    if (!validateName(data.firstName)) {
        errors.push('Ime mora biti između 2 i 50 karaktera');
    }

    // Validacija telefona
    if (!validatePhone(data.phone)) {
        errors.push('Telefon mora biti u validnom formatu');
    }

    // Validacija email-a
    if (!validateEmail(data.email)) {
        errors.push('Email mora biti u validnom formatu');
    }

    // Validacija usluge
    if (!validateService(data.service)) {
        errors.push('Usluga nije validna');
    }

    // Validacija radnika
    if (!validateWorker(data.worker)) {
        errors.push('Radnik nije validan');
    }

    // Validacija datuma
    if (!validateDate(data.date)) {
        errors.push('Datum mora biti u budućnosti');
    }

    // Validacija vremena
    if (!validateTime(data.time)) {
        errors.push('Vreme mora biti u validnom formatu');
    }

    // Validacija napomene
    if (!validateNotes(data.notes)) {
        errors.push('Napomena ne sme biti duža od 500 karaktera');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Validacija admin obaveze
function validateTaskData(data) {
    const errors = [];

    // Validacija radnika
    if (!validateWorker(data.worker)) {
        errors.push('Radnik nije validan');
    }

    // Validacija trajanja
    if (!validateDuration(data.duration)) {
        errors.push('Trajanje nije validno');
    }

    // Validacija datuma
    if (!validateDate(data.date)) {
        errors.push('Datum mora biti u budućnosti');
    }

    // Validacija vremena
    if (!validateTime(data.time)) {
        errors.push('Vreme mora biti u validnom formatu');
    }

    // Validacija opisa
    if (!validateNotes(data.description)) {
        errors.push('Opis ne sme biti duži od 500 karaktera');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Validacija registracije korisnika
function validateRegistrationData(data) {
    const errors = [];

    // Validacija imena
    if (!validateName(data.firstName)) {
        errors.push('Ime mora biti između 2 i 50 karaktera');
    }

    if (!validateName(data.lastName)) {
        errors.push('Prezime mora biti između 2 i 50 karaktera');
    }

    // Validacija email-a
    if (!validateEmail(data.email)) {
        errors.push('Email mora biti u validnom formatu');
    }

    // Validacija telefona
    if (!validatePhone(data.phone)) {
        errors.push('Telefon mora biti u validnom formatu');
    }

    // Validacija šifre
    if (!data.password || data.password.length < 6) {
        errors.push('Šifra mora imati najmanje 6 karaktera');
    }

    if (data.password !== data.confirmPassword) {
        errors.push('Šifre se ne poklapaju');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Export funkcija
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validatePhone,
        validateName,
        validateDate,
        validateTime,
        validateService,
        validateWorker,
        validateDuration,
        validateNotes,
        validateAppointmentData,
        validateTaskData,
        validateRegistrationData
    };
} else if (typeof window !== 'undefined') {
    window.Validation = {
        validateEmail,
        validatePhone,
        validateName,
        validateDate,
        validateTime,
        validateService,
        validateWorker,
        validateDuration,
        validateNotes,
        validateAppointmentData,
        validateTaskData,
        validateRegistrationData
    };
}
