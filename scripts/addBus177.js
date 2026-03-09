// File: scripts/addBus177.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const newBus = {
    id: "Bus_02",
    routeNumber: "177",
    destination: "Kollupitiya",
    from: "Kaduwela",
    status: "Delayed",
    occupancy: 34,
    totalSeats: 54,
    location: {
        latitude: 6.917379,
        longitude: 79.973780
    },
    isActive: true,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
};

async function addBus() {
    try {
        console.log(`Adding ${newBus.id} (Route ${newBus.routeNumber}) to Firestore...`);
        const busRef = db.collection('buses').doc(newBus.id);
        await busRef.set(newBus, { merge: true });
        console.log(`✅ Successfully added/updated ${newBus.id}!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding bus:', error);
        process.exit(1);
    }
}

addBus();
