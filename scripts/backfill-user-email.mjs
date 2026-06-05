import { readFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

async function main() {
  const env = parseEnv(await readFile('.env', 'utf8'));
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  });
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'users'));
  let updatedCount = 0;

  for (const userDoc of snapshot.docs) {
    if (Object.prototype.hasOwnProperty.call(userDoc.data(), 'email')) continue;

    await updateDoc(userDoc.ref, {
      email: '',
      updatedAt: serverTimestamp()
    });
    updatedCount += 1;
  }

  console.log(JSON.stringify({ success: true, checkedUsers: snapshot.size, updatedCount }, null, 2));
}

main().catch((error) => {
  console.error('Failed to backfill user emails:', error);
  process.exit(1);
});
