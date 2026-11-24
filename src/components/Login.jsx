import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';

const MESSAGES = {
  'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
  'auth/user-not-found': 'ไม่พบบัญชีนี้',
  'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน',
  'auth/weak-password': 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)',
  'auth/operation-not-allowed': 'วิธีเข้าสู่ระบบนี้ยังไม่ได้เปิดใน Firebase Console',
  'auth/admin-restricted-operation': 'ปิดการสมัครบัญชีใหม่ไว้แล้ว (ใช้ได้เฉพาะบัญชีที่มีอยู่)',
  'auth/popup-closed-by-user': 'ปิดหน้าต่างล็อกอินก่อนเสร็จ',
  'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้เพิ่มใน Authorized domains ของ Firebase',
  'auth/too-many-requests': 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่'
};

export default function Login() {
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(MESSAGES[e.code] || `เข้าสู่ระบบไม่สำเร็จ (${e.code || e.message})`);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => (mode === 'in'
      ? signInWithEmailAndPassword(auth, email.trim(), password)
      : createUserWithEmailAndPassword(auth, email.trim(), password)));
  };

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>ตัวติดตามงานออกแบบ UX/UI</h1>
          <p className="muted" style={{ fontSize: 14 }}>{mode === 'in' ? 'เข้าสู่ระบบเพื่อดูโปรเจกต์ของคุณ' : 'สร้างบัญชีสำหรับใช้งาน'}</p>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <label className="stack" style={{ gap: 6, fontSize: 14, fontWeight: 600 }}>
          อีเมล
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 6, fontSize: 14, fontWeight: 600 }}>
          รหัสผ่าน
          <input className="input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>{mode === 'in' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</button>
        <button className="btn" type="button" disabled={busy} onClick={() => run(() => signInWithPopup(auth, googleProvider))}>เข้าสู่ระบบด้วย Google</button>
        <button className="btn" type="button" style={{ border: 'none', background: 'transparent', color: '#2c4bb8' }} onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }}>
          {mode === 'in' ? 'ยังไม่มีบัญชี? สร้างบัญชี' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
