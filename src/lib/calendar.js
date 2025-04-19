import { writable } from 'svelte/store';

// Load saved calendar from localStorage (fall back to empty object)
function load() {
  try {
    const json = localStorage.getItem('baonCalendar');
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function save(data) {
  localStorage.setItem('baonCalendar', JSON.stringify(data));
}

// Structure: { 'YYYY-MM-DD': [mealObj, mealObj, ...] }
export const calendarData = writable(load());
calendarData.subscribe(save);

export function addBaon(date, meals) {
  calendarData.update(data => {
    return {
      ...data,
      [date]: meals
    };
  });
  return true;
}

export function removeBaon(dateKey, index) {
  calendarData.update(store => {
    const list = store[dateKey] || [];
    list.splice(index, 1);
    if (list.length) store[dateKey] = list;
    else delete store[dateKey];
    return store;
  });
}

export function copyBaon(dateKey) {
  const store = load();
  return store[dateKey] ? [...store[dateKey]] : null;
}

export function pasteBaon(targetKey, meals) {
  calendarData.update(store => {
    store[targetKey] = meals.slice(0, 3);
    return store;
  });
}