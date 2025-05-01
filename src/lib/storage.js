// src/lib/storage.js
import { showToast } from './toast.js'; // For user feedback
// Import refresh function from the store file
import { refreshMealsStore } from './mealStore.js';
import { meals as defaultMeals } from './meals.js'; // Import default meal data
import { get } from 'svelte/store';
import { calendarData, saveCalendarData } from './calendar.js';
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem';

// --- LocalStorage Keys ---
const ALL_BAON_KEY = "baonAllEntries";       // Unified key for all meals
const FAVORITES_KEY = "baonFavorites";       // Key for favorite meal IDs/names
const SEEN_KEY = "seenMeals";                // Key for seen meal names
const ONBOARDING_KEY = 'baonBuddyOnboardingStatus'; // Onboarding status
const MUSIC_KEY = 'musicEnabled';            // Music preference
const LAST_SCREEN_KEY = 'lastScreen';          // Last visited screen

// --- Simple In-Memory Cache ---
let allMealsCache = null;

// --- Meal Data Initialization ---
export function initializeDefaultMealsIfEmpty() {
    try {
        if (localStorage.getItem(ALL_BAON_KEY) === null) {
            console.log("No meals found in storage. Initializing defaults...");
            const initialMeals = defaultMeals.map((meal, index) => ({
                ...meal,
                id: `default_${meal.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${index}`,
                isUserDefined: false
            }));
            localStorage.setItem(ALL_BAON_KEY, JSON.stringify(initialMeals));
            allMealsCache = initialMeals;
            refreshMealsStore(); // Trigger store refresh after initialization
        }
    } catch (e) {
        console.error("Error initializing default meals:", e);
    }
}

// --- Meal CRUD Operations ---
export const getAllMeals = () => {
     if (allMealsCache !== null) {
        return allMealsCache;
     }
    try {
        const stored = localStorage.getItem(ALL_BAON_KEY);
        const meals = stored ? JSON.parse(stored) : [];
        allMealsCache = meals;
        return meals;
    } catch (e) {
        console.error("Error reading all meals:", e);
        allMealsCache = [];
        return [];
    }
};

const saveAllMeals = (mealsArray) => {
    try {
        const mealsToSave = mealsArray || [];
        localStorage.setItem(ALL_BAON_KEY, JSON.stringify(mealsToSave));
        allMealsCache = mealsToSave;
        refreshMealsStore(); // Notify the reactive store
    } catch (e) {
        console.error("Error saving all meals:", e);
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

export const deleteMeal = async (mealId) => { 
    if (!mealId) return false;
    let currentMeals = getAllMeals();
    const mealIndex = currentMeals.findIndex(m => m.id === mealId); // Find index too
    const mealToDelete = mealIndex !== -1 ? currentMeals[mealIndex] : null;

    if (!mealToDelete) {
        console.warn(`Meal ID ${mealId} not found for deletion.`);
        return false;
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

// --- General Reset ---
export function resetStorage() {
    console.log("Resetting application storage...");
    localStorage.removeItem(ALL_BAON_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(MUSIC_KEY);
    localStorage.removeItem(LAST_SCREEN_KEY);
    localStorage.removeItem('counter_baonAppOpens');
    localStorage.removeItem('counter_baonMealGenerations');
    // Add any other keys used by your app here
    allMealsCache = null;
    initializeDefaultMealsIfEmpty();
    refreshMealsStore();
    console.log("Application storage reset, defaults re-initialized.");
}