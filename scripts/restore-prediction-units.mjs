import { readFile } from 'node:fs/promises';
import { initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

const DEFAULT_UNIT_ID = 'default';
const VALID_CHOICES = new Set(['home', 'draw', 'away']);

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        const key = line.slice(0, separatorIndex);
        const rawValue = line.slice(separatorIndex + 1);
        const value = rawValue.startsWith('"') && rawValue.endsWith('"') ? rawValue.slice(1, -1) : rawValue;
        return [key, value];
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

function getUserUnitId(user) {
  return user?.unitId || DEFAULT_UNIT_ID;
}

function getPredictionUnitId(prediction) {
  return prediction?.unitId || '';
}

async function commitInChunks(db, writes) {
  const chunkSize = 450;

  for (let index = 0; index < writes.length; index += chunkSize) {
    const batch = writeBatch(db);
    writes.slice(index, index + chunkSize).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const includeMismatched = process.argv.includes('--include-mismatched');
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
  const [usersSnapshot, predictionsSnapshot] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'predictions'))
  ]);
  const usersById = new Map(usersSnapshot.docs.map((userDoc) => [userDoc.id, userDoc.data()]));
  const writes = [];
  const examples = [];
  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    users: usersSnapshot.size,
    predictions: predictionsSnapshot.size,
    withUserChoice: 0,
    missingUnitWithChoice: 0,
    mismatchedUnitWithChoice: 0,
    skippedMissingUser: 0,
    writesPrepared: 0,
    includeMismatched
  };

  predictionsSnapshot.docs.forEach((predictionDoc) => {
    const prediction = predictionDoc.data();
    const hasUserChoice = VALID_CHOICES.has(prediction.predictedResult);
    if (!hasUserChoice) return;

    summary.withUserChoice += 1;

    const user = usersById.get(prediction.userId);
    if (!user) {
      summary.skippedMissingUser += 1;
      return;
    }

    const targetUnitId = getUserUnitId(user);
    const currentUnitId = getPredictionUnitId(prediction);
    const isMissingUnit = !currentUnitId;
    const isMismatchedUnit = currentUnitId && currentUnitId !== targetUnitId;

    if (isMissingUnit) summary.missingUnitWithChoice += 1;
    if (isMismatchedUnit) summary.mismatchedUnitWithChoice += 1;

    if (!isMissingUnit && !(includeMismatched && isMismatchedUnit)) return;

    writes.push({
      ref: predictionDoc.ref,
      data: {
        unitId: targetUnitId,
        updatedAt: serverTimestamp()
      }
    });

    if (examples.length < 20) {
      examples.push({
        id: predictionDoc.id,
        userId: prediction.userId,
        matchId: prediction.matchId,
        predictedResult: prediction.predictedResult,
        fromUnitId: currentUnitId || null,
        toUnitId: targetUnitId,
        reason: isMissingUnit ? 'missing-unit' : 'mismatched-unit'
      });
    }
  });

  summary.writesPrepared = writes.length;

  if (apply && writes.length > 0) {
    await commitInChunks(db, writes);
  }

  console.log(JSON.stringify({ summary, examples }, null, 2));
}

main().catch((error) => {
  console.error('Failed to restore prediction units:', error);
  process.exit(1);
});
