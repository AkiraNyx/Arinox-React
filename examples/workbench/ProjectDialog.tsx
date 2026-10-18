import { useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Icon, Input, Select, Textarea } from '@arinox/react';
import type { DialogControls } from '@arinox/react';
import { categories } from './model.js';
import type { Category, Project, ProjectDraft } from './model.js';
type Props = { editing: Project | 'new' | null; session: number; category: Category; close: () => void; save: (draft: ProjectDraft) => boolean; returnFocus: () => HTMLElement | null; limit: boolean };
function ProjectForm({ initial, category, controls, save, limit, titleRef }: { initial: Project | 'new'; category: Category; controls: DialogControls; save: Props['save']; limit: boolean; titleRef: React.RefObject<HTMLInputElement | null> }) {
  const project = initial === 'new' ? null : initial;
  const [draft, setDraft] = useState<ProjectDraft>(() => project ? { title: project.title, description: project.description, category: project.category, status: project.status, favorite: project.favorite } : { title: '', description: '', category, status: 'active', favorite: false });
  const [error, setError] = useState(''); const submitted = useRef(false);
  const change = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  return <form id="project-form" onSubmit={event => {
    event.preventDefault(); if (submitted.current || controls.phase === 'closing') return;
    const title = draft.title.trim(); titleRef.current?.setCustomValidity(title ? '' : '请填写项目名称');
    if (!event.currentTarget.reportValidity()) return;
    if (limit && !project) { setError('这个示例工作区最多容纳 50 个项目。'); return; }
    if (save({ ...draft, title, description: draft.description.trim() })) { submitted.current = true; controls.close(); }
  }}>
    <header className="dialog-heading"><div><p className="eyebrow">{project ? 'A WORK IN PROGRESS' : 'A LITTLE IDEA'}</p><h2 id="dialog-heading">{project ? '把想法，再打磨一点' : '记录一个新想法'}</h2></div><Button variant="ghost" className="icon-button" onClick={controls.close} aria-label="关闭项目详情"><Icon name="close" className="icon" /></Button></header>
    <p id="dialog-description" className="dialog-description" role="status" aria-live="polite">{error || '给它一个名字，剩下的慢慢来。'}</p>
    <div className="form-fields"><label className="form-field"><span>项目名称</span><Input ref={titleRef} name="title" required maxLength={60} autoComplete="off" placeholder="你正在构思什么？" value={draft.title} onChange={event => { titleRef.current?.setCustomValidity(''); change('title', event.target.value); }} /></label><label className="form-field"><span>项目说明</span><Textarea name="description" maxLength={500} rows={3} placeholder="记下这个想法最重要的部分。" value={draft.description} onChange={event => change('description', event.target.value)} /></label><div className="form-row"><label className="form-field"><span>所属集合</span><Select name="category" value={draft.category} onChange={event => change('category', event.target.value as Category)}>{categories.map(value => <option key={value}>{value}</option>)}</Select></label><label className="form-field"><span>状态</span><Select name="status" value={draft.status} onChange={event => change('status', event.target.value as Project['status'])}><option value="active">进行中</option><option value="done">已完成</option></Select></label></div><label className="favorite-check"><Checkbox name="favorite" checked={draft.favorite} onChange={event => change('favorite', event.target.checked)} /><span>放进我的收藏</span></label></div>
    <footer className="dialog-footer"><span className="dialog-hint">保存在当前浏览器</span><div><Button onClick={controls.close}>取消</Button><Button variant="primary" type="submit" disabled={controls.phase === 'closing'}>保存项目</Button></div></footer>
  </form>;
}
export function ProjectDialog(props: Props) {
  const title = useRef<HTMLInputElement>(null);
  const last = useRef<Project | 'new'>('new');
  if (props.editing !== null) last.current = props.editing;
  return <Dialog id="project-dialog" className="fx-dialog" open={props.editing !== null} onOpenChange={value => { if (!value) props.close(); }} aria-labelledby="dialog-heading" aria-describedby="dialog-description" initialFocusRef={title} returnFocus={props.returnFocus}>{controls => <ProjectForm key={props.session} initial={last.current} category={props.category} controls={controls} titleRef={title} save={props.save} limit={props.limit} />}</Dialog>;
}
