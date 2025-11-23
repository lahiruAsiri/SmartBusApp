// File: scripts/uploadBuses.js
// Run this once to upload all buses at once

const admin = require('firebase-admin');

// Download service account key from Firebase Console:
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Define all your buses here
const buses = [
  {
  "id": "bus_100_NC-1361",
  "routeNumber": "100",
  "destination": "Pettah",
  "from": "Panadura",
  "status": "Delayed",
  "occupancy": 37,
  "totalSeats": 45,
  "location": {
  "latitude": 6.862,
  "longitude": 79.9618
  },
  "isActive": true
  },
  {
  "id": "bus_101_NC-6393",
  "routeNumber": "101",
  "destination": "Pettah",
  "from": "Moratuwa",
  "status": "Delayed",
  "occupancy": 54,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8653,
  "longitude": 79.9643
  },
  "isActive": true
  },
  {
  "id": "bus_102_NC-4721",
  "routeNumber": "102",
  "destination": "Kotahena",
  "from": "Moratuwa",
  "status": "On time",
  "occupancy": 67,
  "totalSeats": 45,
  "location": {
  "latitude": 6.8621,
  "longitude": 79.9548
  },
  "isActive": true
  },
  {
  "id": "bus_105_NC-1029",
  "routeNumber": "105",
  "destination": "Kotahena",
  "from": "Attidiya",
  "status": "On time",
  "occupancy": 70,
  "totalSeats": 45,
  "location": {
  "latitude": 6.8664,
  "longitude": 79.9613
  },
  "isActive": true
  },
  {
  "id": "bus_118_NC-8360",
  "routeNumber": "118",
  "destination": "Beddagana",
  "from": "Dehiwala",
  "status": "Delayed",
  "occupancy": 22,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8705,
  "longitude": 79.9586
  },
  "isActive": true
  },
  {
  "id": "bus_119_NC-6095",
  "routeNumber": "119",
  "destination": "Maharagama",
  "from": "Dehiwala",
  "status": "Delayed",
  "occupancy": 80,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8676,
  "longitude": 79.9601
  },
  "isActive": true
  },
  {
  "id": "bus_134_NC-7983",
  "routeNumber": "134",
  "destination": "Mt. Lavinia",
  "from": "Angoda",
  "status": "On time",
  "occupancy": 61,
  "totalSeats": 45,
  "location": {
  "latitude": 6.865,
  "longitude": 79.957
  },
  "isActive": true
  },
  {
  "id": "bus_156_NC-5180",
  "routeNumber": "156",
  "destination": "Nugegoda",
  "from": "Dehiwala",
  "status": "Delayed",
  "occupancy": 33,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8688,
  "longitude": 79.9552
  },
  "isActive": true
  },
  {
  "id": "bus_163_NC-9437",
  "routeNumber": "163",
  "destination": "Battaramulla",
  "from": "Dehiwala",
  "status": "Delayed",
  "occupancy": 89,
  "totalSeats": 45,
  "location": {
  "latitude": 6.8674,
  "longitude": 79.9637
  },
  "isActive": true
  },
  {
  "id": "bus_255_NC-4560",
  "routeNumber": "255",
  "destination": "Kottawa",
  "from": "Mount Lavinia",
  "status": "Delayed",
  "occupancy": 80,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8624,
  "longitude": 79.9631
  },
  "isActive": true
  },
  {
  "id": "bus_245_NC-5060",
  "routeNumber": "255",
  "destination": "Kottawa",
  "from": "Mount Lavinia",
  "status": "Delayed",
  "occupancy": 80,
  "totalSeats": 50,
  "location": {
  "latitude": 6.8624,
  "longitude": 79.9631
  },
  "isActive": true
  }
  // Add as many buses as you want here!
];

// Upload function
async function uploadBuses() {
  console.log('Starting bulk upload...');
  
  const batch = db.batch();
  
  buses.forEach((bus) => {
    const busRef = db.collection('buses').doc(bus.id);
    batch.set(busRef, {
      ...bus,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  
  try {
    await batch.commit();
    console.log(`✅ Successfully uploaded ${buses.length} buses!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading buses:', error);
    process.exit(1);
  }
}

uploadBuses();