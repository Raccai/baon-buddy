// src/lib/achievementsData.js
import { get as getStoreValue } from 'svelte/store'; // Use getStoreValue to avoid conflict
import { getCounter, getFavorites, getAllMeals } from './storage.js'; // getFavorites and getAllMeals are async
import { calendarData } from './calendar.js';
// You might need your $allMeals store here if checking names from IDs
// import { allMeals as allMealsStore } from './mealStore.js'; // Assuming this is your Svelte store for all meals

export const achievements = [
    {
        id: 'welcome', name: "Baon Buddy Initiate", description: "Opened the app for the first time.",
        icon: "👋", type: 'custom_check',
        check: () => getCounter('baonAppOpens') >= 1, // getCounter is synchronous
        secret: false,
    },
    {
        id: 'generate_1', name: "First Suggestion!", description: "Generated your first Baon suggestion.",
        icon: "✨", type: 'custom_check',
        check: () => getCounter('baonMealGenerations') >= 1, // getCounter is synchronous
        secret: false,
    },
    {
        id: 'first_fave', name: "Saved the Best!", description: "Favorited your first Baon.",
        icon: "💖", type: 'custom_check',
        check: async () => { // ASYNC
            const favoriteMealIds = await getFavorites(); // AWAIT
            return Array.isArray(favoriteMealIds) && favoriteMealIds.length >= 1;
        },
        secret: false,
    },
    {
        id: 'fave_5', name: "Top Picks", description: "Favorited 5 different Baon.",
        icon: "⭐", type: 'custom_check',
        check: async () => { // ASYNC
            const favoriteMealIds = await getFavorites(); // AWAIT
            return Array.isArray(favoriteMealIds) && favoriteMealIds.length >= 5;
        },
        secret: false,
    },
    {
        id: 'first_calendar', name: "Meal Planner", description: "Added your first Baon to the calendar.",
        icon: "📅", type: 'custom_check',
        check: () => Object.keys(getStoreValue(calendarData)).length > 0, // getStoreValue(calendarData) is sync
        secret: false,
    },
    {
        id: 'calendar_week', name: "Week Sorted", description: "Planned Baon for 7 different days.",
        icon: "🗓️", type: 'custom_check',
        check: () => Object.keys(getStoreValue(calendarData)).length >= 7, // sync
        secret: false,
    },
    {
        id: 'adobo_fave', name: "Adobo Aficionado", description: "You REALLY like Adobo, don't you?",
        icon: "🍗", type: 'custom_check',
        check: async () => { // ASYNC
            try {
                const favoriteMealIds = await getFavorites(); // AWAIT, returns IDs
                if (!Array.isArray(favoriteMealIds) || favoriteMealIds.length === 0) return false;

                // To check by name, we need the full meal objects or map IDs to names
                // Option 1: Fetch all meals (can be slightly inefficient if called often)
                const allCurrentMeals = await getAllMeals(); // getAllMeals is async
                
                // Option 2: Use the Svelte store if it's guaranteed to be populated when this runs
                // const allCurrentMeals = getStoreValue(allMealsStore); // '$allMealsStore' is the Svelte store

                // Using Option 1 for robustness here, assuming getAllMeals is available
                if (!allCurrentMeals || allCurrentMeals.length === 0) return false;

                return favoriteMealIds.some(favId => {
                    const favoriteMealObject = allCurrentMeals.find(meal => meal.id === favId);
                    return favoriteMealObject && favoriteMealObject.name.toLowerCase().includes("adobo");
                });
            } catch (error) {
                console.error("Error checking 'adobo_fave' achievement:", error);
                return false;
            }
        },
        secret: true,
    },
];

export function getAchievementById(id) {
    return achievements.find(a => a.id === id);
}