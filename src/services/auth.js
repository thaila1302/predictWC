import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { hashPassword } from '../lib/password';
import { DEFAULT_UNIT_ID, SECONDARY_UNIT_ID } from '../context/UnitContext';

const LEGACY_LOCAL_ACCOUNTS_KEY = 'predictwc_local_accounts';
const LEGACY_AUTH_SESSION_KEY = 'predictwc_auth_session';
const PRIMARY_ADMIN_NAME = 'Lê Anh Thái';

function createUid() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}`;
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPrimaryAdminDisplayName(displayName) {
  return String(displayName || '').trim() === PRIMARY_ADMIN_NAME;
}

function getAccountUnitId(account) {
  return account?.unitId || DEFAULT_UNIT_ID;
}

function toSessionUser(account) {
  return {
    uid: account.uid,
    displayName: account.displayName,
    username: account.username,
    email: account.email || '',
    unitId: getAccountUnitId(account),
    isAdmin: Boolean(account.isAdmin),
    isLocked: Boolean(account.isLocked)
  };
}

async function findAccountByUsername(username, unitId) {
  const usernameLower = normalizeUsername(username);
  const q = query(collection(db, 'users'), where('usernameLower', '==', usernameLower));
  const snapshot = await getDocs(q);
  const item = snapshot.docs.find((candidate) => getAccountUnitId(candidate.data()) === unitId);
  if (!item) return null;

  return { id: item.id, ...item.data() };
}

async function hasAccountsInUnit(unitId) {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.some((item) => getAccountUnitId(item.data()) === unitId);
}

async function upsertUserAccount(account, preserveTimestamps = true) {
  const userRef = doc(db, 'users', account.uid);

  await setDoc(
    userRef,
    {
      uid: account.uid,
      displayName: account.displayName,
      username: account.username,
      usernameLower: normalizeUsername(account.username),
      passwordHash: account.passwordHash,
      email: account.email || '',
      unitId: getAccountUnitId(account),
      photoURL: account.photoURL || '',
      wrongPredictions: account.wrongPredictions || 0,
      lostMoney: account.lostMoney || 0,
      isAdmin: Boolean(account.isAdmin),
      isLocked: Boolean(account.isLocked),
      updatedAt: serverTimestamp(),
      ...(preserveTimestamps ? { createdAt: account.createdAt || serverTimestamp() } : {})
    },
    { merge: true }
  );
}

export async function migrateLegacyLocalAccountsToFirestore(unitId = DEFAULT_UNIT_ID) {
  if (typeof window === 'undefined' || !db || unitId !== DEFAULT_UNIT_ID) return;

  try {
    const raw = window.localStorage.getItem(LEGACY_LOCAL_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
      return;
    }

    for (const account of parsed) {
      const displayName = String(account?.displayName || '').trim();
      const username = String(account?.username || '').trim();
      const passwordHash = String(account?.passwordHash || '');
      if (!displayName || !username || !passwordHash) continue;

      const existing = await findAccountByUsername(username, unitId);
      if (existing) continue;

      const uid = account?.uid || createUid();
      await upsertUserAccount(
        {
          uid,
          displayName,
          username,
          usernameLower: normalizeUsername(username),
          passwordHash,
          unitId,
          wrongPredictions: account?.wrongPredictions || 0,
          lostMoney: account?.lostMoney || 0,
          isAdmin: isPrimaryAdminDisplayName(displayName) ? true : Boolean(account?.isAdmin),
          isLocked: isPrimaryAdminDisplayName(displayName) ? false : Boolean(account?.isLocked),
          createdAt: account?.createdAt || serverTimestamp()
        },
        true
      );
    }
  } catch {
  } finally {
    window.localStorage.removeItem(LEGACY_LOCAL_ACCOUNTS_KEY);
    window.localStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
  }
}

export function subscribeAccountByUid(uid, callback) {
  if (!uid || !db) return () => {};

  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({ id: snapshot.id, ...snapshot.data(), unitId: getAccountUnitId(snapshot.data()) });
  });
}

export async function updateUserAccess(uid, updates) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function updateUserUnit(uid, unitId) {
  if (!uid) {
    throw new Error('Không tìm thấy tài khoản.');
  }

  if (![DEFAULT_UNIT_ID, SECONDARY_UNIT_ID].includes(unitId)) {
    throw new Error('Đơn vị không hợp lệ.');
  }

  const userRef = doc(db, 'users', uid);
  const userSnapshot = await getDoc(userRef);
  if (!userSnapshot.exists()) {
    throw new Error('Không tìm thấy tài khoản.');
  }

  const user = userSnapshot.data();
  if (getAccountUnitId(user) === unitId) return;

  const matchingUsernameSnapshot = await getDocs(
    query(collection(db, 'users'), where('usernameLower', '==', normalizeUsername(user.username)))
  );
  const hasUsernameConflict = matchingUsernameSnapshot.docs.some(
    (item) => item.id !== uid && getAccountUnitId(item.data()) === unitId
  );
  if (hasUsernameConflict) {
    throw new Error('Đơn vị đích đã có tài khoản sử dụng username này.');
  }

  const predictionsSnapshot = await getDocs(query(collection(db, 'predictions'), where('userId', '==', uid)));
  const writes = [
    {
      ref: userRef,
      data: { unitId, updatedAt: serverTimestamp() }
    },
    ...predictionsSnapshot.docs.map((predictionDoc) => ({
      ref: predictionDoc.ref,
      data: { unitId, updatedAt: serverTimestamp() }
    }))
  ];

  for (let index = 0; index < writes.length; index += 450) {
    const batch = writeBatch(db);
    writes.slice(index, index + 450).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
  }
}

export async function updateUserDisplayName(uid, displayName) {
  const trimmedDisplayName = String(displayName || '').trim();

  if (!uid) {
    throw new Error('Không tìm thấy tài khoản.');
  }

  if (trimmedDisplayName.length < 2) {
    throw new Error('Tên hiển thị phải có ít nhất 2 ký tự.');
  }

  if (trimmedDisplayName.length > 50) {
    throw new Error('Tên hiển thị không được vượt quá 50 ký tự.');
  }

  await updateDoc(doc(db, 'users', uid), {
    displayName: trimmedDisplayName,
    updatedAt: serverTimestamp()
  });
}

export async function registerWithUsername({ displayName, email, username, password, unitId = DEFAULT_UNIT_ID }) {
  const trimmedDisplayName = String(displayName || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedUsername = String(username || '').trim();

  if (!trimmedDisplayName) {
    throw new Error('Vui long nhap ho va ten.');
  }

  if (!normalizedEmail) {
    throw new Error('Vui long nhap email.');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Email khong hop le.');
  }

  if (!trimmedUsername) {
    throw new Error('Vui long nhap tai khoan.');
  }

  if (!password) {
    throw new Error('Vui long nhap mat khau.');
  }

  const existingAccount = await findAccountByUsername(trimmedUsername, unitId);
  if (existingAccount) {
    throw new Error('Tai khoan da ton tai.');
  }

  const uid = createUid();
  const passwordHash = await hashPassword(password);
  const isFirstUnitAccount = unitId !== DEFAULT_UNIT_ID && !(await hasAccountsInUnit(unitId));
  const nextAccount = {
    uid,
    displayName: trimmedDisplayName,
    email: normalizedEmail,
    username: trimmedUsername,
    usernameLower: normalizeUsername(trimmedUsername),
    passwordHash,
    unitId,
    wrongPredictions: 0,
    lostMoney: 0,
    isAdmin: isPrimaryAdminDisplayName(trimmedDisplayName) || isFirstUnitAccount,
    isLocked: false,
    createdAt: serverTimestamp()
  };

  await upsertUserAccount(nextAccount, true);

  return toSessionUser(nextAccount);
}

export async function loginWithUsername({ username, password, unitId = DEFAULT_UNIT_ID }) {
  const trimmedUsername = String(username || '').trim();

  if (!trimmedUsername || !password) {
    throw new Error('Vui lòng nhập tài khoản và mật khẩu.');
  }

  const account = await findAccountByUsername(trimmedUsername, unitId);
  if (!account) {
    throw new Error('Tài khoản hoặc mật khẩu không đúng.');
  }

  if (account.isLocked) {
    throw new Error('Tài khoản này đang bị khóa.');
  }

  const passwordHash = await hashPassword(password);
  if (account.passwordHash !== passwordHash) {
    throw new Error('Tài khoản hoặc mật khẩu không đúng.');
  }

  await upsertUserAccount(account, false);
  return toSessionUser(account);
}
