import { useRef, useState } from 'react';
import { STAGES, STATUS, currentVersion, fmtDate } from '../model.js';
import { VersionImage, Avatar, Icon, StatusIcon } from './common.jsx';

export default function StagePanel({ uid, page, stageIdx, onSetStatus, onSetVer, onUpload, onRemove, onAddNote, uploading }) {
  const def = STAGES[stageIdx];
  const stage = page.stages[def.key];
  const cur = currentVersion(stage);
  const fileRef = useRef(null);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState('');

  const pick = (files) => {
    const f = files && files[0];
    if (f) onUpload(f);
  };
  const sendNote = () => {
    if (!note.trim()) return;
    onAddNote(note);
    setNote('');
  };

  return (
    <section className="card stack" style={{ flex: '1.7 1 440px', minWidth: 0, gap: 18 }}>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />

      <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div className="stack" style={{ gap: 2 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{def.full}</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            {cur ? `${page.name} · ${def.short} · เวอร์ชัน v${cur.n} · ${cur.name || ''}` : 'ยังไม่มีภาพในขั้นนี้'}
          </div>
        </div>
        {cur && (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={onRemove} disabled={uploading}>ลบเวอร์ชันนี้</button>
            <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>{uploading ? 'กำลังอัพโหลด…' : '+ อัพโหลดเวอร์ชันใหม่'}</button>
          </div>
        )}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#3f434a' }}>สถานะของขั้นนี้</div>
        <div className="row wrap" style={{ gap: 8 }} role="group" aria-label="สถานะ">
          {STATUS.map((o, k) => {
            const on = stage.status === k;
            return (
              <button key={o.label} className="status-btn" aria-pressed={on} onClick={() => onSetStatus(k)}
                style={on ? { background: o.bg, borderColor: o.color, color: o.color } : undefined}>
                <StatusIcon name={o.icon} /> {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {cur && (
        <div className="row wrap" style={{ gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#3f434a', marginRight: 4 }}>เวอร์ชัน</div>
          {stage.versions.map((v, i) => (
            <button key={v.id} className="ver-btn" aria-pressed={stage.ver === i + 1} onClick={() => onSetVer(i + 1)}>v{v.n}</button>
          ))}
          <div className="muted" style={{ fontSize: 12, marginLeft: 4 }}>{stage.versions.length > 1 ? 'เลือกเวอร์ชันเพื่อดูภาพเก่า / ใหม่' : 'มีเวอร์ชันเดียว'}</div>
        </div>
      )}

      {!cur && (
        <button
          className={`drop ${over ? 'over' : ''}`}
          disabled={uploading}
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        >
          <Icon name="upload" />
          <span style={{ fontSize: 17, fontWeight: 600 }}>{uploading ? 'กำลังอัพโหลด…' : 'ลากไฟล์มาวาง หรือคลิกเพื่ออัพโหลด'}</span>
          <span className="muted" style={{ fontSize: 13 }}>รองรับ PNG, JPG, WebP</span>
        </button>
      )}

      {cur && (
        <div
          className="img-frame"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}
        >
          <VersionImage uid={uid} version={cur} alt={`${page.name} ${def.short} v${cur.n}`} />
        </div>
      )}

      <div className="stack" style={{ gap: 10, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>โน้ตและคอมเมนต์ของขั้นนี้</div>
        {stage.notes.length === 0 && <div className="muted" style={{ fontSize: 13 }}>ยังไม่มีโน้ต</div>}
        {stage.notes.map((n) => (
          <div className="note" key={n.id}>
            <Avatar name={n.w} />
            <div className="stack" style={{ gap: 2 }}>
              <div className="muted" style={{ fontSize: 12 }}>{n.w} · {fmtDate(n.d)}{n.n ? ` · v${n.n}` : ''}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{n.t}</div>
            </div>
          </div>
        ))}
        <div className="row" style={{ gap: 8 }}>
          <input className="input" style={{ flex: 1 }} value={note} placeholder="เขียนโน้ต เช่น ลูกค้าขอให้ปุ่มใหญ่ขึ้น" aria-label="โน้ตใหม่" onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendNote(); }} />
          <button className="btn btn-dark" onClick={sendNote}>ส่งโน้ต</button>
        </div>
      </div>
    </section>
  );
}
