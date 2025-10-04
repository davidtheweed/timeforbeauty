// ========================================
// CONSOLE DEBUG SCRIPT
// ========================================

console.log('🔧 Console Debug Script Loaded');

// Override console methods to capture logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const logs = [];
const errors = [];
const warnings = [];

console.log = function(...args) {
    logs.push({
        type: 'log',
        message: args.join(' '),
        timestamp: new Date().toISOString()
    });
    originalLog.apply(console, args);
};

console.error = function(...args) {
    errors.push({
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
    });
    originalError.apply(console, args);
};

console.warn = function(...args) {
    warnings.push({
        type: 'warn',
        message: args.join(' '),
        timestamp: new Date().toISOString()
    });
    originalWarn.apply(console, args);
};

// Function to get debug info
window.getDebugInfo = function() {
    return {
        logs: logs.slice(-20), // Last 20 logs
        errors: errors.slice(-10), // Last 10 errors
        warnings: warnings.slice(-10), // Last 10 warnings
        elements: {
            addTaskBtn: !!document.getElementById('addTaskBtn'),
            registerUserBtn: !!document.getElementById('registerUserBtn'),
            showCalendarBtn1: !!document.getElementById('showCalendarBtn1'),
            showCalendarBtn2: !!document.getElementById('showCalendarBtn2'),
            adminPlanner: !!document.getElementById('adminPlanner')
        },
        planner: {
            exists: !!window.planner,
            type: typeof window.planner,
            methods: window.planner ? Object.getOwnPropertyNames(Object.getPrototypeOf(window.planner)) : []
        }
    };
};

// Function to test button clicks
window.testButtons = function() {
    const buttons = {
        addTaskBtn: document.getElementById('addTaskBtn'),
        registerUserBtn: document.getElementById('registerUserBtn'),
        showCalendarBtn1: document.getElementById('showCalendarBtn1'),
        showCalendarBtn2: document.getElementById('showCalendarBtn2')
    };
    
    const results = {};
    
    for (const [name, element] of Object.entries(buttons)) {
        if (element) {
            try {
                console.log(`Testing ${name}...`);
                element.click();
                results[name] = 'Success';
            } catch (error) {
                console.error(`Error clicking ${name}:`, error);
                results[name] = `Error: ${error.message}`;
            }
        } else {
            console.warn(`${name} not found`);
            results[name] = 'Not found';
        }
    }
    
    return results;
};

// Auto-run debug when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM Content Loaded - Starting Debug');
    
    setTimeout(() => {
        console.log('🔧 Debug Info:', window.getDebugInfo());
        console.log('🔧 Button Test Results:', window.testButtons());
    }, 3000);
});

console.log('🔧 Console Debug Script Ready');
