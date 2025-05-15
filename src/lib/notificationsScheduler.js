import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { format, parseISO, startOfDay, setHours, setMinutes, setSeconds, isFuture, isToday as dateFnsIsToday, subDays as dateFnsSubDays, addDays as dateFnsAddDays } from 'date-fns';
import { get as getStoreValue } from 'svelte/store';
import { writable } from 'svelte/store'; 

import { calendarData } from './calendar.js';
import { allMeals as allMealsStore } from './mealStore.js';
import { getNotificationSettings } from './settingsStore.js'; 
import { showToast } from './toast.js';

const NOTIFICATION_REMINDER_HOUR_DAY_OF_DEFAULT = 8;
const NOTIFICATION_REMINDER_MINUTE_DAY_OF_DEFAULT = 0;
const NOTIFICATION_REMINDER_HOUR_DAY_BEFORE_DEFAULT = 20;
const NOTIFICATION_REMINDER_MINUTE_DAY_BEFORE_DEFAULT = 0;

const MAX_DAYS_TO_SCHEDULE_AHEAD = 7;
const MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE = 10; // Example limit

export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) {
    console.log("[Notifications] Not a native platform, skipping permission request.");
    return false;
  }
  try {
    let permStatus = await LocalNotifications.checkPermissions();
    console.log('[Notifications] Initial permission status:', permStatus.display);
    if (permStatus.display === 'prompt' || permStatus.display === 'prompt-with-rationale') {
      permStatus = await LocalNotifications.requestPermissions();
      console.log('[Notifications] Permission request result:', permStatus.display);
    }
    if (permStatus.display !== 'granted') {
      showToast("Notifications disabled. Enable in settings for reminders.", "warning", 7000);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Notifications] Error requesting notification permissions:", e);
    showToast("Could not request notification permission.", "error");
    return false;
  }
}

async function clearExistingBaonReminders() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const baonReminderNotifications = pending.notifications.filter(
      notif => notif.extra && (notif.extra.type === 'baon_reminder_dayof' || notif.extra.type === 'baon_reminder_daybefore')
    );
    if (baonReminderNotifications.length > 0) {
      const idsToCancel = baonReminderNotifications.map(notif => ({ id: notif.id }));
      console.log('[Notifications] Clearing existing Baon reminders:', idsToCancel.map(n => n.id));
      await LocalNotifications.cancel({ notifications: idsToCancel });
    } else {
      console.log('[Notifications] No existing Baon reminders to clear.');
    }
  } catch (e) {
    console.error("[Notifications] Error clearing existing Baon reminders:", e);
  }
}


export async function scheduleBaonReminders() {
  if (!Capacitor.isNativePlatform()) {
    console.log("[Notifications] Not a native platform, skipping reminder scheduling.");
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log("[Notifications] No permission to schedule. Aborting reminder scheduling.");
    return;
  }

  console.log("------------------------------------------------------");
  console.log("[Notifications] Starting scheduleBaonReminders function...");
  await clearExistingBaonReminders();

  const settings = getNotificationSettings();
  console.log("[Notifications] Using Settings:", JSON.stringify(settings));

  const currentCalData = getStoreValue(calendarData);
  console.log("[Notifications] Calendar Data Keys:", Object.keys(currentCalData));
  
  const allMeals = getStoreValue(allMealsStore);
  // console.log("[Notifications] All Meals Count:", allMeals?.length);

  const todayForComparison = startOfDay(new Date());
  console.log("[Notifications] Today for comparison (start of day):", todayForComparison.toISOString());

  let scheduledCount = 0;
  const notificationsToSchedule = [];
  const datesToCheck = [];

  for (let i = 0; i < MAX_DAYS_TO_SCHEDULE_AHEAD; i++) {
    datesToCheck.push(dateFnsAddDays(todayForComparison, i));
  }
  console.log("[Notifications] Dates to check for planning:", datesToCheck.map(d => format(d, 'yyyy-MM-dd')));

  for (const dateToPlanFor of datesToCheck) {
    if (scheduledCount >= MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE) {
      console.log("[Notifications] Reached max notifications to schedule limit. Breaking loop.");
      break;
    }

    const dateKey = format(dateToPlanFor, 'yyyy-MM-dd');
    const mealIdsForDay = currentCalData[dateKey];

    console.log(`\n[Notifications] ---- Checking Baon Date: ${dateKey} ----`);
    if (!mealIdsForDay || mealIdsForDay.length === 0) {
      console.log(`[Notifications] No meals planned for ${dateKey}.`);
      continue;
    }
    console.log(`[Notifications] Meals found for ${dateKey}:`, mealIdsForDay);

    const firstMeal = allMeals.find(m => m.id === mealIdsForDay[0]);
    let baseBodyText = "You have Baon planned!";
    if (firstMeal) {
      baseBodyText = `${firstMeal.name}`;
      if (mealIdsForDay.length > 1) {
        baseBodyText += ` and ${mealIdsForDay.length - 1} more!`;
      }
    }
    console.log(`[Notifications] Base body text for ${dateKey}: "${baseBodyText}"`);

    // --- Schedule "Day Of" Reminder ---
    if (settings.dayOfEnabled) {
      console.log(`[Notifications] DayOf Reminder ENABLED for ${dateKey}. Time setting: ${settings.dayOfTime}`);
      if (scheduledCount < MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE) {
        let scheduleAtDayOf; // Declare here
        const [hourStr, minuteStr] = settings.dayOfTime.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        
        if (isNaN(hour) || isNaN(minute)) {
            console.error(`[Notifications] Invalid time format for DayOf setting: "${settings.dayOfTime}". Using defaults.`);
            scheduleAtDayOf = setSeconds(setMinutes(setHours(new Date(dateToPlanFor), NOTIFICATION_REMINDER_HOUR_DAY_OF_DEFAULT), NOTIFICATION_REMINDER_MINUTE_DAY_OF_DEFAULT), 0);
        } else {
            scheduleAtDayOf = setSeconds(setMinutes(setHours(new Date(dateToPlanFor), hour), minute), 0);
        }

        console.log(`  DayOf Calc for ${dateKey}: Target Baon Date: ${dateToPlanFor.toLocaleString()}`);
        console.log(`  DayOf Calc for ${dateKey}: scheduleAt (Local): ${scheduleAtDayOf.toLocaleString()}, Now (Local): ${new Date().toLocaleString()}`);
        console.log(`  DayOf Calc for ${dateKey}: Is scheduleAt > now? ${scheduleAtDayOf > new Date()}`);

        if (scheduleAtDayOf > new Date()) {
          const notificationId = parseInt(dateKey.replace(/-/g, '').substring(2) + "1", 10);
          notificationsToSchedule.push({
            id: notificationId, title: "🍙 Today's Baon!", body: baseBodyText,
            schedule: { at: scheduleAtDayOf, allowWhileIdle: true },
            extra: { type: 'baon_reminder_dayof', date: dateKey, deepLinkPath: `/calendar?date=${dateKey}` },
            smallIcon: 'ic_stat_baon_buddy_notif',
          });
          scheduledCount++;
          console.log(`  👍 DayOf for ${dateKey} ADDED TO SCHEDULE for ${scheduleAtDayOf.toLocaleString()} (ID: ${notificationId})`);
        } else {
          console.log(`  ❌ DayOf for ${dateKey} SKIPPED - scheduleAt (${scheduleAtDayOf.toLocaleString()}) not in future.`);
        }
      } else if (settings.dayOfEnabled) {
          console.log(`[Notifications] DayOf Reminder for ${dateKey} skipped due to MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE.`);
      }
    } else {
        console.log(`[Notifications] DayOf Reminder DISABLED for ${dateKey}.`);
    }

    // --- Schedule "Day Before" Reminder ---
    if (settings.dayBeforeEnabled) {
      console.log(`[Notifications] DayBefore Reminder ENABLED for Baon on ${dateKey}. Time setting: ${settings.dayBeforeTime}`);
      if (scheduledCount < MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE) {
        const reminderDayForActualMeal = dateFnsSubDays(dateToPlanFor, 1);
        console.log(`  DayBefore Calc for ${dateKey}: Reminder will be shown on: ${format(reminderDayForActualMeal, 'yyyy-MM-dd')}`);

        if (reminderDayForActualMeal >= todayForComparison) { // Ensure reminder day itself is not in the past
            let scheduleAtDayBefore; // Declare here
            const [hourStr, minuteStr] = settings.dayBeforeTime.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            if (isNaN(hour) || isNaN(minute)) {
                console.error(`[Notifications] Invalid time format for DayBefore setting: "${settings.dayBeforeTime}". Using defaults.`);
                scheduleAtDayBefore = setSeconds(setMinutes(setHours(new Date(reminderDayForActualMeal), NOTIFICATION_REMINDER_HOUR_DAY_BEFORE_DEFAULT), NOTIFICATION_REMINDER_MINUTE_DAY_BEFORE_DEFAULT), 0);
            } else {
                scheduleAtDayBefore = setSeconds(setMinutes(setHours(new Date(reminderDayForActualMeal), hour), minute), 0);
            }

            console.log(`  DayBefore Calc for ${dateKey}: scheduleAt (Local): ${scheduleAtDayBefore.toLocaleString()}, Now (Local): ${new Date().toLocaleString()}`);
            console.log(`  DayBefore Calc for ${dateKey}: Is scheduleAt > now? ${scheduleAtDayBefore > new Date()}`);

            if (scheduleAtDayBefore > new Date()) {
                const notificationId = parseInt(dateKey.replace(/-/g, '').substring(2) + "2", 10);
                notificationsToSchedule.push({
                    id: notificationId, title: "✨ Baon Prep Reminder!", body: `Tomorrow: ${baseBodyText}`,
                    schedule: { at: scheduleAtDayBefore, allowWhileIdle: true },
                    extra: { type: 'baon_reminder_daybefore', date: dateKey, deepLinkPath: `/calendar?date=${dateKey}` },
                    smallIcon: 'ic_stat_baon_buddy_notif',
                });
                scheduledCount++;
                console.log(`  👍 DayBefore for ${dateKey} ADDED TO SCHEDULE for ${scheduleAtDayBefore.toLocaleString()} (ID: ${notificationId})`);
            } else {
                console.log(`  ❌ DayBefore for ${dateKey} SKIPPED - scheduleAt (${scheduleAtDayBefore.toLocaleString()}) not in future.`);
            }
        } else {
            console.log(`  ❌ DayBefore for ${dateKey} SKIPPED - Reminder day (${format(reminderDayForActualMeal, 'yyyy-MM-dd')}) is in the past.`);
        }
      } else if (settings.dayBeforeEnabled) {
          console.log(`[Notifications] DayBefore Reminder for Baon on ${dateKey} skipped due to MAX_TOTAL_NOTIFICATIONS_TO_SCHEDULE.`);
      }
    } else {
        console.log(`[Notifications] DayBefore Reminder DISABLED for ${dateKey}.`);
    }
  } // End of for...of datesToCheck loop
  console.log("------------------------------------------------------");

  if (notificationsToSchedule.length > 0) {
    try {
      console.log('[Notifications] FINAL list to schedule:', JSON.stringify(notificationsToSchedule.map(n=>({id:n.id, title:n.title, at: n.schedule.at.toLocaleString()})), null, 2));
      const scheduleResult = await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log('[Notifications] LocalNotifications.schedule call result:', scheduleResult);
      if (scheduleResult && scheduleResult.notifications && scheduleResult.notifications.length > 0) {
        // showToast(`${scheduleResult.notifications.length} Baon reminder(s) set!`, "success"); // Optional success toast
      } else if (notificationsToSchedule.length > 0 && (!scheduleResult || !scheduleResult.notifications || scheduleResult.notifications.length === 0)) {
        console.warn("[Notifications] Attempted to schedule but plugin reported none were set. This might be due to all IDs already pending with same schedule time, or all times being in the past just before scheduling.");
      }
    } catch (e) {
      console.error("[Notifications] CRITICAL Error during LocalNotifications.schedule:", e);
      showToast("Could not set Baon reminders (see console).", "error");
    }
  } else {
    console.log("[Notifications] No new reminders were added to the schedule list this time (e.g., all disabled, all times past, or no Baon planned).");
  }
  console.log("[Notifications] scheduleBaonReminders function finished.");
  console.log("------------------------------------------------------");
}

export const navigateToDateStore = writable(null);