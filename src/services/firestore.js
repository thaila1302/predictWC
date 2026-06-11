import {
  getDocs,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { getMatchSortTime, getResultFromScores } from '../lib/utils';

export function listenMatches(callback) {
  const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    matches.sort((left, right) => getMatchSortTime(left) - getMatchSortTime(right));
    callback(matches);
  });
}

export function listenGroups(callback) {
  const q = query(collection(db, 'groups'), orderBy('label', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    callback(groups);
  });
}

export function listenLeaderboard(callback) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((left, right) => {
        const wrongDiff = (right.wrongPredictions || 0) - (left.wrongPredictions || 0);
        if (wrongDiff !== 0) return wrongDiff;
        return String(left.displayName || left.username || '').localeCompare(
          String(right.displayName || right.username || '')
        );
      });
    callback(players);
  });
}

export function listenUserPredictions(userId, callback) {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export function listenAllPredictions(callback) {
  const q = query(collection(db, 'predictions'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function savePrediction({ userId, matchId, predictedResult }) {
  const predictionRef = doc(db, 'predictions', `${userId}_${matchId}`);
  await setDoc(
    predictionRef,
    {
      userId,
      matchId,
      predictedResult,
      resultStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveMatchAndSyncScores(matchId, payload) {
  const matchRef = doc(db, 'matches', matchId);
  const computedWinner =
    payload.status === 'finished' ? getResultFromScores(payload.homeScore, payload.awayScore) : null;

  await setDoc(
    matchRef,
    {
      ...payload,
      winner: computedWinner,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  const predictionsSnapshot = await getDocs(query(collection(db, 'predictions'), where('matchId', '==', matchId)));
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const affectedUserIds = new Set(usersSnapshot.docs.map((userDoc) => userDoc.id));
  const predictedUserIds = new Set();
  const batch = writeBatch(db);

  predictionsSnapshot.docs.forEach((predictionDoc) => {
    const prediction = predictionDoc.data();
    predictedUserIds.add(prediction.userId);
    const nextResultStatus =
      computedWinner && payload.status === 'finished'
        ? prediction.predictedResult === computedWinner
          ? 'not_wrong'
          : 'wrong'
        : 'pending';
    batch.set(
      predictionDoc.ref,
      {
        resultStatus: nextResultStatus,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    affectedUserIds.add(prediction.userId);
  });

  if (computedWinner && payload.status === 'finished') {
    usersSnapshot.docs.forEach((userDoc) => {
      const userId = userDoc.id;
      if (predictedUserIds.has(userId)) return;

      const missedPredictionRef = doc(db, 'predictions', `${userId}_${matchId}`);
      batch.set(
        missedPredictionRef,
        {
          userId,
          matchId,
          predictedResult: null,
          resultStatus: 'wrong',
          autoMissed: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });
  }

  await batch.commit();

  for (const userId of affectedUserIds) {
    const targetRef = doc(db, 'users', userId);
    const predictionsByUserSnapshot = await getDocs(query(collection(db, 'predictions'), where('userId', '==', userId)));
    let wrongPredictions = 0;

    predictionsByUserSnapshot.docs.forEach((predictionDoc) => {
      const prediction = predictionDoc.data();
      if (prediction.resultStatus === 'wrong') {
        wrongPredictions += 1;
      }
    });

    await setDoc(
      targetRef,
      {
        uid: userId,
        wrongPredictions,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}
