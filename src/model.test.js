import { describe, it, expect } from 'vitest';
import {
  emptyStage, addVersion, removeCurrentVersion, addNote, applyTemplate, makeItem,
  pageStats, newPageData, fmtDate, normalizePage, percent, countDone, currentVersion
} from './model.js';

describe('versions', () => {
  it('เพิ่มเวอร์ชันแรก: เลือกเวอร์ชันนั้น และเปลี่ยนสถานะจากยังไม่เริ่มเป็นกำลังทำ', () => {
    const s = addVersion(emptyStage(), { id: 'a', imageId: 'img1' });
    expect(s.versions).toHaveLength(1);
    expect(s.versions[0].n).toBe(1);
    expect(s.ver).toBe(1);
    expect(s.status).toBe(1);
  });

  it('เพิ่มเวอร์ชันถัดไปไม่เปลี่ยนสถานะที่ตั้งไว้แล้ว และเลขเวอร์ชันเพิ่มขึ้น', () => {
    let s = addVersion(emptyStage(), { id: 'a' });
    s = { ...s, status: 2 };
    s = addVersion(s, { id: 'b' });
    expect(s.versions.map((v) => v.n)).toEqual([1, 2]);
    expect(s.ver).toBe(2);
    expect(s.status).toBe(2);
  });

  it('ลบเวอร์ชันปัจจุบัน: คืนตัวที่ถูกลบ และเลื่อนตัวเลือกให้ถูก', () => {
    let s = addVersion(addVersion(emptyStage(), { id: 'a' }), { id: 'b' });
    const r = removeCurrentVersion(s);
    expect(r.removed.id).toBe('b');
    expect(r.stage.versions.map((v) => v.id)).toEqual(['a']);
    expect(r.stage.ver).toBe(1);
  });

  it('ลบเวอร์ชันสุดท้ายแล้วสถานะกลับเป็นยังไม่เริ่ม', () => {
    const s = { ...addVersion(emptyStage(), { id: 'a' }), status: 3 };
    const r = removeCurrentVersion(s);
    expect(r.stage.versions).toHaveLength(0);
    expect(r.stage.ver).toBe(0);
    expect(r.stage.status).toBe(0);
  });

  it('ลบจากสเตจที่ไม่มีภาพ ไม่ทำอะไร', () => {
    const r = removeCurrentVersion(emptyStage());
    expect(r.removed).toBeNull();
  });

  it('เลขเวอร์ชันไม่ซ้ำเมื่อลบเวอร์ชันกลาง', () => {
    let s = addVersion(addVersion(addVersion(emptyStage(), { id: 'a' }), { id: 'b' }), { id: 'c' });
    s = { ...s, ver: 2 };
    s = removeCurrentVersion(s).stage;
    expect(s.versions.map((v) => v.n)).toEqual([1, 3]);
    s = addVersion(s, { id: 'd' });
    expect(s.versions.map((v) => v.n)).toEqual([1, 3, 4]);
    expect(currentVersion(s).id).toBe('d');
  });
});

describe('notes', () => {
  it('โน้ตจำเลขเวอร์ชันที่กำลังดูอยู่', () => {
    const s = addVersion(emptyStage(), { id: 'a' });
    const s2 = addNote(s, '  ปุ่มใหญ่ขึ้น  ', 'คุณ', new Date('2026-11-24T10:00:00Z'));
    expect(s2.notes[0]).toMatchObject({ t: 'ปุ่มใหญ่ขึ้น', n: 1, d: '2026-11-24' });
  });
  it('โน้ตตอนยังไม่มีภาพ ไม่มีเลขเวอร์ชัน', () => {
    expect(addNote(emptyStage(), 'x').notes[0].n).toBeNull();
  });
});

describe('templates', () => {
  it('เพิ่มเฉพาะข้อที่ยังไม่มี', () => {
    const items = [makeItem('ฟอร์ม'), makeItem('แผนที่')];
    const out = applyTemplate(items, ['แผนที่', 'เบอร์โทร']);
    expect(out.map((i) => i.text)).toEqual(['ฟอร์ม', 'แผนที่', 'เบอร์โทร']);
    expect(out[0]).toBe(items[0]);
  });
});

describe('stats', () => {
  it('นับขั้นที่อนุมัติ เช็คลิสต์ และกำหนดส่งใกล้สุด', () => {
    const a = newPageData({ name: 'Home', due: '2026-12-05', items: ['x', 'y'] });
    const b = newPageData({ name: 'เมนู', due: '2026-12-01', items: ['z'] });
    a.stages.wireframe.status = 3;
    a.items[0].done = true;
    const st = pageStats([a, b]);
    expect(st).toMatchObject({ pages: 2, approved: 1, stagesAll: 8, done: 1, total: 3 });
    expect(st.soon.name).toBe('เมนู');
  });
  it('ไม่มีหน้าเลย ไม่พัง', () => {
    expect(pageStats([])).toMatchObject({ pages: 0, soon: null });
    expect(percent(0, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
    expect(countDone([])).toBe(0);
  });
});

describe('helpers', () => {
  it('fmtDate', () => {
    expect(fmtDate('')).toBe('—');
    expect(fmtDate('ไม่ใช่วันที่')).toBe('—');
    expect(fmtDate('2026-12-05')).toContain('2026');
  });
  it('normalizePage เติมโครงสร้างที่ขาด', () => {
    const p = normalizePage({ name: 'A', stages: { lofi: { status: 2 } } });
    expect(p.items).toEqual([]);
    expect(p.stages.lofi).toMatchObject({ status: 2, ver: 0, versions: [], notes: [] });
    expect(p.stages.hifi.status).toBe(0);
  });
});
