import { STAGES, currentVersion, countDone, percent, addNote as addNoteTo } from '../model.js';
import { StatusChip, VersionImage, EditableText, Avatar } from './common.jsx';
import StagePanel from './StagePanel.jsx';
import Checklist from './Checklist.jsx';

function figmaHref(v) {
  if (!v) return null;
  const t = v.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

export default function PageView({
  uid, project, page, view, setView, onPatch, onMutate, onUpload, onRemoveVersion, uploading,
  customTemplates, onSaveTemplate, onDeleteTemplate, onRename, onDelete
}) {
  const stageIdx = view.stageIdx;
  const def = STAGES[stageIdx];
  const done = countDone(page.items);
  const href = figmaHref(page.figma);

  const mutateStage = (fn) => onMutate((d) => { d.stages[def.key] = fn(d.stages[def.key]); });

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div className="stack" style={{ gap: 10, minWidth: 0 }}>
          <div className="muted" style={{ fontSize: 13 }}>{project.name} / หน้าเว็บ</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{page.name}</h1>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="pill" style={{ paddingLeft: 6 }}>
              <Avatar name={page.owner} size={24} />
              <EditableText className="input-sm" style={{ width: 130, border: '1px solid transparent' }} value={page.owner} placeholder="ผู้รับผิดชอบ" label="ผู้รับผิดชอบ" onSave={(v) => onPatch({ owner: v.trim() })} />
            </span>
            <span className="pill">
              ส่ง
              <EditableText className="input-sm" type="date" style={{ width: 150, border: '1px solid transparent' }} value={page.due} label="กำหนดส่ง" onSave={(v) => onPatch({ due: v })} />
            </span>
            <span className="pill" style={{ paddingRight: 6 }}>
              Figma
              <EditableText className="input-sm" style={{ width: 220, border: '1px solid transparent' }} value={page.figma} placeholder="วางลิงก์ Figma" label="ลิงก์ Figma" onSave={(v) => onPatch({ figma: v.trim() })} />
              {href ? <a className="btn btn-soft row" style={{ minHeight: 28, padding: '0 12px', fontSize: 12, textDecoration: 'none' }} href={href} target="_blank" rel="noopener noreferrer">เปิด</a> : null}
            </span>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn" style={{ minHeight: 36, fontSize: 13 }} onClick={onRename}>เปลี่ยนชื่อหน้า</button>
            <button className="btn btn-danger" style={{ minHeight: 36, fontSize: 13 }} onClick={onDelete}>ลบหน้านี้</button>
          </div>
        </div>
        <div className="stack" style={{ gap: 8, minWidth: 220 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, color: '#3f434a' }}><span>เช็คลิสต์ของหน้านี้</span><strong>{done}/{page.items.length} ข้อ</strong></div>
          <div className="bar"><span style={{ width: `${percent(done, page.items.length)}%` }} /></div>
        </div>
      </div>

      <div className="row wrap" style={{ justifyContent: 'space-between', gap: 12 }}>
        <div className="row wrap" style={{ gap: 10, flex: '1 1 520px', alignItems: 'stretch' }}>
          {STAGES.map((s, j) => (
            <button key={s.key} className="stage-tab" aria-pressed={j === stageIdx && view.mode === 'single'} onClick={() => setView({ ...view, stageIdx: j, mode: 'single' })}>
              <span className="muted" style={{ fontSize: 12 }}>ขั้นที่ {j + 1}</span>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{s.short}</span>
              <span style={{ alignSelf: 'flex-start' }}><StatusChip status={page.stages[s.key].status} /></span>
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="โหมดการดู">
          <button aria-pressed={view.mode === 'single'} onClick={() => setView({ ...view, mode: 'single' })}>ดูทีละขั้น</button>
          <button aria-pressed={view.mode === 'compare'} onClick={() => setView({ ...view, mode: 'compare' })}>เทียบทั้ง 4 ขั้น</button>
        </div>
      </div>

      <div className="row wrap" style={{ gap: 22, alignItems: 'flex-start' }}>
        {view.mode === 'single' ? (
          <StagePanel
            uid={uid} page={page} stageIdx={stageIdx} uploading={uploading}
            onSetStatus={(k) => mutateStage((s) => ({ ...s, status: k }))}
            onSetVer={(n) => mutateStage((s) => ({ ...s, ver: n }))}
            onUpload={(file) => onUpload(def.key, file)}
            onRemove={() => onRemoveVersion(def.key)}
            onAddNote={(t) => onMutate((d) => { d.stages[def.key] = addNoteTo(d.stages[def.key], t); })}
          />
        ) : (
          <section className="card stack" style={{ flex: '1 1 100%', minWidth: 0, gap: 16 }}>
            <div className="stack" style={{ gap: 2 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>เทียบ 4 ขั้นของหน้า {page.name}</h2>
              <div className="muted" style={{ fontSize: 13 }}>แสดงเวอร์ชันที่เลือกไว้ของแต่ละขั้น กด "เปิดดูขั้นนี้" เพื่อดูเต็มและแก้ไข</div>
            </div>
            <div className="cmp-grid">
              {STAGES.map((s, j) => {
                const st = page.stages[s.key];
                const cur = currentVersion(st);
                return (
                  <div className="cmp-card" key={s.key}>
                    <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{s.short}{cur ? ` · v${cur.n}` : ''}</div>
                      <StatusChip status={st.status} />
                    </div>
                    {cur ? <div className="img-frame"><VersionImage uid={uid} version={cur} alt={`${page.name} ${s.short}`} /></div> : <div className="cmp-empty">ยังไม่มีภาพ</div>}
                    <button className="btn" onClick={() => setView({ ...view, stageIdx: j, mode: 'single' })}>เปิดดูขั้นนี้</button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <Checklist
          page={page}
          onChangeItems={(items) => onPatch({ items })}
          customTemplates={customTemplates}
          onSaveTemplate={onSaveTemplate}
          onDeleteTemplate={onDeleteTemplate}
        />
      </div>
    </div>
  );
}
