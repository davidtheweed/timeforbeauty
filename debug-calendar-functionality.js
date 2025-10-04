// ========================================
// DEBUG CALENDAR FUNCTIONALITY
// ========================================

console.log('🔧 Calendar Debug Script Loaded');

// Function to test calendar modal functionality
window.testCalendarModal = function(workerNumber) {
    console.log(`🔧 Testing Calendar Modal ${workerNumber}`);
    
    // Check if modal element exists
    const modalId = `calendarModal${workerNumber}`;
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.error(`❌ Modal ${modalId} not found`);
        return { success: false, error: `Modal ${modalId} not found` };
    }
    
    console.log(`✅ Modal ${modalId} found:`, modal);
    
    // Check current display style
    const currentDisplay = modal.style.display;
    console.log(`📊 Current display style: ${currentDisplay}`);
    
    // Try to show modal
    try {
        modal.style.display = 'block';
        console.log(`✅ Modal ${workerNumber} displayed successfully`);
        
        // Check if modal is actually visible
        const computedStyle = window.getComputedStyle(modal);
        const isVisible = computedStyle.display !== 'none';
        console.log(`👁️ Modal ${workerNumber} visible: ${isVisible}`);
        
        return {
            success: true,
            modalId,
            wasHidden: currentDisplay === 'none' || currentDisplay === '',
            isNowVisible: isVisible,
            computedDisplay: computedStyle.display
        };
    } catch (error) {
        console.error(`❌ Error showing modal ${workerNumber}:`, error);
        return { success: false, error: error.message };
    }
};

// Function to test calendar buttons
window.testCalendarButtons = function() {
    console.log('🔧 Testing Calendar Buttons');
    
    const buttons = {
        showCalendarBtn1: document.getElementById('showCalendarBtn1'),
        showCalendarBtn2: document.getElementById('showCalendarBtn2')
    };
    
    const results = {};
    
    for (const [buttonId, button] of Object.entries(buttons)) {
        if (button) {
            console.log(`✅ ${buttonId} found:`, button);
            
            try {
                // Simulate click
                button.click();
                console.log(`✅ ${buttonId} clicked successfully`);
                results[buttonId] = 'Click successful';
            } catch (error) {
                console.error(`❌ Error clicking ${buttonId}:`, error);
                results[buttonId] = `Click error: ${error.message}`;
            }
        } else {
            console.error(`❌ ${buttonId} not found`);
            results[buttonId] = 'Button not found';
        }
    }
    
    return results;
};

// Function to test planner object
window.testPlannerObject = function() {
    console.log('🔧 Testing Planner Object');
    
    if (!window.planner) {
        console.error('❌ Planner object not found');
        return { success: false, error: 'Planner object not found' };
    }
    
    console.log('✅ Planner object found:', window.planner);
    
    // Test showCalendarModal method
    if (typeof window.planner.showCalendarModal === 'function') {
        console.log('✅ showCalendarModal method exists');
        
        try {
            // Test with worker number 1
            window.planner.showCalendarModal(1);
            console.log('✅ showCalendarModal(1) called successfully');
            
            return {
                success: true,
                hasShowCalendarModal: true,
                methodCallSuccessful: true
            };
        } catch (error) {
            console.error('❌ Error calling showCalendarModal:', error);
            return {
                success: false,
                hasShowCalendarModal: true,
                methodCallError: error.message
            };
        }
    } else {
        console.error('❌ showCalendarModal method not found');
        return {
            success: false,
            error: 'showCalendarModal method not found',
            availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(window.planner))
        };
    }
};

// Function to run complete calendar test
window.runCalendarDebug = function() {
    console.log('🔧 Running Complete Calendar Debug');
    
    const adminPlanner = document.getElementById('adminPlanner');
    const isAdminPlannerVisible = adminPlanner && adminPlanner.style.display !== 'none';
    
    const results = {
        timestamp: new Date().toISOString(),
        adminPlanner: {
            exists: !!adminPlanner,
            isVisible: isAdminPlannerVisible,
            displayStyle: adminPlanner ? adminPlanner.style.display : null
        },
        elements: {
            calendarModal1: !!document.getElementById('calendarModal1'),
            calendarModal2: !!document.getElementById('calendarModal2'),
            showCalendarBtn1: !!document.getElementById('showCalendarBtn1'),
            showCalendarBtn2: !!document.getElementById('showCalendarBtn2')
        },
        planner: {
            exists: !!window.planner,
            hasShowCalendarModal: window.planner && typeof window.planner.showCalendarModal === 'function'
        }
    };
    
    // Test modal functionality
    results.modalTest1 = window.testCalendarModal(1);
    results.modalTest2 = window.testCalendarModal(2);
    
    // Test button functionality
    results.buttonTest = window.testCalendarButtons();
    
    // Test planner object
    results.plannerTest = window.testPlannerObject();
    
    console.log('🔧 Calendar Debug Results:', results);
    return results;
};

// Function to show admin planner and test buttons
window.showAdminPlannerAndTest = function() {
    console.log('🔧 Showing Admin Planner and Testing Buttons');
    
    const adminPlanner = document.getElementById('adminPlanner');
    if (!adminPlanner) {
        console.error('❌ Admin planner not found');
        return { success: false, error: 'Admin planner not found' };
    }
    
    // Show admin planner
    adminPlanner.style.display = 'block';
    console.log('✅ Admin planner displayed');
    
    // Wait a bit for DOM to update
    setTimeout(() => {
        console.log('🔧 Testing buttons after showing planner...');
        
        const results = {
            adminPlannerShown: true,
            buttons: {
                showCalendarBtn1: !!document.getElementById('showCalendarBtn1'),
                showCalendarBtn2: !!document.getElementById('showCalendarBtn2'),
                addTaskBtn: !!document.getElementById('addTaskBtn'),
                registerUserBtn: !!document.getElementById('registerUserBtn')
            }
        };
        
        console.log('🔧 Button test results:', results);
        
        // Test button clicks
        if (results.buttons.showCalendarBtn1) {
            try {
                document.getElementById('showCalendarBtn1').click();
                console.log('✅ showCalendarBtn1 clicked successfully');
            } catch (error) {
                console.error('❌ Error clicking showCalendarBtn1:', error);
            }
        }
        
        return results;
    }, 100);
    
    return { success: true, message: 'Admin planner shown, testing buttons...' };
};

// Auto-run debug when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM Content Loaded - Calendar Debug Ready');
    
    // Run debug after a delay to ensure everything is loaded
    setTimeout(() => {
        console.log('🔧 Running auto calendar debug...');
        window.runCalendarDebug();
    }, 3000);
});

console.log('🔧 Calendar Debug Script Ready - Use runCalendarDebug() to test');
