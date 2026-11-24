import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { newPageData, addVersion, addNote } from './model.js';
import Overview from './components/Overview.jsx';
import PageView from './components/PageView.jsx';
import Sidebar from './components/Sidebar.jsx';

function samplePage() {
  const p = { id: 'g1', ...newPageData({ name: 'Home', owner: 'นิว', due: '2026-12-05', figma: 'figma.com/design/x', items: ['Hero banner', 'ปุ่ม CTA'] }) };
  p.items[0].done = true;
  p.items[1].note = 'ปุ่มใหญ่ขึ้น';
  p.stages.wireframe = addVersion(p.stages.wireframe, { id: 'v1', name: 'home.png', imageId: 'i1' });
  p.stages.wireframe = addNote(p.stages.wireframe, 'โครงอนุมัติแล้ว');
  p.stages.wireframe.status = 3;
  return p;
}

const noop = () => {};
const project = { id: 'p1', name: 'Bloom Coffee', sub: 'เว็บไซต์ร้านกาแฟ' };

describe('render smoke', () => {
  it('Overview แสดงตารางและสถิติ', () => {
    const html = renderToStaticMarkup(<Overview project={project} pages={[samplePage()]} onOpen={noop} onRenameProject={noop} onDeleteProject={noop} />);
    expect(html).toContain('ภาพรวมทั้งโปรเจกต์');
    expect(html).toContain('อนุมัติแล้ว');
    expect(html).toContain('1/2');
    expect(html).toContain('v1 จาก 1');
  });

  it('Overview ไม่มีหน้า ไม่พัง', () => {
    const html = renderToStaticMarkup(<Overview project={project} pages={[]} onOpen={noop} onRenameProject={noop} onDeleteProject={noop} />);
    expect(html).toContain('ยังไม่มีหน้าเว็บ');
  });

  const common = {
    uid: 'u1', project, page: samplePage(), setView: noop, onPatch: noop, onMutate: noop, onUpload: noop,
    onRemoveVersion: noop, uploading: false, customTemplates: [{ id: 't1', name: 'ของฉัน', items: ['a'] }],
    onSaveTemplate: noop, onDeleteTemplate: noop, onRename: noop, onDelete: noop
  };

  it('PageView โหมดทีละขั้น', () => {
    const html = renderToStaticMarkup(<PageView {...common} view={{ kind: 'page', pageId: 'g1', stageIdx: 0, mode: 'single' }} />);
    expect(html).toContain('Wireframe');
    expect(html).toContain('โครงอนุมัติแล้ว');
    expect(html).toContain('เวอร์ชัน');
    expect(html).toContain('ปุ่มใหญ่ขึ้น');
    expect(html).toContain('href="https://figma.com/design/x"');
  });

  it('PageView ขั้นที่ยังไม่มีภาพ แสดงกล่องอัพโหลด', () => {
    const html = renderToStaticMarkup(<PageView {...common} view={{ kind: 'page', pageId: 'g1', stageIdx: 3, mode: 'single' }} />);
    expect(html).toContain('ลากไฟล์มาวาง');
  });

  it('PageView โหมดเทียบ 4 ขั้น', () => {
    const html = renderToStaticMarkup(<PageView {...common} view={{ kind: 'page', pageId: 'g1', stageIdx: 0, mode: 'compare' }} />);
    expect(html).toContain('เทียบ 4 ขั้นของหน้า Home');
    expect(html.match(/>เปิดดูขั้นนี้<\/button>/g)).toHaveLength(4);
  });

  it('Sidebar แสดงโปรเจกต์และหน้า', () => {
    const html = renderToStaticMarkup(
      <Sidebar projects={[project]} projectId="p1" projectPct={50} pages={[samplePage()]} view={{ kind: 'overview' }}
        onSelectProject={noop} onCreateProject={noop} onOverview={noop} onSelectPage={noop} onAddPage={noop}
        user={{ email: 'a@b.c' }} onSignOut={noop} />
    );
    expect(html).toContain('Bloom Coffee');
    expect(html).toContain('Home');
    expect(html).toContain('a@b.c');
  });
});
