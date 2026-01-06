// src/data/fullViolationDataset.ts
// FULL DATASET FOR YOUR PROPOSAL DEMO — 30 VIOLATIONS ACROSS 3 DRIVERS

export const FullViolationDataset = [
  // Driver 1: NA-1234 (High Risk — 15 violations)
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 68, accel: null, location: { latitude: 6.9271, longitude: 79.8612 }, timestamp: new Date('2025-12-21T10:30:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 75, accel: null, location: { latitude: 6.9350, longitude: 79.8500 }, timestamp: new Date('2025-12-21T15:45:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '177', type: 'harsh_acceleration', speed: null, accel: 0.42, location: { latitude: 6.8900, longitude: 79.8800 }, timestamp: new Date('2025-12-20T09:20:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 82, accel: null, location: { latitude: 6.9100, longitude: 79.8700 }, timestamp: new Date('2025-12-19T16:10:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '100', type: 'harsh_braking', speed: null, accel: -0.48, location: { latitude: 6.9500, longitude: 79.8600 }, timestamp: new Date('2025-12-18T11:55:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 78, accel: null, location: { latitude: 6.9220, longitude: 79.8550 }, timestamp: new Date('2025-12-17T14:30:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '177', type: 'speeding', speed: 71, accel: null, location: { latitude: 6.8850, longitude: 79.8750 }, timestamp: new Date('2025-12-16T08:40:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '100', type: 'harsh_acceleration', speed: null, accel: 0.45, location: { latitude: 6.9450, longitude: 79.8580 }, timestamp: new Date('2025-12-15T17:20:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 74, accel: null, location: { latitude: 6.9300, longitude: 79.8650 }, timestamp: new Date('2025-12-14T13:15:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '177', type: 'harsh_braking', speed: null, accel: -0.52, location: { latitude: 6.8950, longitude: 79.8850 }, timestamp: new Date('2025-12-13T10:00:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 67, accel: null, location: { latitude: 6.9280, longitude: 79.8620 }, timestamp: new Date('2025-12-12T11:30:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '100', type: 'speeding', speed: 73, accel: null, location: { latitude: 6.9520, longitude: 79.8590 }, timestamp: new Date('2025-12-11T16:45:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'harsh_acceleration', speed: null, accel: 0.38, location: { latitude: 6.9150, longitude: 79.8680 }, timestamp: new Date('2025-12-10T09:10:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '177', type: 'speeding', speed: 70, accel: null, location: { latitude: 6.8870, longitude: 79.8820 }, timestamp: new Date('2025-12-09T14:50:00') },
  { busId: 'NA-1234', driverName: 'Saman Perera', routeNumber: '138', type: 'speeding', speed: 76, accel: null, location: { latitude: 6.9320, longitude: 79.8530 }, timestamp: new Date('2025-12-08T12:25:00') },

  // Driver 2: WP-KA-5678 (Medium Risk — 10 violations)
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '100', type: 'speeding', speed: 65, accel: null, location: { latitude: 6.9400, longitude: 79.8700 }, timestamp: new Date('2025-12-20T11:00:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '138', type: 'harsh_acceleration', speed: null, accel: 0.40, location: { latitude: 6.9200, longitude: 79.8600 }, timestamp: new Date('2025-12-19T13:30:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '177', type: 'speeding', speed: 69, accel: null, location: { latitude: 6.8800, longitude: 79.8900 }, timestamp: new Date('2025-12-18T15:20:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '100', type: 'harsh_braking', speed: null, accel: -0.45, location: { latitude: 6.9550, longitude: 79.8550 }, timestamp: new Date('2025-12-17T10:45:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '138', type: 'speeding', speed: 72, accel: null, location: { latitude: 6.9250, longitude: 79.8650 }, timestamp: new Date('2025-12-16T16:00:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '177', type: 'speeding', speed: 67, accel: null, location: { latitude: 6.8850, longitude: 79.8780 }, timestamp: new Date('2025-12-15T09:15:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '100', type: 'harsh_acceleration', speed: null, accel: 0.37, location: { latitude: 6.9480, longitude: 79.8620 }, timestamp: new Date('2025-12-14T14:30:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '138', type: 'speeding', speed: 70, accel: null, location: { latitude: 6.9300, longitude: 79.8580 }, timestamp: new Date('2025-12-13T12:00:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '177', type: 'harsh_braking', speed: null, accel: -0.50, location: { latitude: 6.8920, longitude: 79.8830 }, timestamp: new Date('2025-12-12T17:45:00') },
  { busId: 'WP-KA-5678', driverName: 'Nimal Silva', routeNumber: '100', type: 'speeding', speed: 68, accel: null, location: { latitude: 6.9530, longitude: 79.8570 }, timestamp: new Date('2025-12-11T11:20:00') },

  // Driver 3: NC-9876 (Low Risk — 5 violations)
  { busId: 'NC-9876', driverName: 'Sunil Fernando', routeNumber: '138', type: 'speeding', speed: 62, accel: null, location: { latitude: 6.9290, longitude: 79.8630 }, timestamp: new Date('2025-12-20T12:00:00') },
  { busId: 'NC-9876', driverName: 'Sunil Fernando', routeNumber: '100', type: 'harsh_acceleration', speed: null, accel: 0.36, location: { latitude: 6.9510, longitude: 79.8610 }, timestamp: new Date('2025-12-18T14:15:00') },
  { busId: 'NC-9876', driverName: 'Sunil Fernando', routeNumber: '177', type: 'speeding', speed: 64, accel: null, location: { latitude: 6.8880, longitude: 79.8810 }, timestamp: new Date('2025-12-16T10:30:00') },
  { busId: 'NC-9876', driverName: 'Sunil Fernando', routeNumber: '138', type: 'speeding', speed: 61, accel: null, location: { latitude: 6.9260, longitude: 79.8640 }, timestamp: new Date('2025-12-14T15:00:00') },
  { busId: 'NC-9876', driverName: 'Sunil Fernando', routeNumber: '100', type: 'harsh_braking', speed: null, accel: -0.40, location: { latitude: 6.9490, longitude: 79.8600 }, timestamp: new Date('2025-12-12T11:45:00') },
];