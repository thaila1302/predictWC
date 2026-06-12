import { createHash } from 'node:crypto';
import { collection, getDocs, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { db } from './_firebase.js';

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export function hashPassword(password) {
  return createHash('sha256').update(String(password || ''), 'utf8').digest('hex');
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

export function assertPost(request, response) {
  if (request.method === 'POST') return true;

  sendJson(response, 405, { success: false, error: 'Method not allowed' });
  return false;
}

function getUserUnitId(user) {
  return user?.unitId || 'default';
}

export async function findUserByIdentifier(identifier, unitId = 'default') {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  const usersCollection = collection(db, 'users');
  const emailQuery = query(usersCollection, where('email', '==', normalized));
  const emailSnapshot = await getDocs(emailQuery);
  const emailDoc = emailSnapshot.docs.find((item) => getUserUnitId(item.data()) === unitId);
  if (emailDoc) {
    const userDoc = emailDoc;
    return { id: userDoc.id, ...userDoc.data() };
  }

  const usernameQuery = query(usersCollection, where('usernameLower', '==', normalized));
  const usernameSnapshot = await getDocs(usernameQuery);
  const usernameDoc = usernameSnapshot.docs.find((item) => getUserUnitId(item.data()) === unitId);
  if (!usernameDoc) return null;

  const userDoc = usernameDoc;
  return { id: userDoc.id, ...userDoc.data() };
}

export async function sendResetEmail({ to, code }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const from = process.env.RESET_EMAIL_FROM || gmailUser;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  return transporter.sendMail({
    from,
    to,
    subject: 'Mã xác nhận đổi mật khẩu PredictWC',
    html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>PredictWC</h2>
          <p>Mã xác nhận đổi mật khẩu của bạn là:</p>
          <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0f172a;color:#fff;font-size:28px;font-weight:700;letter-spacing:6px">
            ${code}
          </div>
          <p>Mã có hiệu lực trong 10 phút.</p>
          <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `
  });
}
