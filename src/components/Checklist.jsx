import { useState } from 'react';
import { makeItem, applyTemplate, BUILTIN_TEMPLATES } from '../model.js';
import { Icon } from './common.jsx';

export default function Checklist({ page, onChangeItems, customTemplates, onSaveTemplate, onDeleteTemplate }) {
  const [text, setText] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState('');
  const [tplOpen, setTplOpen] = useState(false);

  const add = () => {
    if (!text.trim()) return;
    onChangeItems([...page.items, makeItem(text)]);
    setText('');
  };
  const patch = (id, fn) => onChangeItems(page.items.map((i) => (i.id === id ? fn(i) : i)));
  const remove = (id) => onChangeItems(page.items.filter((i) => i.id !== id));

  const saveCurrentAsTemplate = () => {
    if (page.items.length === 0) { window.alert('เช็คลิสต์ยังว่างอยู่'); return; }
    const name = window.prompt('ตั้งชื่อเทมเพลต', `${page.name} ของฉัน`);
    if (name && name.trim()) onSaveTemplate(name, page.items.map((i) => i.text));
  };

  const templates = [...BUILTIN_TEMPLATES.map((t) => ({ ...t, custom: false })), ...customTemplates.map((t) => ({ ...t, custom: true }))];

  return (
    <section className="card stack" style={{ flex: '1 1 340px', minWidth: 0, gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div className="stack" style={{ gap: 2 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>เช็คลิสต์: สิ่งที่หน้า {page.name} ต้องมี</h2>
          <div className="muted" style={{ fontSize: 13 }}>กำหนดข้อเองได้ ติ๊กเมื่อออกแบบครบแล้ว</div>
        </div>
        <button className="btn btn-soft" style={{ flexShrink: 0, fontSize: 13 }} aria-expanded={tplOpen} onClick={() => setTplOpen(!tplOpen)}>ใช้เทมเพลต</button>
      </div>

      {tplOpen && (
        <div className="tpl-panel">
          <div style={{ fontSize: 13, fontWeight: 600 }}>เลือกชุดเช็คลิสต์ (เพิ่มเฉพาะข้อที่ยังไม่มี)</div>
          {templates.map((t) => (
            <div className="tpl-row" key={t.id}>
              <button className="tpl-main" onClick={() => { onChangeItems(applyTemplate(page.items, t.items)); setTplOpen(false); }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{t.items.length} ข้อ{t.custom ? ' · ของฉัน' : ''}</span>
              </button>
              {t.custom && (
                <button className="btn-icon" aria-label={`ลบเทมเพลต ${t.name}`} onClick={() => { if (window.confirm(`ลบเทมเพลต "${t.name}" ?`)) onDeleteTemplate(t.id); }}><Icon name="x" /></button>
              )}
            </div>
          ))}
          <button className="btn btn-dashed" style={{ fontSize: 13 }} onClick={saveCurrentAsTemplate}>บันทึกเช็คลิสต์ปัจจุบันเป็นเทมเพลต</button>
        </div>
      )}

      {page.items.length === 0 && <div className="muted" style={{ fontSize: 14 }}>ยังไม่มีข้อในเช็คลิสต์ พิมพ์ข้อแรกด้านล่าง หรือกด "ใช้เทมเพลต"</div>}

      <ul className="stack" style={{ gap: 4 }}>
        {page.items.map((it) => (
          <li key={it.id} className={`item ${it.done ? 'done' : ''}`}>
            <div className="item-main">
              <label className="item-label">
                <input type="checkbox" checked={it.done} onChange={() => patch(it.id, (i) => ({ ...i, done: !i.done }))} />
                <span>{it.text}</span>
              </label>
              <button className="btn-icon" style={{ color: it.note ? '#8a4b00' : undefined }} aria-label={`โน้ตของข้อ ${it.text}`} onClick={() => { setEditId(editId === it.id ? null : it.id); setDraft(it.note || ''); }}><Icon name="note" /></button>
              <button className="btn-icon" aria-label={`ลบข้อ ${it.text}`} onClick={() => remove(it.id)}><Icon name="x" /></button>
            </div>
            {it.note && editId !== it.id && <div className="item-note">{it.note}</div>}
            {editId === it.id && (
              <div className="item-edit">
                <input
                  className="input input-sm" style={{ flex: 1 }} value={draft} placeholder="โน้ตของข้อนี้" aria-label="โน้ตของข้อนี้" autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { patch(it.id, (i) => ({ ...i, note: draft.trim() })); setEditId(null); } }}
                />
                <button className="btn btn-primary" style={{ minHeight: 36, fontSize: 13 }} onClick={() => { patch(it.id, (i) => ({ ...i, note: draft.trim() })); setEditId(null); }}>บันทึก</button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="row" style={{ gap: 8, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <input className="input" style={{ flex: 1 }} value={text} placeholder="เพิ่มข้อใหม่ เช่น ปุ่มค้นหา" aria-label="ข้อใหม่ในเช็คลิสต์" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button className="btn btn-dark" onClick={add}>เพิ่ม</button>
      </div>
    </section>
  );
}
