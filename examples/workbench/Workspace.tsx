import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Glass, Icon, Input, SegmentedControl, Theme, useLayoutTransition } from '@arinox/react';
import { categories } from './model.js';
import type { Category, Project, ProjectDraft } from './model.js';
import { useWorkspace } from './useWorkspace.js';
import { Sidebar } from './Sidebar.js';
import { Desk } from './Desk.js';
import { ProjectCard } from './ProjectCard.js';
import { ProjectDialog } from './ProjectDialog.js';

export function Workspace() {
  const [toast, setToast] = useState<{ text: string; sequence: number } | null>(null);
  const notify = useCallback((text: string) => setToast(current => ({ text, sequence: (current?.sequence ?? 0) + 1 })), []);
  const { state, update, setNote, storageStatus, noteStatus, unreadable } = useWorkspace(notify);
  const [nav, setNav] = useState('all'), [filter, setFilter] = useState('all'), [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Project | 'new' | null>(null), [session, setSession] = useState(0);
  const search = useRef<HTMLInputElement>(null), newButton = useRef<HTMLButtonElement>(null), projects = useRef<HTMLDivElement>(null), lastTrigger = useRef<HTMLElement | null>(null), pendingFocus = useRef<string | null>(null);
  const transition = useLayoutTransition(projects);
  useEffect(() => { document.documentElement.dataset.theme = state.theme; }, [state.theme]);
  useEffect(() => { if (unreadable) notify('未能读取本地记录，当前显示示例内容；原记录不会自动覆盖。'); }, [unreadable, notify]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 3200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !document.querySelector('dialog[open]')) { event.preventDefault(); search.current?.focus(); } };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, []);
  useLayoutEffect(() => { if (pendingFocus.current && !editing) { (projects.current?.querySelector<HTMLButtonElement>('[data-menu="' + pendingFocus.current + '"]') ?? newButton.current)?.focus({ preventScroll: true }); pendingFocus.current = null; } }, [state.projects, editing]);
  const select = (value: string) => transition(() => { setNav(value); setFilter('all'); setQuery(''); });
  const edit = (project: Project | 'new', trigger: HTMLElement | null) => { lastTrigger.current = trigger; setSession(value => value + 1); setEditing(project); };
  const visible = state.projects.filter(project => (nav === 'all' || nav === 'favorites' && project.favorite || project.category === nav) && (filter === 'all' || project.status === filter) && (!query.trim() || [project.title, project.description, project.category].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))).sort((a, b) => b.updated - a.updated);
  const label = nav === 'all' ? '工作台' : nav === 'favorites' ? '收藏' : nav;
  const favorite = (id: string) => {
    const project = state.projects.find(item => item.id === id)!; pendingFocus.current = id;
    transition(() => { const saved = update(current => ({ ...current, projects: current.projects.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item) })); if (saved) notify(project.favorite ? '已取消收藏' : '已加入收藏'); });
  };
  const save = (draft: ProjectDraft) => {
    if (!editing) return false;
    const existing = editing === 'new' ? null : editing;
    const project: Project = { ...(existing ?? {}), ...draft, id: existing?.id ?? crypto.randomUUID(), updated: Date.now(), art: existing?.art ?? (draft.category === '灵感收集' ? 'paper' : draft.category === '工具界面' ? 'tools' : 'arinox') };
    transition(() => {
      const saved = update(current => ({ ...current, projects: existing ? current.projects.map(item => item.id === project.id ? project : item) : [project, ...current.projects] }));
      if (!existing) { setNav('all'); setFilter('all'); setQuery(''); }
      if (saved) notify('项目已保存');
    });
    return true;
  };
  return <Theme theme={state.theme} className="workspace-page app-sandbox"><a className="skip-link" href="#workspace">跳到工作台</a><div className="app-shell"><Sidebar nav={nav} favorites={state.projects.filter(project => project.favorite).length} select={select} /><main className="workspace" id="workspace">
    <Glass className="topbar glass"><span className="breadcrumb"><span className="breadcrumb-dot" aria-hidden="true" />个人空间<span className="breadcrumb-divider">/</span><span id="breadcrumb-current">{label}</span></span><div className="topbar-actions"><label className="search-field"><Icon name="search" className="icon" /><Input id="search" ref={search} type="search" aria-label="搜索项目" placeholder="搜索项目" autoComplete="off" maxLength={100} aria-keyshortcuts="Control+k Meta+k" value={query} onChange={event => setQuery(event.target.value)} /><kbd>Ctrl K</kbd></label><span className="toolbar-divider" aria-hidden="true" /><Button variant="ghost" className="icon-button theme-button" id="theme-toggle" aria-label={state.theme === 'day' ? '切换至夜晚' : '切换至白昼'} onClick={() => update(current => ({ ...current, theme: current.theme === 'day' ? 'night' : 'day' }))}><Icon name={state.theme === 'day' ? 'moon' : 'sun'} className="icon" /></Button></div></Glass>
    <section className="workspace-heading"><div><p className="eyebrow">YOUR QUIET CORNER</p><h1 id="workspace-title">{nav === 'all' ? '让想法，慢慢成形。' : nav === 'favorites' ? '把喜欢的，留在手边。' : nav}</h1><p className="workspace-description">{nav === 'favorites' ? '那些值得继续打磨、也值得再看一眼的东西。' : '从一个念头，到一件属于自己的作品。'}</p></div><Button variant="primary" size="lg" id="new-project" ref={newButton} onClick={event => edit('new', event.currentTarget)}><Icon name="plus" className="icon" />新建项目</Button></section>
    <div className="workspace-columns"><section className="projects-section" aria-labelledby="projects-heading"><div className="section-heading"><div className="section-heading-title"><h2 id="projects-heading">手边的项目</h2><span className="item-count" id="project-count">{visible.length} 个项目</span></div><SegmentedControl label="项目布局" className="view-toggle" value={state.view} onValueChange={view => transition(() => update(current => ({...current,view:view as 'grid'|'list'})))} options={(['grid','list'] as const).map(view => ({value:view,label:<Icon name={view==='grid'?'grid':'list'} className="icon"/>,buttonProps:{className:'icon-button','data-view':view,'aria-label':view==='grid'?'卡片布局':'列表布局'}}))}/></div><SegmentedControl label="项目状态" className="filter-row" appearance="underline" value={filter} onValueChange={value=>transition(()=>setFilter(value))} options={[['all','全部'],['active','进行中'],['done','已完成']].map(([value,label])=>({value,label,buttonProps:{className:'filter-button','data-filter':value}}))}/><div ref={projects} className="project-grid" id="projects" data-layout={state.view}>{visible.map(project => <ProjectCard key={project.id} project={project} edit={edit} favorite={favorite} />)}</div><div className="empty-state" id="empty-state" hidden={visible.length > 0}><Icon name="search" className="icon" /><h3>这里还很安静</h3><p>试试其他关键词，或创建一个新项目。</p><Button id="clear-filters" onClick={() => { select('all'); search.current?.focus(); }}>查看全部项目</Button></div><p className="collection-footer"><span className="footer-line" aria-hidden="true" /><span>一件一件，做成自己喜欢的样子。</span></p></section><Desk note={state.note} noteStatus={noteStatus} todos={state.todos} setNote={setNote} setTodo={(index, checked) => update(current => ({ ...current, todos: current.todos.map((value, i) => i === index ? checked : value) }))} /></div><footer className="app-footer"><span><span className="status-dot" aria-hidden="true" /><span id="storage-status">{storageStatus}</span></span><a href="showcase.html">组件展厅 ↗</a><span>ARINOX / 夜明</span></footer>
  </main></div><ProjectDialog editing={editing} session={session} category={categories.includes(nav as Category) ? nav as Category : '设计系统'} close={() => setEditing(null)} save={save} limit={state.projects.length >= 50} returnFocus={() => lastTrigger.current?.isConnected ? lastTrigger.current : newButton.current} /><Glass id="toast" className="toast glass" role="status" aria-live="polite" hidden={!toast}>{toast?.text}</Glass></Theme>;
}
