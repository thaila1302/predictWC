import { readFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';

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

function assertFirebaseConfig(config) {
  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase env values: ${missingKeys.join(', ')}`);
  }
}

function flattenMatches(matchesData) {
  return Object.values(matchesData)
    .filter(Array.isArray)
    .flat()
    .filter((match) => match?.id);
}

async function commitInChunks(db, writes) {
  const chunkSize = 450;

  for (let index = 0; index < writes.length; index += chunkSize) {
    const batch = writeBatch(db);
    writes.slice(index, index + chunkSize).forEach(({ ref, data, options }) => {
      batch.set(ref, data, options);
    });
    await batch.commit();
  }
}

async function main() {
  const env = parseEnv(await readFile('.env', 'utf8'));
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };

  assertFirebaseConfig(firebaseConfig);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const groups = JSON.parse(await readFile('data/groups.json', 'utf8'));
  const matchesData = JSON.parse(await readFile('data/matches.json', 'utf8'));
  const matches = flattenMatches(matchesData);
  const writes = [];

  groups.forEach((group) => {
    writes.push({
      ref: doc(collection(db, 'groups'), group.label),
      data: {
        label: group.label,
        teams: group.teams || [],
        updatedAt: serverTimestamp()
      },
      options: { merge: true }
    });
  });

  for (const match of matches) {
    const matchRef = doc(collection(db, 'matches'), match.id);
    const snapshot = await getDoc(matchRef);

    writes.push({
      ref: matchRef,
      data: snapshot.exists()
        ? {
            homeLogo: match.homeLogo || '',
            awayLogo: match.awayLogo || '',
            updatedAt: serverTimestamp()
          }
        : {
            ...match,
            updatedAt: serverTimestamp()
          },
      options: { merge: true }
    });
  }

  await commitInChunks(db, writes);

  console.log(
    JSON.stringify(
      {
        success: true,
        syncedGroups: groups.length,
        syncedMatches: matches.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('Failed to sync seed data to Firestore:', error);
  process.exit(1);
});
