export const storageKey = 'arinox-fusion-v1';
export const categories = ['设计系统', '灵感收集', '工具界面'] as const;
export type Category = typeof categories[number];
export type Project = { id: string; title: string; description: string; category: Category; status: 'active' | 'done'; favorite: boolean; updated: number; art: 'arinox' | 'paper' | 'tools' };
export type WorkspaceState = { version: 1; theme: 'day' | 'night'; view: 'grid' | 'list'; note: string; todos: boolean[]; projects: Project[] };
export type ProjectDraft = Pick<Project, 'title' | 'description' | 'category' | 'status' | 'favorite'>;
export function initialState(): WorkspaceState {
  return {
    version: 1, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day', view: 'grid',
    note: '让内容保持纸感，\n把玻璃留给操作。\n\n温暖一点，也精确一点。', todos: [true, false, false],
    projects: [
      { id: 'arinox', title: 'Arinox · 夜明', description: '从昼与夜出发，让每一处颜色、字体与交互，都有自己的理由。', category: '设计系统', status: 'active', favorite: true, updated: Date.now(), art: 'arinox' },
      { id: 'inspiration', title: '灵感，留在这里', description: '收集让人想停留的排版、细节，以及那些恰到好处的留白。', category: '灵感收集', status: 'active', favorite: false, updated: Date.now() - 86400000, art: 'paper' },
      { id: 'workspace', title: '自己的工作台', description: '为日常的小事，找到一套清楚、顺手的界面。', category: '工具界面', status: 'done', favorite: false, updated: Date.now() - 172800000, art: 'tools' },
    ],
  };
}
export function validState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== 'object') return false;
  const state = value as WorkspaceState;
  return state.version === 1 && ['day', 'night'].includes(state.theme) && ['grid', 'list'].includes(state.view)
    && typeof state.note === 'string' && state.note.length <= 2000
    && Array.isArray(state.todos) && state.todos.length === 3 && state.todos.every(item => typeof item === 'boolean')
    && Array.isArray(state.projects) && state.projects.length <= 50
    && state.projects.every(project => project && typeof project.id === 'string' && /^[a-z0-9-]{1,64}$/.test(project.id)
      && typeof project.title === 'string' && project.title.trim().length > 0 && project.title.length <= 60
      && typeof project.description === 'string' && project.description.length <= 500
      && categories.includes(project.category) && ['active', 'done'].includes(project.status)
      && typeof project.favorite === 'boolean' && ['arinox', 'paper', 'tools'].includes(project.art)
      && typeof project.updated === 'number' && Number.isFinite(new Date(project.updated).getTime()))
    && new Set(state.projects.map(project => project.id)).size === state.projects.length;
}
export function loadWorkspace() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { state: initialState(), unreadable: false };
    const parsed: unknown = JSON.parse(saved);
    if (!validState(parsed)) throw new Error('Invalid saved workspace');
    return { state: parsed, unreadable: false };
  } catch { return { state: initialState(), unreadable: true }; }
}
