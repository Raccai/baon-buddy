const FAVORITES_KEY = "baonFavorites";
const SEEN_KEY = "seenMeals";

// Get favorites from localStorage
export const getFavorites = () => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
};

// Save a new favorite (no duplicates)
export const saveFavorite = (meal) => {
    const current = getFavorites();
    const exists = current.some(fave => fave.name === meal.name);
    if(!exists) {
        const updated = [...current, meal];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
};

// Remove favorite by meal name
export const removeFavorite = (mealName) => {
    const current = getFavorites();
    const updated = current.filter(fave => fave.name !== mealName);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
};

// Check if meal is already a fave
export const isFavorite = (mealName) => {
    return getFavorites().some(fave => fave.name === mealName);
};

// Clears list of favorites
export function clearFavorites() {
    localStorage.removeItem(FAVORITES_KEY);
}

// For a complete wipeout of data (settings + favorites)
export function resetStorage() {
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.clear(); // wipes everything stored in this app
}

// App Open Counter
export function incrementCounter(key) {
    let count = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, String(count + 1))
}
export function getCounter(key) {
    return parseInt(localStorage.getItem(key) || "0", 10);
}

// For Seen Baon Meals
export function getSeenMEals() {
    const stored = localStorage.getItem(SEEN_KEY);
    return stored ? JSON.parse(stored) : [];
}
export function markMealAsSeen(mealName) {
    const current = getSeenMEals();
    if(!current.includes(mealName)) {
        const updated = [...current, mealName];
        localStorage.setItem(SEEN_KEY, JSON.stringify(updated));
    }
} 
export function clearSeenMEals() {
    localStorage.removeItem(SEEN_KEY);
}