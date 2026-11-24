import { useEffect, useState } from 'react';
import { STATUS } from '../model.js';
import { useImageUrl } from '../images.js';

// ไอคอนสถานะวาดเป็น SVG เพื่อไม่ต้องพึ่งฟอนต์ (วงกลมว่าง / ครึ่ง / เกือบเต็ม / ติ๊กถูก)
export function StatusIcon({ name }) {
  const c = { width: 13, height: 13, viewBox: '0 0 14 14', 'aria-hidden': true, style: { verticalAlign: '-2px' } };
  if (name === 'check') {
    return <svg {...c}><circle cx="7" cy="7" r="6" fill="currentColor" /><path d="M4.2 7.2l2 2 3.6-4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  const ring = <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />;
  if (name === 'half') return <svg {...c}>{ring}<path d="M7 1.5a5.5 5.5 0 0 0 0 11z" fill="currentColor" /></svg>;
  if (name === 'review') return <svg {...c}>{ring}<path d="M7 7V1.5A5.5 5.5 0 1 1 1.5 7z" fill="currentColor" /></svg>;
  return <svg {...c}>{ring}</svg>;
}

export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS[0];
  return (
    <span className="chip" style={{ background: s.bg, color: s.color }}>
      <StatusIcon name={s.icon} /> {s.label}
    </span>
  );
}

export function Avatar({ name, size = 28 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }} aria-hidden="true">
      {(name || '?').trim().charAt(0) || '?'}
    </span>
  );
}

// ช่องกรอกที่บันทึกเมื่อกด Enter หรือออกจากช่อง
export function EditableText({ value, onSave, placeholder, type = 'text', label, className = '', style }) {
  const [v, setV] = useState(value ?? '');
  useEffect(() => setV(value ?? ''), [value]);
  const commit = () => {
    if (v !== (value ?? '')) onSave(v);
  };
  return (
    <input
      className={`input ${className}`}
      style={style}
      type={type}
      value={v}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

export function VersionImage({ uid, version, alt }) {
  const { url, error } = useImageUrl(uid, version);
  if (error) return <div className="img-missing">โหลดภาพไม่ได้</div>;
  if (!url) return <div className="img-loading">กำลังโหลดภาพ…</div>;
  return <img src={url} alt={alt} />;
}

export function Icon({ name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'plus') return <svg {...common}><path d="M8 3v10M3 8h10" /></svg>;
  if (name === 'x') return <svg {...common}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>;
  if (name === 'note') return <svg {...common}><path d="M2.5 3.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H7l-3 3v-3H3.5a1 1 0 0 1-1-1z" /></svg>;
  if (name === 'grid') return <svg {...common}><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 6.5h12M2 10.5h12M6.5 2v12" /></svg>;
  if (name === 'upload') return <svg width="40" height="40" viewBox="0 0 44 44" fill="none" stroke="#3b5bdb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 30V10M13 18l9-9 9 9" /><path d="M8 32v3a2 2 0 0 0 2 2h24a2 2 0 0 0 2-2v-3" /></svg>;
  return null;
}
