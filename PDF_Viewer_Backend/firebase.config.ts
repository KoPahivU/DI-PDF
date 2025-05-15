import * as admin from 'firebase-admin';
import * as path from 'path';

admin.initializeApp({
  credential: admin.credential.cert(path.join(__dirname, 'serviceAccountKey.json')),
  storageBucket: 'your-firebase-storage-bucket-url.appspot.com',
});

const bucket = admin.storage().bucket();

export { bucket };