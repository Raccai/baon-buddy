// src/lib/mealStore.js
import { writable } from 'svelte/store';
// Import the storage function - it's safe to import the function definition
import { getAllMeals as getAllMealsFromStorage } from './storage.js';

// --- Create Writable Store - Initialize EMPTY ---
const allMealsStore = writable([]); // <<< Initialize EMPTY array
console.log("[mealStore] Store created empty.");

// --- Function to load initial/refreshed data ---
// This combines initialization and refresh logic
let storeInitialized = false;
function loadOrRefreshMeals() {
    try {
        if (!storeInitialized) {
            console.log("[mealStore] Attempting to load initial meal data...");
        } else {
            console.log("[mealStore] Refreshing meals store...");
        }
        // Fetch latest combined list from storage (getAllMeals already handles cache)
        const currentMeals = getAllMealsFromStorage();
        allMealsStore.set(currentMeals); // Update the store with actual data
        storeInitialized = true;
        if (!storeInitialized) console.log("[mealStore] Initial meal data loaded.");

    } catch (e) {
        console.error("[mealStore] Error loading/refreshing meals store:", e);
        allMealsStore.set([]); // Ensure it's empty on error
        storeInitialized = true; // Mark as initialized even on error to prevent loops
    }
}


// --- Exported REFRESH function (called by storage.js) ---
// This now just calls the combined load/refresh function
export function refreshMealsStore() {
    loadOrRefreshMeals();
}

// --- REMOVE initializeMealsStore function ---
// export function initializeMealsStore() { ... }

// --- Export the main store ---
export { allMealsStore as allMeals };

// --- Trigger initial load slightly after module evaluation ---
if (typeof window !== 'undefined') {
    setTimeout(loadOrRefreshMeals, 0); // Schedule loading for the next tick
}