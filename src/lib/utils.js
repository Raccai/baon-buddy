// Get n random meals (without repeats)
export function getRandomMeals(mealList, count = 3) {
    const shuffled = [...mealList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};