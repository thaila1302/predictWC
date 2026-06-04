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
        const correctDiff = (right.correctPredictions || 0) - (left.correctPredictions || 0);
        if (correctDiff !== 0) return correctDiff;
        return (left.wrongPredictions || 0) - (right.wrongPredictions || 0);
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
  if (predictionsSnapshot.empty) return;

  const affectedUserIds = new Set();
  const batch = writeBatch(db);

  predictionsSnapshot.docs.forEach((predictionDoc) => {
    const prediction = predictionDoc.data();
    const nextResultStatus =
      computedWinner && payload.status === 'finished'
        ? prediction.predictedResult === computedWinner
          ? 'correct'
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

  await batch.commit();

  for (const userId of affectedUserIds) {
    const targetRef = doc(db, 'users', userId);
    const predictionsByUserSnapshot = await getDocs(query(collection(db, 'predictions'), where('userId', '==', userId)));
    let correctPredictions = 0;
    let wrongPredictions = 0;

    predictionsByUserSnapshot.docs.forEach((predictionDoc) => {
      const prediction = predictionDoc.data();
      if (prediction.resultStatus === 'correct') {
        correctPredictions += 1;
      } else if (prediction.resultStatus === 'wrong') {
        wrongPredictions += 1;
      }
    });

    await setDoc(
      targetRef,
      {
        uid: userId,
        correctPredictions,
        wrongPredictions,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}
