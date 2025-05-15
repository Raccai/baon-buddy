// --- For notifications ---
const REMINDER_DAY_BEFORE_ENABLED_KEY = 'reminderDayBeforeEnabled';
const REMINDER_DAY_BEFORE_TIME_KEY = 'reminderDayBeforeTime'; // Store as "HH:mm" string e.g., "20:00"
const REMINDER_DAY_OF_ENABLED_KEY = 'reminderDayOfEnabled';
const REMINDER_DAY_OF_TIME_KEY = 'reminderDayOfTime';     // e.g., "08:00"

export function getNotificationSettings() {
    return {
        dayBeforeEnabled: localStorage.getItem(REMINDER_DAY_BEFORE_ENABLED_KEY) === 'true', // Default false if not set
        dayBeforeTime: localStorage.getItem(REMINDER_DAY_BEFORE_TIME_KEY) || '20:00', // Default 8 PM
        dayOfEnabled: localStorage.getItem(REMINDER_DAY_OF_ENABLED_KEY) === 'true',     // Default true
        dayOfTime: localStorage.getItem(REMINDER_DAY_OF_TIME_KEY) || '08:00',      // Default 8 AM
    };
}

export function saveNotificationSettings(settings) {
    localStorage.setItem(REMINDER_DAY_BEFORE_ENABLED_KEY, String(settings.dayBeforeEnabled));
    localStorage.setItem(REMINDER_DAY_BEFORE_TIME_KEY, settings.dayBeforeTime);
    localStorage.setItem(REMINDER_DAY_OF_ENABLED_KEY, String(settings.dayOfEnabled));
    localStorage.setItem(REMINDER_DAY_OF_TIME_KEY, settings.dayOfTime);
    console.log("[Settings] Notification settings saved:", settings);
    // Important: After saving settings, re-schedule notifications
    // Might dispatch an event here that App.svelte listens to,
    // or directly call a re-scheduling function if imported.
    // For simplicity, will assume App.svelte will handle re-scheduling.
}