import { useCallback, useEffect, useRef, useState } from 'react';
import { loadWorkspace, storageKey } from './model.js';
import type { WorkspaceState } from './model.js';

export function useWorkspace(notify: (message: string) => void) {
  const [loaded] = useState(loadWorkspace);
  const [state, setState] = useState(loaded.state);
  const latest = useRef(state);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [storageStatus, setStorageStatus] = useState(loaded.unreadable ? '未载入本地记录' : '本地保存 · 无需登录');
  const [noteStatus, setNoteStatus] = useState('只留在你的浏览器里');
  const write = useCallback(() => {
    try {
      if (loaded.unreadable) throw new Error('Unreadable data is protected');
      // shortcut: the existing format assumes one active workspace tab; coordinate writes before multi-tab support.
      localStorage.setItem(storageKey, JSON.stringify(latest.current));
      setStorageStatus('本地保存 · 无需登录'); return true;
    } catch { setStorageStatus('暂时仅保留在当前页面'); notify(loaded.unreadable ? '未能读取原有记录，原记录未覆盖；当前更改仅保留在页面。' : '浏览器暂时无法保存，内容会保留到关闭页面前。'); return false; }
  }, [loaded.unreadable, notify]);
  const flush = useCallback(() => {
    if (pending.current === null) return;
    clearTimeout(pending.current); pending.current = null;
    setNoteStatus(write() ? '已保存在这个浏览器' : '暂时仅保留在当前页面');
  }, [write]);
  useEffect(() => { window.addEventListener('pagehide', flush); return () => { window.removeEventListener('pagehide', flush); flush(); }; }, [flush]);
  const update = useCallback((change: (current: WorkspaceState) => WorkspaceState) => {
    // Calculate and persist outside React's state updater, which StrictMode may invoke twice.
    const next = change(latest.current); latest.current = next; setState(next);
    if (pending.current !== null) { clearTimeout(pending.current); pending.current = null; }
    const saved = write(); setNoteStatus(saved ? '已保存在这个浏览器' : '暂时仅保留在当前页面'); return saved;
  }, [write]);
  const setNote = useCallback((note: string) => {
    const next = { ...latest.current, note }; latest.current = next; setState(next); setNoteStatus('正在记录…');
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = setTimeout(flush, 400);
  }, [flush]);
  return { state, update, setNote, storageStatus, noteStatus, unreadable: loaded.unreadable };
}
