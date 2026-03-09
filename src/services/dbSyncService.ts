import { ref, onValue, push, set } from 'firebase/database';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { database, db } from '../api/firebase';

const BUS_ID = 'Bus_01';

/**
 * [MANAGEMENT FLAG] Set to true to temporarily pause the background sync 
 * from Realtime Database to Firestore.
 */
const IS_SYNC_PAUSED = true;

/**
 * Syncs real-time IoT data from Firebase Realtime Database to Firestore
 * and conditionally appends weather data when new locations are detected.
 */
export const syncIoTDataToFirestore = () => {
  const busRef = ref(database, `${BUS_ID}`);

  // We keep track of the last processed timestamp to prevent duplicate weather API calls
  let lastProcessedTimestamp: string | null = null;
  let isInitialLoad = true;

  // Throttle weather fetching (5 minutes = 300,000 ms)
  let lastWeatherFetchTime = 0;
  let cachedWeatherStr: string | null = null;

  const unsubscribe = onValue(busRef, async (snapshot) => {
    if (IS_SYNC_PAUSED) {
      console.log('[Sync] Background synchronization is currently PAUSED via IS_SYNC_PAUSED flag.');
      return;
    }

    if (!snapshot.exists()) return;

    const data = snapshot.val();

    const liveData = data.live_data;
    const history = data.history;

    if (!liveData || !history) return;

    // 1. Get exact passenger count from the latest history item
    // The history object keys are auto-generated Push IDs, but Object.values maintains insertion order generally,
    // or we can sort them based on the timestamp string.
    const historyArray: any[] = Object.values(history);

    // safe string sorting instead of date math which breaks on the Hermes engine with "YYYY-MM-DD HH:mm:ss"
    historyArray.sort((a, b) => {
      const tsA = a.timestamp || "";
      const tsB = b.timestamp || "";
      return tsA.localeCompare(tsB);
    });

    const latestHistory = historyArray[historyArray.length - 1];
    const passengerCount = latestHistory?.count || 0;

    // 2. Extracted coordinates
    const lat = liveData.lat;
    const lng = liveData.lng;
    const updateTime = liveData.lastUpdate;

    // Calculate occupancy percentage 
    const totalSeats = 52;
    const occupancyPercentage = Math.round((passengerCount / totalSeats) * 100);

    // 3. Sync to Firestore
    try {
      const busDocRef = doc(db, 'buses', BUS_ID);
      await setDoc(busDocRef, {
        passengerCount,
        occupancy: occupancyPercentage,
        location: { latitude: lat, longitude: lng },
        totalSeats: totalSeats,
        routeNumber: '400/4',
        lastUpdated: serverTimestamp(), // or construct Date from updateTime
        destination: 'Pettah',
        from: 'Panadura',
        status: 'Delayed',
        isActive: true
      }, { merge: true });
      console.log(`[Sync] Synced IoT -> Firestore for ${BUS_ID}. Passenger Count: ${passengerCount}`);
    } catch (error) {
      console.error('[Sync] Error updating Firestore:', error);
    }

    // 4. Handle Weather and Location History
    if (updateTime && updateTime !== lastProcessedTimestamp) {
      if (!isInitialLoad) {
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (now - lastWeatherFetchTime >= FIVE_MINUTES) {
          // Fetch new weather
          fetchAndStoreWeather(lat, lng, updateTime).then(async (weatherStr) => {
            if (weatherStr) {
              cachedWeatherStr = weatherStr;
              lastWeatherFetchTime = now;
              const busDocRef = doc(db, 'buses', BUS_ID);
              await setDoc(busDocRef, { weather: weatherStr }, { merge: true });
            }
          });
        } else {
          // Reuse cached weather but still push location history
          pushLocationHistoryWithCachedWeather(lat, lng, updateTime, cachedWeatherStr);
        }
      }
      lastProcessedTimestamp = updateTime;
    }

    isInitialLoad = false;
  });

  return unsubscribe; // Return cleanup function
};

/**
 * Extracted function to fetch Weather and write back directly to the Realtime database `location_history` node
 */
const fetchAndStoreWeather = async (lat: number, lng: number, timestamp: string) => {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
    if (!response.ok) throw new Error('Weather API returned error');

    const result = await response.json();
    const weatherStr = `${result.current_weather.temperature}°C, Code: ${result.current_weather.weathercode}`;

    // Append to location_history
    const locationHistRef = ref(database, `${BUS_ID}/location_history`);
    const newEntryRef = push(locationHistRef);

    await set(newEntryRef, {
      lat,
      lng,
      timestamp,
      speed: 0, // Placeholder if we don't have it from liveData root readily
      weather: weatherStr,
      weatherDetails: result.current_weather // Store raw obj too just in case
    });

    console.log(`[Sync] Pushed new location history + Weather to Realtime DB: ${weatherStr}`);
    return weatherStr;
  } catch (error) {
    console.warn('[Sync] Failed to fetch weather data:', error);
    return null;
  }
};

/**
 * Pushes location history using the cached weather string to save API calls
 */
const pushLocationHistoryWithCachedWeather = async (lat: number, lng: number, timestamp: string, cachedWeatherStr: string | null) => {
  try {
    const locationHistRef = ref(database, `${BUS_ID}/location_history`);
    const newEntryRef = push(locationHistRef);

    await set(newEntryRef, {
      lat,
      lng,
      timestamp,
      speed: 0,
      weather: cachedWeatherStr || 'Weather data unavailable',
    });

    console.log(`[Sync] Pushed new location history with cached Weather: ${cachedWeatherStr}`);
  } catch (error) {
    console.warn('[Sync] Failed to push location history with cached weather:', error);
  }
};
