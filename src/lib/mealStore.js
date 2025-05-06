import { writable } from 'svelte/store'; // No need for derived or get here
// Import the getter - it's safe to import, just don't call it immediately
import { getAllMeals as getAllMealsFromStorage } from './storage.js';
import { meals as defaultMealsFromFile } from './meals.js';

const allMealsStore = writable([]);

// --- Function to REFRESH the store ---
// Called by storage.js after changes AND by initializeMealsStore
export function refreshMealsStore() {
    console.log("Refreshing meals store...");
    try {
        // Fetch latest from storage and update the store using .set()
        allMealsStore.set(getAllMealsFromStorage());
    } catch (e) {
        console.error("Error refreshing meals store:", e);
        allMealsStore.set([]); // Set to empty on error
    }
}

// --- Function to initialize the store on app load ---
// Ensures store has data after initial module loads
export function initializeMealsStore() {
    console.log("Initializing meals store (called from App)...");
    // This call happens AFTER all modules are loaded, so it's safe
    refreshMealsStore();
}

// --- Export the main store ---
// Components will import this store directly
export { allMealsStore as allMeals };