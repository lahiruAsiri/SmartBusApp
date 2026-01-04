// File: src/services/BusRouteOptimizer.ts

import * as BusRoutesData from '../data/BusRoutes.json';
import { Bus } from './busService';

// Types defining the structure of the JSON data
interface BusStop {
    combined_code: string;
    global_code: string;
    location_name: string;
    latitude: number;
    longitude: number;
}

interface Route {
    route_number: string;
    start: string;
    end: string;
    intermediate_locations?: string[];
    bus_stops?: BusStop[];
}

interface Node {
    route_number?: string;
    routes?: Route[] | Node[];
    [key: string]: any;
}

// Result types
export interface BusRouteResult {
    routeNumber: string;
    closestStop: BusStop;
    distanceMeters: number;
    destinationMatch: string;
}

export interface JourneyResult {
    type: 'direct' | 'direct_far' | 'transfer';
    route1: BusRouteResult;
    route2?: BusRouteResult;
    transferAt?: string;
    reason?: string;
}

export class BusRouteOptimizer {
    private static instance: BusRouteOptimizer;
    private routes: Route[] = [];
    private locationIndex: Map<string, number[]> = new Map(); // keyword -> route indices
    private routeData: { routeNumber: string; stops: BusStop[]; original: Route }[] = [];
    private initialized = false;

    private constructor() {
        this.init();
    }

    public static getInstance(): BusRouteOptimizer {
        if (!BusRouteOptimizer.instance) {
            BusRouteOptimizer.instance = new BusRouteOptimizer();
        }
        return BusRouteOptimizer.instance;
    }

    private init() {
        if (this.initialized) return;

        // 1. Extract flat list of routes
        this.routes = this.extractRoutes(BusRoutesData as any);

        // 2. Build Index
        this.buildIndex();

        this.initialized = true;
        console.log(`[BusRouteOptimizer] Initialized with ${this.routes.length} routes and ${this.locationIndex.size} indexed locations.`);
    }

    private extractRoutes(data: any): Route[] {
        let collectedRoutes: Route[] = [];

        if (Array.isArray(data)) {
            for (const item of data) {
                collectedRoutes = collectedRoutes.concat(this.extractRoutes(item));
            }
        } else if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (key === 'routes' && Array.isArray(data[key])) {
                    collectedRoutes = collectedRoutes.concat(data[key]);
                } else {
                    collectedRoutes = collectedRoutes.concat(this.extractRoutes(data[key]));
                }
            }
        }

        return collectedRoutes;
    }

    private buildIndex() {
        this.routes.forEach((route, index) => {
            // Process stops
            const stops: BusStop[] = [];
            if (route.bus_stops) {
                route.bus_stops.forEach(stop => {
                    if (stop.latitude != null && stop.longitude != null) {
                        stops.push({
                            ...stop,
                            location_name: (stop.location_name || '').toLowerCase()
                        });
                    }
                });
            }

            this.routeData.push({
                routeNumber: route.route_number || 'Unknown',
                stops: stops,
                original: route
            });

            // Index keywords (intermediate locations + stop names)
            const keywords = new Set<string>();

            if (route.intermediate_locations) {
                route.intermediate_locations.forEach(loc => keywords.add(loc.toLowerCase()));
            }

            stops.forEach(stop => keywords.add(stop.location_name));

            keywords.forEach(kw => {
                if (!this.locationIndex.has(kw)) {
                    this.locationIndex.set(kw, []);
                }
                this.locationIndex.get(kw)?.push(index);
            });
        });
    }

    public getIntermediateLocations(): string[] {
        return Array.from(this.locationIndex.keys()).sort();
    }

    public searchLocations(query: string): string[] {
        const q = query.toLowerCase();
        const results: string[] = [];
        // Perform a simple prefix or containment match on keys
        // Since we have direct map access, we iterate keys. 
        // For larger datasets, a trie would be better, but this is fine for <10k locs.
        for (const key of this.locationIndex.keys()) {
            if (key.includes(q)) {
                results.push(key);
                if (results.length > 10) break; // Limit suggestions
            }
        }
        return results;
    }

    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // meters
        const toRad = (val: number) => val * Math.PI / 180;

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public findBestRoute(userLat: number, userLon: number, destinationName: string): BusRouteResult[] {
        const destKey = destinationName.toLowerCase();
        const candidateIndices = this.locationIndex.get(destKey);

        if (!candidateIndices) return [];

        const results: BusRouteResult[] = [];

        for (const rIdx of candidateIndices) {
            const routeData = this.routeData[rIdx];
            const stops = routeData.stops;

            if (!stops || stops.length === 0) continue;

            let minDist = Infinity;
            let closestStop: BusStop | null = null;

            for (const stop of stops) {
                const dist = this.haversineDistance(userLat, userLon, stop.latitude, stop.longitude);
                if (dist < minDist) {
                    minDist = dist;
                    closestStop = stop;
                }
            }

            if (closestStop) {
                results.push({
                    routeNumber: routeData.routeNumber,
                    closestStop: closestStop,
                    distanceMeters: minDist,
                    destinationMatch: destinationName
                });
            }
        }

        // Sort by distance
        results.sort((a, b) => a.distanceMeters - b.distanceMeters);
        return results;
    }

    public findTransferRoute(userLat: number, userLon: number, destinationName: string): JourneyResult | null {
        // 1. Best direct route
        const directMatches = this.findBestRoute(userLat, userLon, destinationName);

        if (!directMatches || directMatches.length === 0) {
            return null; // No route found at all
        }

        const bestDirect = directMatches[0];
        const distToMainStop = bestDirect.distanceMeters;

        // Direct is close enough
        if (distToMainStop <= 1000) {
            return {
                type: 'direct',
                route1: bestDirect
            };
        }

        // 2. Too far - try to find a feeder
        // The stop we need to get to
        const transferLocationName = bestDirect.closestStop.location_name;

        // Search for route from User -> Transfer Location
        const feederMatches = this.findBestRoute(userLat, userLon, transferLocationName);

        if (feederMatches && feederMatches.length > 0) {
            const bestFeeder = feederMatches[0];

            // Check if feeder is actually helpful (closer to user than the direct walk)
            // and within reasonable distance
            if (bestFeeder.distanceMeters < distToMainStop && bestFeeder.distanceMeters < 1000) {
                return {
                    type: 'transfer',
                    route1: bestFeeder,
                    route2: bestDirect,
                    transferAt: transferLocationName
                };
            }
        }

        // Fallback if no good feeder found
        return {
            type: 'direct_far',
            route1: bestDirect,
            reason: 'Closest direct stop is > 1000m away, and no suitable feeder bus found.'
        };
    }
    public findRouteToCoordinate(userLat: number, userLon: number, destLat: number, destLon: number): JourneyResult | null {
        // 1. Find the closest known bus stop to the destination coordinates
        let bestStop: BusStop | null = null;
        let minDestDist = Infinity;

        // Iterate through all routes/stops to find the one closest to (destLat, destLon)
        // Optimization: We could spatially index this, but for now linear scan of ~200 stops is fine.
        for (const routeData of this.routeData) {
            if (!routeData.stops) continue;
            for (const stop of routeData.stops) {
                const dist = this.haversineDistance(destLat, destLon, stop.latitude, stop.longitude);
                if (dist < minDestDist) {
                    minDestDist = dist;
                    bestStop = stop;
                }
            }
        }

        if (!bestStop) {
            console.log('No closest stop found for destination coordinates');
            return null;
        }

        // 2. Use that stop's name to find the route from user
        console.log(`Closest stop to saved address is: ${bestStop.location_name} (${Math.round(minDestDist)}m away)`);

        // Use findTransferRoute with the identified stop name
        return this.findTransferRoute(userLat, userLon, bestStop.location_name);
    }
}
