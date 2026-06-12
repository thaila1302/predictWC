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
import { getMatchSortTime, getResultFromScores, toDate } from '../lib/utils';
import { DEFAULT_STAKE, getMatchStake } from '../lib/stakes';
import { DEFAULT_UNIT_ID } from '../context/UnitContext';

const PREDICTION_LOCK_OFFSET_MS = 30 * 60 * 1000;

function getItemUnitId(item) {
  return item?.unitId || DEFAULT_UNIT_ID;
}

function wasUserEligibleToPredict(user, match) {
  const createdAt = toDate(user.createdAt);
  const matchTime = getMatchSortTime(match);

  // Preserve existing behavior for legacy users or matches without timestamps.
  if (!createdAt || Number.isNaN(createdAt.getTime()) || !matchTime) return true;

  return createdAt.getTime() <= matchTime - PREDICTION_LOCK_OFFSET_MS;
}

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

export function listenLeaderboard(unitId, callback, includeAllUnits = false) {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((player) => includeAllUnits || getItemUnitId(player) === unitId)
      .filter((player) => player.displayName || player.username || player.email)
      .sort((left, right) => {
        const lostMoneyDiff = (right.lostMoney || 0) - (left.lostMoney || 0);
        if (lostMoneyDiff !== 0) return lostMoneyDiff;
        const wrongDiff = (right.wrongPredictions || 0) - (left.wrongPredictions || 0);
        if (wrongDiff !== 0) return wrongDiff;
        return String(left.displayName || left.username || '').localeCompare(
          String(right.displayName || right.username || '')
        );
      });
    callback(players);
  });
}

export function listenUserPredictions(userId, unitId, callback) {
  const q = query(collection(db, 'predictions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((prediction) => getItemUnitId(prediction) === unitId)
    );
  });
}

export function listenAllPredictions(unitId, callback, includeAllUnits = false) {
  const q = query(collection(db, 'predictions'));
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((prediction) => includeAllUnits || getItemUnitId(prediction) === unitId)
    );
  });
}

export async function savePrediction({ userId, matchId, predictedResult, unitId = DEFAULT_UNIT_ID }) {
  const predictionRef = doc(db, 'predictions', `${userId}_${matchId}`);
  await setDoc(
    predictionRef,
    {
      userId,
      matchId,
      unitId,
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
  const matchStake = getMatchStake(payload);

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
  const matchesSnapshot = await getDocs(collection(db, 'matches'));
  const usersById = new Map(usersSnapshot.docs.map((userDoc) => [userDoc.id, userDoc.data()]));
  const matchesById = new Map(matchesSnapshot.docs.map((matchDoc) => [matchDoc.id, matchDoc.data()]));
  const existingUserIds = new Set(usersSnapshot.docs.map((userDoc) => userDoc.id));
  const affectedUserIds = new Set(existingUserIds);
  const predictedUserIds = new Set();
  const batch = writeBatch(db);

  predictionsSnapshot.docs.forEach((predictionDoc) => {
    const prediction = predictionDoc.data();

    if (!existingUserIds.has(prediction.userId)) {
      batch.delete(predictionDoc.ref);
      return;
    }

    const isFinished = Boolean(computedWinner) && payload.status === 'finished';
    const isInvalidMissedPrediction =
      isFinished && prediction.autoMissed && !wasUserEligibleToPredict(usersById.get(prediction.userId) || {}, payload);

    if (isInvalidMissedPrediction) {
      batch.delete(predictionDoc.ref);
      return;
    }

    predictedUserIds.add(prediction.userId);
    const nextResultStatus =
      isFinished
        ? prediction.predictedResult === computedWinner
          ? 'not_wrong'
          : 'wrong'
        : 'pending';
    const lostAmount = nextResultStatus === 'wrong' ? matchStake : 0;
    batch.set(
      predictionDoc.ref,
      {
        resultStatus: nextResultStatus,
        lostAmount,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    if (existingUserIds.has(prediction.userId)) {
      affectedUserIds.add(prediction.userId);
    }
  });

  if (computedWinner && payload.status === 'finished') {
    usersSnapshot.docs.forEach((userDoc) => {
      const userId = userDoc.id;
      if (predictedUserIds.has(userId) || !wasUserEligibleToPredict(userDoc.data(), payload)) return;

      const missedPredictionRef = doc(db, 'predictions', `${userId}_${matchId}`);
      batch.set(
        missedPredictionRef,
        {
          userId,
          matchId,
          unitId: getItemUnitId(userDoc.data()),
          predictedResult: null,
          resultStatus: 'wrong',
          lostAmount: matchStake,
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
    let lostMoney = 0;

    predictionsByUserSnapshot.docs.forEach((predictionDoc) => {
      const prediction = predictionDoc.data();
      if (prediction.resultStatus === 'wrong') {
        wrongPredictions += 1;
        lostMoney += Number(prediction.lostAmount) || getMatchStake(matchesById.get(prediction.matchId)) || DEFAULT_STAKE;
      }
    });

    await setDoc(
      targetRef,
      {
        uid: userId,
        wrongPredictions,
        lostMoney,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}
