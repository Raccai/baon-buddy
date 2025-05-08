// --- LocalStorage Keys ---
const STREAK_DATA_KEY = "baonDailyActionStreak";
const ALL_BAON_KEY = "baonAllEntries";       // Unified key for all meals
const FAVORITES_KEY = "baonFavorites";       // Key for favorite meal IDs/names
const SEEN_KEY = "seenMeals";                // Key for seen meal names
const ONBOARDING_KEY = 'baonBuddyOnboardingStatus'; // Onboarding status
const MUSIC_KEY = 'musicEnabled';            // Music preference
const LAST_SCREEN_KEY = 'lastScreen';          // Last visited screen
const DELETED_DEFAULT_MEAL_IDS_KEY = "baonDeletedDefaultMealIds";

import { showToast } from './toast.js'; // For user feedback
// Import refresh function from the store file
import { refreshMealsStore } from './mealStore.js';
import { meals as defaultMeals } from './meals.js'; // Import default meal data
import { get } from 'svelte/store';
import { calendarData, saveCalendarData, CALENDAR_STORAGE_KEY } from './calendar.js';
import { refreshStreakStore, streakStore } from './streakStore.js';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isSameDay, subDays, formatISO, parseISO, differenceInCalendarDays } from 'date-fns';
import { checkAndUnlockAchievements } from './achievementStore.js';
import { resetAchievements } from './achievementStore.js';

// --- Simple In-Memory Cache ---
let allMealsCache = null;

let _refreshMealsStore;
let _refreshStreakStore;
// Only import in browser environment if needed immediately, otherwise import within functions
if (typeof window !== 'undefined') {
    import('./mealStore.js')
        .then(mod => _refreshMealsStore = mod.refreshMealsStore)
        .catch(e => console.error("Failed to load mealStore refresh", e));
    import('./streakStore.js')
        .then(mod => _refreshStreakStore = mod.refreshStreakStore)
        .catch(e => console.error("Failed to load streakStore refresh", e));
}

// --- Meal Data Initialization ---
export function initializeDefaultMealsIfEmpty() {
    try {
        if (localStorage.getItem(ALL_BAON_KEY) === null) { // Only if COMPLETELY empty
            console.log("[storage] No meals found in storage. Running forceUpdateDefaultMeals to initialize ALL defaults...");
            forceUpdateDefaultMeals(); // This will handle adding all current defaults
        } else {
            if (allMealsCache === null) {
                getAllMeals();
            }
        }
    } catch (e) {
        console.error("[storage] Error initializing default meals:", e);
    }
}

// --- Meal CRUD Operations ---
export const getAllMeals = () => {
     if (allMealsCache !== null) {
        return [...allMealsCache];
     }
    try {
        const stored = localStorage.getItem(ALL_BAON_KEY);
        const meals = stored ? JSON.parse(stored) : [];
        allMealsCache = meals;
        return [...allMealsCache];
    } catch (e) {
        console.error("[storage] Error reading all meals:", e);
        allMealsCache = [];
        return [];
    }
};

const saveAllMeals = (mealsArray) => {
    try {
        localStorage.setItem(ALL_BAON_KEY, JSON.stringify(mealsArray || []));
        allMealsCache = [...(mealsArray || [])];
        if (typeof _refreshMealsStore === 'function') {
            _refreshMealsStore();
        } else { console.warn("Meal store refresh function not yet loaded."); }
    } catch (e) {
        console.error("[storage] Error saving all meals:", e);
    }
};

export const addMeal = (newMealData) => {
    console.log("storage.js addMeal received:", JSON.stringify(newMealData, null, 2));
     if (!newMealData || !newMealData.name || !newMealData.name.trim()) {
        showToast("Baon name cannot be empty!", "error");
        return false;
     }
    const currentMeals = getAllMeals();
    const nameExists = currentMeals.some(m => m.name.trim().toLowerCase() === newMealData.name.trim().toLowerCase());

    if (nameExists) {
        showToast("A Baon with this name already exists!", "error");
        return false;
    }
    const newMealWithId = {
        name: newMealData.name.trim(),
        type: newMealData.type || 'custom',
        message: newMealData.message || '',
        emoji: newMealData.emoji || '🍽️',
        image: newMealData.image || null,
        recipe: newMealData.recipe || { ingredients: [], steps: [], talaTip: null },
        id: `user_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        isUserDefined: true
    };
    saveAllMeals([...currentMeals, newMealWithId]);
    showToast(`"${newMealWithId.name}" added!`, "success");
    return true;
};

export const updateMeal = (updatedMeal) => {
    console.log("storage.js updateMeal received:", JSON.stringify(updatedMeal, null, 2));
    if (!updatedMeal || !updatedMeal.id) {
        showToast("Error updating Baon: Invalid data provided.", "error");
        console.error("updateMeal called with invalid data:", updatedMeal);
        return false;
    }
    if (!updatedMeal.name || !updatedMeal.name.trim()) {
        showToast("Baon name cannot be empty!", "error");
        return false;
    }

    const currentMeals = getAllMeals();
    const index = currentMeals.findIndex(m => m.id === updatedMeal.id);
    console.log(`Found index for ID ${updatedMeal.id}: ${index}`); 
    if (index !== -1) {
        const nameConflict = currentMeals.some(m =>
            m.id !== updatedMeal.id &&
            m.name.trim().toLowerCase() === updatedMeal.name.trim().toLowerCase()
        );
        if (nameConflict) {
            showToast("Another Baon already has this name!", "error");
            return false;
        }

        const mealToUpdate = {
            ...currentMeals[index],
            ...updatedMeal,
            name: updatedMeal.name.trim(),
            recipe: updatedMeal.recipe && typeof updatedMeal.recipe === 'object'
                ? {
                    ingredients: Array.isArray(updatedMeal.recipe.ingredients) ? updatedMeal.recipe.ingredients : [],
                    steps: Array.isArray(updatedMeal.recipe.steps) ? updatedMeal.recipe.steps : [],
                    talaTip: updatedMeal.recipe.talaTip || null
                    }
                : { ingredients: [], steps: [], talaTip: null },
            isUserDefined: currentMeals[index].isUserDefined
        };

        currentMeals[index] = mealToUpdate;
        saveAllMeals(currentMeals);
        showToast(`"${mealToUpdate.name}" updated!`, "success");
        return true;
    } else {
        showToast("Could not find Baon to update.", "error");
        console.warn(`Meal with ID ${updatedMeal.id} not found for update.`);
        return false;
    }
};

// --- Function to get the list of deleted default meal IDs ---
export const getDeletedDefaultMealIds = () => {
    try {
        const stored = localStorage.getItem(DELETED_DEFAULT_MEAL_IDS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading deleted default meal IDs:", e);
        return [];
    }
};

// --- Function to add an ID to the deleted list ---
const addDeletedDefaultMealId = (mealId) => {
    if (!mealId) return;
    try {
        const currentDeleted = getDeletedDefaultMealIds();
        if (!currentDeleted.includes(mealId)) {
            localStorage.setItem(DELETED_DEFAULT_MEAL_IDS_KEY, JSON.stringify([...currentDeleted, mealId]));
        }
    } catch (e) {
        console.error("Error saving deleted default meal ID:", e);
    }
};

export const deleteMeal = async (mealId) => { 
    if (!mealId) return false;
    let currentMeals = getAllMeals();
    // const mealIndex = currentMeals.findIndex(m => m.id === mealId);
    const mealToDelete = currentMeals.find(m => m.id === mealId);

    // --- If it was a default meal, record its deletion ---
    if (mealToDelete.isUserDefined === false) { // Or check if ID starts with 'default_'
        addDeletedDefaultMealId(mealToDelete.id);
        console.log(`Default meal ${mealToDelete.name} (ID: ${mealToDelete.id}) marked as deleted by user.`);
    }

    const updatedMeals = currentMeals.filter(m => m.id !== mealId);

    if (updatedMeals.length < currentMeals.length) {
        // Try deleting image file BEFORE updating localStorage list
        if (mealToDelete.image && mealToDelete.image.startsWith('capacitor://')) { // Check if it's a capacitor file URI
            try {
                const filename = mealToDelete.image.substring(mealToDelete.image.lastIndexOf('/') + 1);
                if (filename) {
                    console.log(`Attempting to delete image file: ${filename}`);
                    await Filesystem.deleteFile({
                        path: filename,
                        directory: Directory.Data
                    });
                    console.log(`Deleted image file ${filename}`);
                }
            } catch (deleteError) {
                console.warn(`Could not delete image file ${mealToDelete.image}:`, deleteError);
                // Don't block meal deletion if image deletion fails
            }
        }

        // Save the updated meal list
        saveAllMeals(updatedMeals);

        try {
            let currentCalendar = get(calendarData); // Get current calendar object { 'YYYY-MM-DD': [meal1, meal2] }
            let calendarWasModified = false;

            // Iterate over each date in the calendar
            for (const dateKey in currentCalendar) {
                const originalDayMeals = currentCalendar[dateKey];
                // Filter out the deleted meal from this day's list
                // IMPORTANT: Assumes meals in calendarData have IDs matching the main list
                const updatedDayMeals = originalDayMeals.filter(m => m.id !== mealId);

                // If the list for this day changed, update it
                if (updatedDayMeals.length < originalDayMeals.length) {
                    if (updatedDayMeals.length > 0) {
                        currentCalendar[dateKey] = updatedDayMeals; // Update day with remaining meals
                    } else {
                        delete currentCalendar[dateKey]; // Remove date key if no meals left
                    }
                    calendarWasModified = true;
                }
            }

            // 4. If the calendar was changed, save it and update the store
            if (calendarWasModified) {
                console.log("Removing deleted meal from calendar entries.");
                saveCalendarData(currentCalendar); // Persist changes (assuming this updates the store too)
            }

        } catch (e) {
            console.error("Error removing deleted meal from calendar data:", e);
            // Proceed with deletion from main list anyway
        }

        // Remove from favorites
        removeFavorite(mealToDelete.name); // Assuming name is still the key here

        showToast(`"${mealToDelete.name}" deleted.`, "info");
        return true;
    }
    return false;
};

// --- Favorites ---
export const getFavorites = () => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { console.error("Error reading favorites:", e); return []; }
};

export const saveFavorite = (meal) => {
    if (!meal || !meal.name) return;
    const current = getFavorites();
    const exists = current.some(fave => fave.name === meal.name);
    if (!exists) {
        const mealToSave = { ...meal };
        const updated = [...current, mealToSave];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
};

export const removeFavorite = (mealName) => {
    if (!mealName) return;
    const current = getFavorites();
    const updated = current.filter(fave => fave.name !== mealName);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
};

export function clearFavorites() {
    localStorage.removeItem(FAVORITES_KEY);
    console.log("Favorites cleared.");
}

// --- Seen Meals ---
export function getSeenMeals() { // Corrected spelling
    try {
        const stored = localStorage.getItem(SEEN_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error reading seen meals:", e);
        return [];
    }
}

export function markMealAsSeen(mealName) {
    if (!mealName) return;
    const current = getSeenMeals(); // Use corrected function name
    if (!current.includes(mealName)) {
        const updated = [...current, mealName];
        localStorage.setItem(SEEN_KEY, JSON.stringify(updated));
    }
}

export function clearSeenMeals() { // Corrected spelling
    localStorage.removeItem(SEEN_KEY);
    console.log("Seen meals cleared.");
}

// --- Counters ---
export function getCounter(key) {
    if (!key) return 0;
    try {
        const value = localStorage.getItem(`counter_${key}`);
        return value ? parseInt(value, 10) : 0;
    } catch (e) {
        console.error(`Error getting counter ${key}:`, e);
        return 0;
    }
}

export function incrementCounter(key) {
    if (!key) return;
    try {
        let currentValue = getCounter(key);
        currentValue++;
        localStorage.setItem(`counter_${key}`, currentValue.toString());
        console.log(`Counter ${key} incremented to ${currentValue}`);
        return currentValue;
    } catch (e) {
        console.error(`Error incrementing counter ${key}:`, e);
        return getCounter(key);
    }
}

// --- Refined forceUpdateDefaultMeals ---
export function forceUpdateDefaultMeals() {
    console.log("[storage] Forcing update of default meals based on meals.js...");

    const currentStoredMeals = getAllMeals(); // Get all meals currently in storage
    const userDefinedMeals = currentStoredMeals.filter(meal => meal.isUserDefined === true);
    const storedDefaultMeals = currentStoredMeals.filter(meal => meal.isUserDefined === false);
    const deletedDefaultIds = getDeletedDefaultMealIds();

    console.log("[storage] User defined meals in storage:", userDefinedMeals.length);
    console.log("[storage] Stored default meals in storage:", storedDefaultMeals.length);
    console.log("[storage] User-deleted default IDs:", deletedDefaultIds);

    const newOrUpdatedDefaults = [];

    defaultMeals.forEach((newDefaultMealData, index) => {
        const potentialId = newDefaultMealData.id || `default_${newDefaultMealData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${index}`;

        // 1. Skip if this default meal ID was previously deleted by the user
        if (deletedDefaultIds.includes(potentialId)) {
            console.log(`[storage] Skipping default meal "${newDefaultMealData.name}" (ID: ${potentialId}) as it was previously deleted by user.`);
            return; // Skip to next default meal
        }

        // 2. Check if this default meal (by ID) already exists in storage
        const existingStoredDefault = storedDefaultMeals.find(m => m.id === potentialId);

        const processedDefault = {
            ...newDefaultMealData, // Start with fresh data from meals.js
            id: potentialId,
            isUserDefined: false
        };

        if (existingStoredDefault) {
            // It's an existing default meal. Update it with data from meals.js.
            // You might want more sophisticated merging here if users could edit defaults
            // (but current setup implies defaults are static until a new app version).
            console.log(`[storage] Updating existing default meal "${processedDefault.name}" (ID: ${potentialId}).`);
            newOrUpdatedDefaults.push(processedDefault);
        } else {
            // It's a NEW default meal (not in storage, not deleted)
            console.log(`[storage] Adding NEW default meal "${processedDefault.name}" (ID: ${potentialId}).`);
            newOrUpdatedDefaults.push(processedDefault);
        }
    });

    // Combine the user's own meals with the new/updated list of defaults
    const finalMealList = [...userDefinedMeals, ...newOrUpdatedDefaults];

    // Final de-duplication by ID to be absolutely sure (e.g., if a user meal somehow got a default ID)
    const uniqueFinalMealList = Array.from(new Map(finalMealList.map(meal => [meal.id, meal])).values());

    console.log(`[storage] Saving ${uniqueFinalMealList.length} meals after force update.`);
    saveAllMeals(uniqueFinalMealList);

    showToast("Baon list updated with latest defaults!", "success");
    return true;
}

// --- Streak Data ---
export function getStreakData() {
    try {
        const stored = localStorage.getItem(STREAK_DATA_KEY);
        // Provide default values if parsing fails or data is missing
        const defaults = { lastActionDate: null, currentStreak: 0, longestStreak: 0 };
        if (!stored) return defaults;
        const parsed = JSON.parse(stored);
        // Return parsed data merged with defaults to ensure all keys exist
        return { ...defaults, ...parsed };
    } catch (e) {
        console.error("[storage] Error reading streak data:", e);
        return { lastActionDate: null, currentStreak: 0, longestStreak: 0 };
    }
}

function saveStreakData(data) {
    try {
        localStorage.setItem(STREAK_DATA_KEY, JSON.stringify(data));
        // Refresh the Svelte store after saving
        if (typeof refreshStreakStore === 'function') {
            _refreshStreakStore();
        } else {
            console.warn("[storage] refreshStreakStore function not available to update streak UI.");
        }
    } catch (e) {
        console.error("[storage] Error saving streak data:", e);
    }
}

export async function updateStreakOnAction() {
    // Dynamically import date-fns functions only when needed
    const { isSameDay, subDays, formatISO, parseISO, startOfDay } = await import('date-fns');

    const streakData = getStreakData();
    const today = startOfDay(new Date()); // Get start of today for consistent comparison
    const todayKey = formatISO(today, { representation: 'date' }); // 'YYYY-MM-DD'

    console.log(`[storage] updateStreakOnAction called. Today: ${todayKey}, Last Action: ${streakData.lastActionDate}, Current: ${streakData.currentStreak}`);

    if (!streakData.lastActionDate) {
        // First ever planning action recorded
        console.log("[storage] First planning action, starting streak.");
        streakData.currentStreak = 1;
    } else {
        const lastActionDay = startOfDay(parseISO(streakData.lastActionDate));
        const yesterday = subDays(today, 1);

        if (isSameDay(lastActionDay, yesterday)) {
            // Action occurred yesterday, continue streak
            console.log("[storage] Streak continued.");
            streakData.currentStreak++;
        } else if (!isSameDay(lastActionDay, today)) {
            // Last action was not yesterday OR today, streak broken. Start new streak.
            console.log("[storage] Streak broken, starting new streak.");
            streakData.currentStreak = 1;
        } else {
             // Action already recorded for today, do nothing to current streak
             console.log("[storage] Action already recorded for today, streak unchanged.");
        }
    }

    // Always update lastActionDate to today
    streakData.lastActionDate = todayKey;
    // Update longest streak if current is greater
    streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);

    console.log("[storage] Saving updated Streak Data:", streakData);
    saveStreakData(streakData);
    checkAndUnlockAchievements(); // Re-check achievements related to streaks
}

// --- General Reset ---
export function resetStorage() {
    console.log("Resetting application storage...");
    localStorage.removeItem(ALL_BAON_KEY);
    localStorage.removeItem(DELETED_DEFAULT_MEAL_IDS_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(MUSIC_KEY);
    localStorage.removeItem(LAST_SCREEN_KEY);
    localStorage.removeItem(STREAK_DATA_KEY);
    localStorage.removeItem(CALENDAR_STORAGE_KEY);
    localStorage.removeItem('counter_baonAppOpens');
    localStorage.removeItem('counter_baonMealGenerations');
    // Add any other keys used by your app here
    allMealsCache = null;
    initializeDefaultMealsIfEmpty();
    refreshMealsStore();
    resetAchievements();
    console.log("Application storage reset, defaults re-initialized.");
}