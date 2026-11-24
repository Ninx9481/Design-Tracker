import { useEffect, useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref as sref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, IMAGE_STORE } from './firebase.js';
import { newId } from './model.js';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // ไฟล์ต้นทางไม่เกิน 15 MB
const MAX_WIDTH = 1600;
const MAX_CHARS = 880000; // เอกสาร Firestore จำกัด 1 MiB เผื่อ field อื่นไว้

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('เปิดไฟล์ภาพนี้ไม่ได้ (รองรับ PNG, JPG, WebP)')); };
    img.src = url;
  });
}

// ย่อภาพให้กว้างไม่เกิน 1600px แล้วลดคุณภาพ/ขนาดทีละขั้นจนพอดีกับขนาดเอกสาร Firestore
export async function compressToDataUrl(file) {
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_WIDTH / img.width);
  let quality = 0.86;
  for (let i = 0; i < 14; i += 1) {
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= MAX_CHARS) return { data, w, h };
    if (quality > 0.6) quality -= 0.1;
    else scale *= 0.85;
  }
  throw new Error('ภาพใหญ่เกินไป ลองย่อภาพก่อนอัพโหลด หรือเปลี่ยนไปใช้โหมด storage');
}

// คืนฟิลด์ที่ต้องเก็บไว้ในเวอร์ชัน: { imageId } หรือ { path }
export async function saveImage(uid, file) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('รองรับเฉพาะไฟล์ PNG, JPG, WebP');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('ไฟล์ใหญ่เกิน 15 MB');
  const id = newId();
  if (IMAGE_STORE === 'storage') {
    const safe = file.name.replace(/[^\w.-]+/g, '_');
    const path = `users/${uid}/images/${id}-${safe}`;
    await uploadBytes(sref(storage, path), file, { contentType: file.type });
    return { path };
  }
  const { data, w, h } = await compressToDataUrl(file);
  await setDoc(doc(db, 'users', uid, 'images', id), { data, w, h, createdAt: Date.now() });
  return { imageId: id };
}

export async function deleteVersionImage(uid, version) {
  if (version.path && storage) await deleteObject(sref(storage, version.path));
  else if (version.imageId) await deleteDoc(doc(db, 'users', uid, 'images', version.imageId));
}

const cache = new Map();

async function loadUrl(uid, version) {
  const key = version.path || version.imageId;
  if (cache.has(key)) return cache.get(key);
  let url;
  if (version.path) {
    url = await getDownloadURL(sref(storage, version.path));
  } else {
    const snap = await getDoc(doc(db, 'users', uid, 'images', version.imageId));
    if (!snap.exists()) throw new Error('ไม่พบภาพ');
    url = snap.data().data;
  }
  cache.set(key, url);
  return url;
}

export function useImageUrl(uid, version) {
  const key = version ? version.path || version.imageId : null;
  const [state, setState] = useState({ key: null, url: null, error: false });
  useEffect(() => {
    if (!version) return undefined;
    let alive = true;
    loadUrl(uid, version)
      .then((url) => { if (alive) setState({ key, url, error: false }); })
      .catch(() => { if (alive) setState({ key, url: null, error: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key]);
  if (!version || state.key !== key) return { url: null, error: false };
  return state;
}
