import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './_firebase.js';
import { assertPost, findUserByIdentifier, hashPassword, normalizeIdentifier, sendJson } from './_utils.js';

export default async function handler(request, response) {
  if (!assertPost(request, response)) return;

  try {
    const identifier = normalizeIdentifier(request.body?.identifier);
    const unitId = String(request.body?.unitId || 'default');
    const code = String(request.body?.code || '').trim();
    const newPassword = String(request.body?.newPassword || '');

    if (!identifier || !code || !newPassword) {
      sendJson(response, 400, { success: false, error: 'Vui long nhap day du thong tin.' });
      return;
    }

    const user = await findUserByIdentifier(identifier, unitId);
    if (!user?.uid) {
      sendJson(response, 400, { success: false, error: 'Ma xac nhan khong dung.' });
      return;
    }

    const resetRef = doc(db, 'passwordResets', user.uid);
    const resetSnapshot = await getDoc(resetRef);
    if (!resetSnapshot.exists()) {
      sendJson(response, 400, { success: false, error: 'Ma xac nhan khong dung.' });
      return;
    }

    const reset = resetSnapshot.data();
    if (
      reset.used ||
      (reset.unitId || 'default') !== unitId ||
      reset.code !== code ||
      Number(reset.expiresAt || 0) < Date.now()
    ) {
      sendJson(response, 400, { success: false, error: 'Ma xac nhan khong dung hoac da het han.' });
      return;
    }

    await setDoc(
      doc(db, 'users', user.uid),
      {
        passwordHash: hashPassword(newPassword),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await updateDoc(resetRef, {
      used: true,
      updatedAt: serverTimestamp()
    });

    sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('confirm-password-reset failed:', error);
    sendJson(response, 500, { success: false, error: 'Khong the doi mat khau.' });
  }
}
