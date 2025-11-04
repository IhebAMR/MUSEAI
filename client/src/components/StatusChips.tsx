import { useEffect, useState } from 'react';
import { api } from '../services/api';

function Chip({ ok, label, tooltip }: { ok: boolean | null; label: string; tooltip?: string }) {
  let color = '#6b7280';
  let bg = 'rgba(107,114,128,0.15)';
  if (ok === true) {
    color = '#10b981';
    bg = 'rgba(16,185,129,0.15)';
  } else if (ok === false) {
    color = '#ef4444';
    bg = 'rgba(239,68,68,0.15)';
  }
  return (
    <span title={tooltip || ''} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 999,
      color, background: bg, border: `1px solid ${color}22`,
      fontSize: 12, lineHeight: 1
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

export default function StatusChips() {
  const [aiOk, setAiOk] = useState<boolean | null>(null);
  const [ytOk, setYtOk] = useState<boolean | null>(null);
  const [aiTip, setAiTip] = useState<string>('');
  const [ytTip, setYtTip] = useState<string>('');

  const poll = async () => {
    try {
      const { data } = await api.get('/ai/status');
      setAiOk(!!data?.ok);
      setAiTip(data?.ok ? 'AI reachable' : (data?.error || 'AI error'));
    } catch (e: any) {
      setAiOk(false);
      setAiTip(e?.message || 'AI error');
    }
    try {
      const { data } = await api.get('/youtube/status');
      setYtOk(!!data?.ok);
      setYtTip(data?.ok ? 'YouTube API OK' : (data?.error || 'YouTube error'));
    } catch (e: any) {
      setYtOk(false);
      setYtTip(e?.message || 'YouTube error');
    }
  };

  useEffect(() => {
    poll();
    const t = setInterval(poll, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Chip ok={aiOk} label="AI" tooltip={aiTip} />
      <Chip ok={ytOk} label="YouTube" tooltip={ytTip} />
    </div>
  );
}
