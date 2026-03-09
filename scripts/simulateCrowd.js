// File: scripts/simulateCrowd.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Configuration
const DEFAULT_BUS_ID = "Bus_01"; // Default bus to simulate
const busId = process.argv[2] || DEFAULT_BUS_ID;

console.log(`\n🚀 SmartBus Crowd Simulator`);
console.log(`---------------------------------`);
console.log(`Target Bus: ${busId}`);
console.log(`Controls:`);
console.log(`  [+] or [UP]    : Increase passengers`);
console.log(`  [-] or [DOWN]  : Decrease passengers`);
console.log(`  [q]            : Exit`);
console.log(`---------------------------------\n`);

// Setup Keypress Listener
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

let passengerCount = 0;
let totalSeats = 52; // Default requested by user
let routeNum = "";

// Fetch initial data
async function init() {
    const busRef = db.collection('buses').doc(busId);
    const doc = await busRef.get();

    if (!doc.exists) {
        console.error(`❌ Bus ${busId} not found in Firestore!`);
        process.exit(1);
    }

    const data = doc.data();
    totalSeats = data.totalSeats || 52;
    // Reverse calculate passenger count from percentage if possible
    const currentPercent = data.occupancy || 0;
    passengerCount = Math.round((currentPercent / 100) * totalSeats);
    routeNum = data.routeNumber || "Unknown";

    console.log(`Connected to Route ${routeNum}`);
    displayStatus();
}

function displayStatus() {
    const percentage = Math.round((passengerCount / totalSeats) * 100);
    process.stdout.write(`\r[Route ${routeNum}] Passengers: ${passengerCount}/${totalSeats} -> Occupancy: ${percentage}%   `);
}

async function updateFirestore() {
    try {
        const percentage = Math.round((passengerCount / totalSeats) * 100);
        await db.collection('buses').doc(busId).update({
            occupancy: percentage,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('\n❌ Firestore Update Error:', error.message);
    }
}

process.stdin.on('keypress', (str, key) => {
    if (key.name === 'up' || str === '+') {
        if (passengerCount < totalSeats) {
            passengerCount++;
            displayStatus();
            updateFirestore();
        }
    } else if (key.name === 'down' || str === '-') {
        if (passengerCount > 0) {
            passengerCount--;
            displayStatus();
            updateFirestore();
        }
    } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        console.log('\n\n👋 Simulation ended.');
        process.exit();
    }
});

// Start the simulator
init().catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
});
