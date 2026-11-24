import { STAGES, percent } from '../model.js';
import { Icon } from './common.jsx';

export default function Sidebar({
  projects, projectId, onSelectProject, onCreateProject, projectPct,
  pages, view, onOverview, onSelectPage, onAddPage, user, onSignOut
}) {
  return (
    <aside className="side">
      <div className="stack" style={{ gap: 8 }}>
        <div className="label-sm" style={{ padding: '0 4px' }}>โปรเจกต์ของฉัน</div>
        {projects.map((p) => (
          <button key={p.id} className="proj-btn" aria-pressed={p.id === projectId} onClick={() => onSelectProject(p.id)}>
            <span className="row" style={{ justifyContent: 'space-between', width: '100%', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
              {p.id === projectId && <span style={{ fontSize: 13, fontWeight: 600 }}>{projectPct}%</span>}
            </span>
            {p.sub && <span className="muted" style={{ fontSize: 12 }}>{p.sub}</span>}
            {p.id === projectId && <span className="bar" style={{ height: 6, width: '100%' }}><span style={{ width: `${projectPct}%` }} /></span>}
          </button>
        ))}
        <button className="btn btn-dashed row" style={{ justifyContent: 'center', gap: 8 }} onClick={onCreateProject}>
          <Icon name="plus" /> โปรเจกต์ใหม่
        </button>
      </div>

      {projectId && (
        <div className="stack" style={{ gap: 6 }}>
          <button className="nav-btn" aria-current={view.kind === 'overview' ? 'page' : undefined} onClick={onOverview}>
            <Icon name="grid" /> ภาพรวมทั้งโปรเจกต์
          </button>
          <div className="label-sm" style={{ padding: '10px 6px 2px' }}>หน้าเว็บ ({pages.length})</div>
          {pages.map((pg) => {
            const done = pg.items.filter((i) => i.done).length;
            return (
              <button key={pg.id} className="page-btn" aria-current={view.kind === 'page' && view.pageId === pg.id ? 'page' : undefined} onClick={() => onSelectPage(pg.id)}>
                <span className="row" style={{ justifyContent: 'space-between', width: '100%', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{pg.name}</span>
                  <span className="muted" style={{ fontSize: 13 }}>{done}/{pg.items.length}</span>
                </span>
                <span className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <span className="muted" style={{ fontSize: 12 }}>{pg.path}</span>
                  <span className="dots" aria-hidden="true">
                    {STAGES.map((s) => {
                      const st = pg.stages[s.key];
                      return <span key={s.key} className={st.status === 3 ? 'ok' : st.versions.length ? 'on' : ''} />;
                    })}
                  </span>
                </span>
              </button>
            );
          })}
          <button className="btn btn-dashed row" style={{ justifyContent: 'center', gap: 8, marginTop: 4 }} onClick={onAddPage}>
            <Icon name="plus" /> เพิ่มหน้าใหม่
          </button>
        </div>
      )}

      <div className="stack" style={{ gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <div className="muted" style={{ fontSize: 12, wordBreak: 'break-all' }}>{user.email || user.displayName}</div>
        <button className="btn" onClick={onSignOut}>ออกจากระบบ</button>
      </div>
    </aside>
  );
}

export { percent };
