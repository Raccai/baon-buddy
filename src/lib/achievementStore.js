import { writable } from 'svelte/store';
import { achievements as achievementDefs } from './achievementsData.js'; // Import definitions
import { getCounter, getFavorites } from './storage.js'; // Import needed getters
import { calendarData } from './calendar.js'; // Import calendar store
import { showToast } from './toast.js'; // For notifications
import { get } from 'svelte/store';

const UNLOCKED_KEY = 'baonUnlockedAchievements';

// Function to get the list of unlocked achievement IDs
export function getUnlockedAchievements() {
    try {
        const stored = localStorage.getItem(UNLOCKED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error getting unlocked achievements:", e);
        return [];
    }
}

// Store for reactive updates (optional, but good for UI)
export const unlockedAchievements = writable(getUnlockedAchievements());

// Function to save the unlocked list
function saveUnlockedAchievements(unlockedIds) {
    try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlockedIds));
        unlockedAchievements.set(unlockedIds); // Update the store
    } catch (e) {
        console.error("Error saving unlocked achievements:", e);
    }
}

// The core function to check and unlock achievements
// Call this *after* actions that might trigger an achievement
export function checkAndUnlockAchievements() {
    const currentlyUnlocked = getUnlockedAchievements();
    const newlyUnlocked = [];

    // Get current data needed for checks
    const faveList = getFavorites();
    const calData = get(calendarData); // Get current value from store

    achievementDefs.forEach(achievement => {
        // Skip if already unlocked
        if (currentlyUnlocked.includes(achievement.id)) {
            return;
        }

        let isMet = false;
        try {
            // Check criteria based on type
            switch (achievement.type) {
                case 'counter':
                    isMet = getCounter(achievement.key) >= achievement.threshold;
                    break;
                case 'list_length':
                    if (achievement.getList) {
                       isMet = achievement.getList().length >= achievement.threshold;
                    }
                    break;
                 case 'list_contains':
                    if (achievement.getList && achievement.check) {
                        isMet = achievement.check(achievement.getList(), achievement.value);
                    }
                    break;
                case 'calendar_check':
                     if (achievement.check) {
                        isMet = achievement.check(); // Assumes check function uses imported store directly
                     }
                    break;
                // Add more cases for other achievement types
            }
        } catch (e) {
            console.error(`Error checking achievement "${achievement.id}":`, e);
        }


        if (isMet) {
            console.log(`Achievement Unlocked: ${achievement.name}`);
            newlyUnlocked.push(achievement.id);
            // Show notification toast
            showToast(`Achievement Unlocked: ${achievement.name}`, 'achievement', 4000); // Use a new 'achievement' type
        }
    });

    // If any new achievements were unlocked, update storage and the store
    if (newlyUnlocked.length > 0) {
        saveUnlockedAchievements([...currentlyUnlocked, ...newlyUnlocked]);
    }
}

// Optional: Reset function for testing
export function resetAchievements() {
    saveUnlockedAchievements([]);
    console.log("Unlocked achievements reset.");
}