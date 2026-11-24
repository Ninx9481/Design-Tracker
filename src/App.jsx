import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, configured, IMAGE_STORE } from './firebase.js';
import {
  watchProjects, watchPages, watchTemplates, createProject, updateProject, deleteProject,
  createPage, savePage, deletePage, saveTemplate, deleteTemplate
} from './db.js';
import { saveImage, deleteVersionImage } from './images.js';
import { newPageData, addVersion, removeCurrentVersion, newId, pageStats, percent } from './model.js';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Overview from './components/Overview.jsx';
import PageView from './components/PageView.jsx';

function SetupNeeded() {
  return (
    <div className="center">
      <div className="card login">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>ยังไม่ได้ตั้งค่า Firebase</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          คัดลอกไฟล์ <span className="code">.env.example</span> เป็น <span className="code">.env</span> แล้วใส่ค่าจาก Firebase Console
          (ถ้า deploy บน GitHub ให้ใส่เป็น Secrets) จากนั้นเปิดแอพใหม่อีกครั้ง ดูขั้นตอนทั้งหมดใน README
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    if (!configured) return undefined;
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  if (!configured) return <SetupNeeded />;
  if (user === undefined) return <div className="center muted">กำลังโหลด…</div>;
  if (!user) return <Login />;
  return <Workspace key={user.uid} user={user} />;
}

function Workspace({ user }) {
  const uid = user.uid;
  const [projects, setProjects] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [pages, setPages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [view, setView] = useState({ kind: 'overview', pageId: null, stageIdx: 0, mode: 'single' });
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const pagesRef = useRef([]);
  pagesRef.current = pages;

  useEffect(() => watchProjects(uid, setProjects, setError), [uid]);
  useEffect(() => watchTemplates(uid, setTemplates, setError), [uid]);

  // เลือกโปรเจกต์แรกอัตโนมัติ / เมื่อโปรเจกต์ที่เลือกถูกลบ
  useEffect(() => {
    if (!projects) return;
    if (!projects.some((p) => p.id === projectId)) setProjectId(projects[0] ? projects[0].id : null);
  }, [projects, projectId]);

  useEffect(() => {
    setPages([]);
    if (!projectId) return undefined;
    return watchPages(uid, projectId, setPages, setError);
  }, [uid, projectId]);

  const project = projects && projects.find((p) => p.id === projectId);
  const page = view.kind === 'page' ? pages.find((p) => p.id === view.pageId) : null;
  const stats = pageStats(pages);

  const fail = (e) => window.alert(e && e.message ? e.message : String(e));

  const mutate = (id, fn) => {
    const cur = pagesRef.current.find((p) => p.id === id);
    if (!cur) return Promise.resolve();
    const draft = structuredClone(cur);
    fn(draft);
    return savePage(uid, projectId, id, draft).catch(fail);
  };

  const onCreateProject = async () => {
    const name = window.prompt('ชื่อโปรเจกต์ (เช่น ชื่อเว็บไซต์หรือลูกค้า)');
    if (!name || !name.trim()) return;
    const sub = window.prompt('คำอธิบายสั้นๆ (ไม่ใส่ก็ได้)') || '';
    try {
      const id = await createProject(uid, { name, sub });
      setProjectId(id);
      setView({ kind: 'overview', pageId: null, stageIdx: 0, mode: 'single' });
    } catch (e) { fail(e); }
  };

  const onRenameProject = async () => {
    const name = window.prompt('ชื่อโปรเจกต์ใหม่', project.name);
    if (name && name.trim()) updateProject(uid, projectId, { name: name.trim() }).catch(fail);
  };

  const onDeleteProject = async () => {
    if (!window.confirm(`ลบโปรเจกต์ "${project.name}" พร้อมทุกหน้าและภาพทั้งหมด? ย้อนกลับไม่ได้`)) return;
    try { await deleteProject(uid, projectId); } catch (e) { fail(e); }
  };

  const onAddPage = async () => {
    const name = window.prompt('ชื่อหน้าเว็บ (เช่น Home, เมนู, ติดต่อเรา)');
    if (!name || !name.trim()) return;
    const path = window.prompt('พาธของหน้า (ไม่ใส่ก็ได้)', '/') || '/';
    try {
      const id = await createPage(uid, projectId, newPageData({ name, path }));
      setView({ kind: 'page', pageId: id, stageIdx: 0, mode: 'single' });
    } catch (e) { fail(e); }
  };

  const onUpload = async (stageKey, file) => {
    const id = page.id;
    setUploading(true);
    try {
      const stored = await saveImage(uid, file);
      await mutate(id, (d) => {
        d.stages[stageKey] = addVersion(d.stages[stageKey], { id: newId(), name: file.name, at: Date.now(), ...stored });
      });
    } catch (e) { fail(e); } finally { setUploading(false); }
  };

  const onRemoveVersion = async (stageKey) => {
    if (!window.confirm('ลบภาพเวอร์ชันนี้? ย้อนกลับไม่ได้')) return;
    const cur = pagesRef.current.find((p) => p.id === page.id);
    const { removed } = removeCurrentVersion(cur.stages[stageKey]);
    if (!removed) return;
    await mutate(page.id, (d) => { d.stages[stageKey] = removeCurrentVersion(d.stages[stageKey]).stage; });
    deleteVersionImage(uid, removed).catch(() => {});
  };

  const onDeletePage = async () => {
    if (!window.confirm(`ลบหน้า "${page.name}" พร้อมภาพทั้งหมด? ย้อนกลับไม่ได้`)) return;
    const target = page;
    setView({ kind: 'overview', pageId: null, stageIdx: 0, mode: 'single' });
    try { await deletePage(uid, projectId, target); } catch (e) { fail(e); }
  };

  if (error) {
    return (
      <div className="center">
        <div className="card login">
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>เปิดข้อมูลไม่ได้</h1>
          <div className="error">
            {error.code === 'permission-denied'
              ? 'Firestore ไม่อนุญาตให้อ่าน/เขียนข้อมูล ตรวจว่าได้ติดตั้งไฟล์ firestore.rules แล้ว และล็อกอินด้วยบัญชีที่ถูกต้อง'
              : `${error.code || ''} ${error.message || ''}`}
          </div>
          <div style={{ fontSize: 13 }}>บัญชีที่ล็อกอินอยู่: {user.email} <br />UID: <span className="code">{user.uid}</span></div>
          <button className="btn" onClick={() => signOut(auth)}>ออกจากระบบ</button>
        </div>
      </div>
    );
  }
  if (projects === null) return <div className="center muted">กำลังโหลดข้อมูล…</div>;

  const goOverview = () => setView({ kind: 'overview', pageId: null, stageIdx: 0, mode: 'single' });
  const openPage = (id, stageIdx = view.stageIdx) => setView({ kind: 'page', pageId: id, stageIdx, mode: 'single' });

  return (
    <div className="app">
      <Sidebar
        projects={projects} projectId={projectId} projectPct={percent(stats.done, stats.total)}
        onSelectProject={(id) => { setProjectId(id); goOverview(); }}
        onCreateProject={onCreateProject}
        pages={pages} view={page ? view : { kind: 'overview' }}
        onOverview={goOverview} onSelectPage={(id) => openPage(id)} onAddPage={onAddPage}
        user={user} onSignOut={() => signOut(auth)}
      />
      <main className="main">
        {!project && (
          <div className="card stack" style={{ gap: 12, maxWidth: 520 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>เริ่มต้นใช้งาน</h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>สร้างโปรเจกต์แรกของคุณ (เช่น เว็บไซต์ของลูกค้าหนึ่งราย) แล้วเพิ่มหน้าเว็บทีละหน้าเพื่อเริ่มติดตามงานออกแบบ</p>
            <button className="btn btn-primary" onClick={onCreateProject}>สร้างโปรเจกต์แรก</button>
            {IMAGE_STORE === 'firestore' && <p className="muted" style={{ fontSize: 12 }}>ภาพจะถูกย่อให้กว้างไม่เกิน 1600px ก่อนเก็บ</p>}
          </div>
        )}
        {project && !page && (
          <Overview
            project={project} pages={pages}
            onOpen={(id, j) => openPage(id, j)}
            onRenameProject={onRenameProject} onDeleteProject={onDeleteProject}
          />
        )}
        {project && page && (
          <PageView
            key={page.id}
            uid={uid} project={project} page={page}
            view={view} setView={setView} uploading={uploading}
            onPatch={(patch) => mutate(page.id, (d) => Object.assign(d, patch))}
            onMutate={(fn) => mutate(page.id, fn)}
            onUpload={onUpload} onRemoveVersion={onRemoveVersion}
            customTemplates={templates}
            onSaveTemplate={(name, items) => saveTemplate(uid, name, items).catch(fail)}
            onDeleteTemplate={(id) => deleteTemplate(uid, id).catch(fail)}
            onRename={() => {
              const name = window.prompt('ชื่อหน้าใหม่', page.name);
              if (name && name.trim()) mutate(page.id, (d) => { d.name = name.trim(); });
            }}
            onDelete={onDeletePage}
          />
        )}
      </main>
    </div>
  );
}
