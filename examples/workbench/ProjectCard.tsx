import { useRef } from 'react';
import { Button, Card, Icon, Menu, MenuItem } from '@arinox/react';
import type { Project } from './model.js';
const date = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Singapore' });
function ProjectArt({ project }: { project: Project }) {
  return <div className="project-art" aria-hidden="true"><span className="art-orb" /><div className="mini-window"><div className="mini-toolbar"><span /><span /><span /></div><div className="mini-content"><div className="mini-sidebar"><span /><span /><span /></div><div className="mini-paper"><span className="mini-word">{project.art === 'arinox' ? 'Arinox' : project.art === 'paper' ? 'Notes.' : 'Workspace'}</span><span className="mini-rule" /><span className="mini-line" /><span className="mini-line" /><span className="mini-pill" /></div></div></div><span className="art-caption">{project.category === '设计系统' ? 'LIGHT & PAPER' : project.category === '灵感收集' ? 'COLLECT & KEEP' : 'MAKE IT YOURS'}</span></div>;
}
export function ProjectCard({ project, edit, favorite }: { project: Project; edit: (project: Project, trigger: HTMLElement | null) => void; favorite: (id: string) => void }) {
  const trigger = useRef<HTMLButtonElement>(null);
  return <Card className="project-card" data-project={project.id} data-ax-layout-item={project.id} data-art={project.art} data-status={project.status}>
    <ProjectArt project={project} />
    <div className="project-copy"><div className="project-topline"><span className="project-category">{project.category}</span><span className="project-favorite" hidden={!project.favorite} role="img" aria-label="已收藏"><Icon name="star" className="icon" /></span></div><h3><button type="button" className="project-open" data-open={project.id} onClick={event => edit(project, event.currentTarget)}>{project.title}</button></h3><p className="project-description">{project.description || '给这个想法留一点空间。'}</p><div className="project-bottom"><span className="project-status"><span className="status-dot" aria-hidden="true" /><span>{project.status === 'done' ? '已完成' : '进行中'}</span></span><time dateTime={new Date(project.updated).toISOString()}>{date.format(project.updated)}</time>
      <Menu id={'project-menu-' + project.id} className="project-actions" aria-label="项目操作" triggerRef={trigger} trigger={props => <Button {...props} variant="ghost" className="icon-button project-menu-trigger" data-menu={project.id} aria-label={project.title + '的更多操作'}><Icon name="more" className="icon" /></Button>}><MenuItem data-menu-action="edit" onSelect={() => edit(project, trigger.current)}><Icon name="edit" />编辑项目</MenuItem><MenuItem data-menu-action="favorite" onSelect={() => favorite(project.id)}><Icon name="star" />{project.favorite ? '取消收藏' : '加入收藏'}</MenuItem></Menu>
    </div></div>
  </Card>;
}
