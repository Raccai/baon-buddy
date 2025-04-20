const STORAGE_KEY = 'baonBuddyOnboardingStatus';

// Define which screens require onboarding
const SCREENS_TO_ONBOARD = ['home', 'calendar', 'baonlist'];

// Function to get the current status object from localStorage
export function getOnboardingStatus() {
    try {
        const storedStatus = localStorage.getItem(STORAGE_KEY);
        if (storedStatus) {
            const parsed = JSON.parse(storedStatus);
            // Ensure all required screens exist in the loaded status
            const status = {};
            SCREENS_TO_ONBOARD.forEach(screen => {
                status[screen] = parsed[screen] === true; // Default to false if missing
            });
            return status;
        }
    } catch (e) {
        console.error("Error reading onboarding status:", e);
    }
    // Return default status if nothing stored or error occurs
    const defaultStatus = {};
    SCREENS_TO_ONBOARD.forEach(screen => {
        defaultStatus[screen] = false;
    });
    return defaultStatus;
}

// Function to mark a specific screen as having its onboarding completed
export function markScreenAsDone(screenName) {
    if (!SCREENS_TO_ONBOARD.includes(screenName)) {
        console.warn(`Tried to mark unknown screen "${screenName}" as done.`);
        return;
    }
    try {
        const currentStatus = getOnboardingStatus(); // Get current status
        currentStatus[screenName] = true; // Update the specific screen
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStatus)); // Save back
        console.log(`Onboarding status updated:`, currentStatus);
    } catch (e) {
        console.error("Error saving onboarding status:", e);
    }
}

// Function to check if a specific screen's onboarding is done
export function isScreenDone(screenName) {
    const status = getOnboardingStatus();
    return status[screenName] === true;
}

// Function to check if ALL required screens have been onboarded
export function isOverallOnboardingComplete() {
    const status = getOnboardingStatus();
    // Check if *every* screen defined in SCREENS_TO_ONBOARD is true
    return SCREENS_TO_ONBOARD.every(screen => status[screen] === true);
}

// Optional: Function to reset onboarding status (for testing)
export function resetOnboardingStatus() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("Onboarding status reset.");
    } catch (e) {
        console.error("Error resetting onboarding status:", e);
    }
}