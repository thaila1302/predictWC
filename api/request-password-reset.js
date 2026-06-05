import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './_firebase.js';
import { assertPost, findUserByIdentifier, generateCode, normalizeIdentifier, sendJson, sendResetEmail } from './_utils.js';

const RESET_TTL_MS = 10 * 60 * 1000;

export default async function handler(request, response) {
  if (!assertPost(request, response)) return;

  try {
    const identifier = normalizeIdentifier(request.body?.identifier);
    if (!identifier) {
      sendJson(response, 400, { success: false, error: 'Vui lòng nhập email hoặc tài khoản.' });
      return;
    }

    const user = await findUserByIdentifier(identifier);
    if (!user?.uid) {
      sendJson(response, 404, { success: false, error: 'Không tìm thấy tài khoản hoặc email này.' });
      return;
    }

    if (!user.email) {
      sendJson(response, 400, { success: false, error: 'Tài khoản này chưa có email để nhận mã xác nhận.' });
      return;
    }

    const code = generateCode();
    await setDoc(
      doc(db, 'passwordResets', user.uid),
      {
        userId: user.uid,
        email: user.email,
        code,
        expiresAt: Date.now() + RESET_TTL_MS,
        used: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await sendResetEmail({ to: user.email, code });

    sendJson(response, 200, { success: true });
  } catch (error) {
    console.error('request-password-reset failed:', error);
    sendJson(response, 500, { success: false, error: 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.' });
  }
}
