// File: src/services/busService.ts
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc,
  getDocs,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../api/firebase';

export interface Bus {
  id: string;
  routeNumber: string;
  destination: string;
  from: string;
  arrivalTime?: string;
  occupancy: number;
  totalSeats: number;
  status: 'On time' | 'Delayed' | 'Offline';
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
  isActive: boolean;
  passengerCount?: number;
  weather?: string;
}

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Calculate estimated arrival time based on distance
const calculateArrivalTime = (distance: number): string => {
  const avgSpeed = 30; // km/h average bus speed
  const timeInHours = distance / avgSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  if (timeInMinutes < 1) return 'Arriving';
  if (timeInMinutes < 60) return `${timeInMinutes} min`;
  const hours = Math.floor(timeInMinutes / 60);
  const mins = timeInMinutes % 60;
  return `${hours}h ${mins}m`;
};

// Subscribe to all active buses (real-time)
export const subscribeToAllBuses = (
  callback: (buses: Bus[]) => void,
  onError?: (error: Error) => void
) => {
  const busesRef = collection(db, 'buses');
  const q = query(busesRef, where('isActive', '==', true));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const buses: Bus[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          routeNumber: data.routeNumber,
          destination: data.destination,
          from: data.from,
          occupancy: data.occupancy,
          totalSeats: data.totalSeats || 45,
          status: data.status,
          location: data.location,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          isActive: data.isActive,
          passengerCount: data.passengerCount,
          weather: data.weather,
        } as Bus;
      });
      callback(buses);
    },
    (error) => {
      console.error('Error fetching buses:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
};

// Get nearby buses based on user location
export const getNearbyBuses = (
  userLat: number,
  userLon: number,
  maxDistance: number = 5, // km
  callback: (buses: Bus[]) => void
) => {
  return subscribeToAllBuses((buses) => {
    const nearbyBuses = buses
      .map((bus) => {
        const distance = calculateDistance(
          userLat,
          userLon,
          bus.location.latitude,
          bus.location.longitude
        );
        
        return {
          ...bus,
          distance,
          arrivalTime: calculateArrivalTime(distance),
        };
      })
      .filter((bus) => bus.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    callback(nearbyBuses);
  });
};

// Subscribe to a specific bus
export const subscribeToBus = (
  busId: string,
  callback: (bus: Bus | null) => void
) => {
  const busRef = doc(db, 'buses', busId);

  const unsubscribe = onSnapshot(busRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const bus: Bus = {
        id: doc.id,
        routeNumber: data.routeNumber,
        destination: data.destination,
        from: data.from,
        occupancy: data.occupancy,
        totalSeats: data.totalSeats || 45,
        status: data.status,
        location: data.location,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
        isActive: data.isActive,
        passengerCount: data.passengerCount,
        weather: data.weather,
      };
      callback(bus);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
