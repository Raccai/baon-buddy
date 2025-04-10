import { writable } from 'svelte/store';

let id = 0;

export const toasts = writable([]); // array of { id, message, type }

export function showToast(message, type = 'info', duration = 2500) {
  const newToast = { id: id++, message, type };
  toasts.update(all => [...all, newToast]);

  setTimeout(() => {
    toasts.update(all => all.filter(t => t.id !== newToast.id));
  }, duration);
}