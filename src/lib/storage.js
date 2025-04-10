const FAVORITES_KEY = "baonFavorites";

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