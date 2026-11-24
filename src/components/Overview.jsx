import { STAGES, STATUS, pageStats, percent, countDone, fmtDate } from '../model.js';
import { Avatar, StatusIcon } from './common.jsx';

export default function Overview({ project, pages, onOpen, onRenameProject, onDeleteProject }) {
  const st = pageStats(pages);
  const stats = [
    { label: 'หน้าเว็บทั้งหมด', value: String(st.pages), hint: 'หน้าในโปรเจกต์นี้' },
    { label: 'ขั้นที่อนุมัติแล้ว', value: `${st.approved}/${st.stagesAll}`, hint: `${percent(st.approved, st.stagesAll)}% ของทุกขั้น` },
    { label: 'เช็คลิสต์รวม', value: `${percent(st.done, st.total)}%`, hint: `${st.done} จาก ${st.total} ข้อ` },
    { label: 'ใกล้ถึงกำหนดที่สุด', value: st.soon ? st.soon.name : '—', hint: st.soon ? `${fmtDate(st.soon.due)}${st.soon.owner ? ' · ' + st.soon.owner : ''}` : 'ยังไม่ได้ตั้งกำหนดส่ง' }
  ];

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="muted" style={{ fontSize: 13 }}>{project.name}{project.sub ? ` · ${project.sub}` : ''}</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>ภาพรวมทั้งโปรเจกต์</h1>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn" onClick={onRenameProject}>เปลี่ยนชื่อโปรเจกต์</button>
          <button className="btn btn-danger" onClick={onDeleteProject}>ลบโปรเจกต์</button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="muted" style={{ fontSize: 13 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{s.value}</div>
            <div className="muted" style={{ fontSize: 12 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {pages.length === 0 ? (
        <div className="card muted">ยังไม่มีหน้าเว็บในโปรเจกต์นี้ กด "เพิ่มหน้าใหม่" ที่แถบซ้ายเพื่อเริ่ม</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ padding: '12px 12px' }}>หน้าเว็บ</th>
                <th>ผู้รับผิดชอบ</th>
                <th>กำหนดส่ง</th>
                {STAGES.map((s) => <th key={s.key}>{s.short}</th>)}
                <th>เช็คลิสต์</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '10px 12px' }}>
                    <button style={{ background: 'transparent', border: 'none', padding: 0, minHeight: 44, textAlign: 'left' }} onClick={() => onOpen(p.id, 0)}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                      <span className="muted" style={{ display: 'block', fontSize: 12 }}>{p.path}</span>
                    </button>
                  </td>
                  <td>{p.owner ? <span className="row" style={{ gap: 8 }}><Avatar name={p.owner} />{p.owner}</span> : <span className="muted">—</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(p.due)}</td>
                  {STAGES.map((s, j) => {
                    const g = p.stages[s.key];
                    const sty = STATUS[g.status];
                    const cur = g.versions[g.ver - 1];
                    return (
                      <td key={s.key}>
                        <button className="cell-btn" style={{ background: sty.bg, color: sty.color }} onClick={() => onOpen(p.id, j)}>
                          <span><StatusIcon name={sty.icon} /> {sty.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 500 }}>{cur ? `v${cur.n} จาก ${g.versions.length}` : 'ยังไม่มีภาพ'}</span>
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ whiteSpace: 'nowrap' }}>{countDone(p.items)}/{p.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
