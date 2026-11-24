// ตรรกะข้อมูลล้วนๆ (ไม่แตะ Firebase) เพื่อให้ทดสอบได้ง่าย

export const STAGES = [
  { key: 'wireframe', short: 'Wireframe', full: 'Wireframe' },
  { key: 'lofi', short: 'Lo-Fi', full: 'Low-Fidelity (Lo-Fi)' },
  { key: 'midfi', short: 'Mid-Fi', full: 'Mid-Fidelity (Mid-Fi)' },
  { key: 'hifi', short: 'Hi-Fi', full: 'High-Fidelity (Hi-Fi)' }
];

export const STATUS = [
  { label: 'ยังไม่เริ่ม', icon: 'empty', color: '#4B5058', bg: '#ECEAE4' },
  { label: 'กำลังทำ', icon: 'half', color: '#8A4B00', bg: '#FFF0D6' },
  { label: 'รอรีวิว', icon: 'review', color: '#2C4BB8', bg: '#E6ECFF' },
  { label: 'อนุมัติแล้ว', icon: 'check', color: '#1B6B3A', bg: '#E3F4E8' }
];

export const BUILTIN_TEMPLATES = [
  { id: 'b-home', name: 'หน้า Home มาตรฐาน', items: ['Hero banner + ข้อความหลัก', 'ปุ่ม CTA หลัก', 'เมนูนำทาง (Header)', 'ส่วนจุดเด่น 3 ข้อ', 'รีวิวจากลูกค้า', 'Footer + ลิงก์ติดต่อ'] },
  { id: 'b-list', name: 'หน้ารายการสินค้า / บริการ', items: ['ตัวกรอง / ค้นหา', 'การ์ดสินค้า + ราคา', 'ปุ่มเรียงลำดับ', 'Pagination', 'สถานะไม่มีผลลัพธ์'] },
  { id: 'b-contact', name: 'หน้าติดต่อ / ฟอร์ม', items: ['ฟอร์ม + ข้อความ error', 'แผนที่', 'เบอร์โทร / อีเมล', 'หน้าขอบคุณหลังส่งฟอร์ม'] }
];

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeItem(text) {
  return { id: newId(), text: String(text).trim(), done: false, note: '' };
}

export function emptyStage() {
  return { status: 0, ver: 0, versions: [], notes: [] };
}

export function emptyStages() {
  return Object.fromEntries(STAGES.map((s) => [s.key, emptyStage()]));
}

export function newPageData({ name, path = '/', owner = '', due = '', figma = '', items = [], order = Date.now() }) {
  return { name: name.trim(), path, owner, due, figma, order, items: items.map(makeItem), stages: emptyStages() };
}

export function countDone(items) {
  return items.filter((i) => i.done).length;
}

export function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function currentVersion(stage) {
  return stage.versions[stage.ver - 1] || null;
}

// เพิ่มภาพเวอร์ชันใหม่ และเลือกเวอร์ชันนั้นทันที ถ้ายังไม่เริ่มให้เปลี่ยนเป็น "กำลังทำ"
export function addVersion(stage, version) {
  const n = stage.versions.reduce((m, v) => Math.max(m, v.n || 0), 0) + 1;
  const versions = [...stage.versions, { ...version, n }];
  return { ...stage, versions, ver: versions.length, status: stage.status === 0 ? 1 : stage.status };
}

// ลบเวอร์ชันที่กำลังดูอยู่ คืน { stage, removed } เพื่อให้ผู้เรียกลบไฟล์ภาพต่อ
export function removeCurrentVersion(stage) {
  const removed = currentVersion(stage);
  if (!removed) return { stage, removed: null };
  const versions = stage.versions.filter((v) => v !== removed);
  const ver = Math.min(stage.ver, versions.length);
  return { stage: { ...stage, versions, ver, status: versions.length ? stage.status : 0 }, removed };
}

export function addNote(stage, text, who = 'คุณ', now = new Date()) {
  const cur = currentVersion(stage);
  const note = { id: newId(), t: text.trim(), w: who, d: now.toISOString().slice(0, 10), n: cur ? cur.n : null };
  return { ...stage, notes: [...stage.notes, note] };
}

// เพิ่มเฉพาะข้อที่ยังไม่มี (เทียบจากข้อความ)
export function applyTemplate(items, templateItems) {
  const have = new Set(items.map((i) => i.text));
  const added = templateItems.filter((t) => !have.has(t)).map(makeItem);
  return [...items, ...added];
}

export function pageStats(pages) {
  let approved = 0;
  let stagesAll = 0;
  let done = 0;
  let total = 0;
  for (const p of pages) {
    for (const s of STAGES) {
      stagesAll += 1;
      if (p.stages[s.key].status === 3) approved += 1;
    }
    done += countDone(p.items);
    total += p.items.length;
  }
  const withDue = pages.filter((p) => p.due).sort((a, b) => (a.due < b.due ? -1 : 1));
  return { pages: pages.length, approved, stagesAll, done, total, soon: withDue[0] || null };
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric' });
}

// เติมโครงสร้างที่ขาด (กันข้อมูลเก่า/ไม่ครบทำให้แอพพัง)
export function normalizePage(raw) {
  const stages = emptyStages();
  for (const s of STAGES) {
    const r = (raw.stages && raw.stages[s.key]) || {};
    stages[s.key] = {
      status: r.status ?? 0,
      ver: r.ver ?? 0,
      versions: r.versions ?? [],
      notes: r.notes ?? []
    };
  }
  return { ...raw, name: raw.name ?? '', path: raw.path ?? '/', owner: raw.owner ?? '', due: raw.due ?? '', figma: raw.figma ?? '', items: raw.items ?? [], stages };
}
