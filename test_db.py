import firebase_admin
from firebase_admin import credentials, firestore, db

# Initialize the default app
cred = credentials.Certificate('/Users/lahiruasiri/Desktop/SmartBusApp/backend/firebase_credentials.json') # assuming credentials exist here since backend is running
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://smartbus-23f62-default-rtdb.firebaseio.com'
})

db_fs = firestore.client()
bus_doc = db_fs.collection('buses').document('Bus_01').get()
print("Firestore Bus_01:", bus_doc.to_dict().get('location') if bus_doc.exists else "Not found")

ref = db.reference('Bus_01/live_data')
print("RTDB Bus_01 live_data:", ref.get())
