import {
  collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, writeBatch, query, orderBy
} from 'firebase/firestore';
import { db } from './firebase.js';
import { STAGES, normalizePage } from './model.js';
import { deleteVersionImage } from './images.js';

// โครงสร้าง: users/{uid}/projects/{pid}/pages/{gid}, users/{uid}/templates/{tid}, users/{uid}/images/{id}
const col = (uid, ...path) => collection(db, 'users', uid, ...path);
const ref = (uid, ...path) => doc(db, 'users', uid, ...path);

export function watchProjects(uid, onData, onError) {
  const q = query(col(uid, 'projects'), orderBy('createdAt'));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function watchPages(uid, pid, onData, onError) {
  const q = query(col(uid, 'projects', pid, 'pages'), orderBy('order'));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => normalizePage({ id: d.id, ...d.data() }))), onError);
}

export function watchTemplates(uid, onData, onError) {
  const q = query(col(uid, 'templates'), orderBy('createdAt'));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function createProject(uid, { name, sub }) {
  const r = await addDoc(col(uid, 'projects'), { name: name.trim(), sub: (sub || '').trim(), createdAt: Date.now() });
  return r.id;
}

export function updateProject(uid, pid, patch) {
  return updateDoc(ref(uid, 'projects', pid), patch);
}

export async function createPage(uid, pid, data) {
  const r = await addDoc(col(uid, 'projects', pid, 'pages'), data);
  return r.id;
}

export function savePage(uid, pid, gid, data) {
  const { id, ...rest } = data; // eslint-disable-line no-unused-vars
  return setDoc(ref(uid, 'projects', pid, 'pages', gid), rest);
}

function versionsOf(page) {
  return STAGES.flatMap((s) => (page.stages?.[s.key]?.versions) || []);
}

export async function deletePage(uid, pid, page) {
  await Promise.all(versionsOf(page).map((v) => deleteVersionImage(uid, v).catch(() => {})));
  await deleteDoc(ref(uid, 'projects', pid, 'pages', page.id));
}

export async function deleteProject(uid, pid) {
  const snap = await getDocs(col(uid, 'projects', pid, 'pages'));
  const pages = snap.docs.map((d) => normalizePage({ id: d.id, ...d.data() }));
  await Promise.all(pages.flatMap((p) => versionsOf(p).map((v) => deleteVersionImage(uid, v).catch(() => {}))));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref(uid, 'projects', pid));
  await batch.commit();
}

export function saveTemplate(uid, name, items) {
  return addDoc(col(uid, 'templates'), { name: name.trim(), items, createdAt: Date.now() });
}

export function deleteTemplate(uid, tid) {
  return deleteDoc(ref(uid, 'templates', tid));
}
