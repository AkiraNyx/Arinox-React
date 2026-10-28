<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/arinox-logo-dark.svg" />
    <img src="src/assets/arinox-logo.svg" width="88" height="88" alt="Arinox React" />
  </picture>
</p>

<h1 align="center">Arinox React</h1>

<p align="center">给 React 19 用的组件层。样式、主题与动效一起交付，不是一组无样式控件。</p>

<p align="center">
  <code>@arinox/react</code> 0.1.1 · GPL-3.0-only · React 19 / TypeScript 7 / Vite 8 / Anime.js 4
</p>

> 当前是本地私有包（`private: true`），未发布 npm，通过 `npm pack` 安装。

## 这是什么

组件库加一套动效契约，替你决定三件通常要分开解决的事：

- **主题** — `day` / `night` 两套。切换时颜色、焦点环、玻璃层同步变化。
- **动效** — 进出场由 Anime.js 驱动。时长与曲线是 token，不是散落在组件里的魔法数字。
- **可访问性基线** — 焦点管理、原生模态、键盘导航、`prefers-reduced-motion` 跟随。

代价是它有自己的审美：暖纸底、月光蓝、玻璃操作层、离线字体，控件圆角 11px。接入既有设计系统要改 token，不是改组件。

**不适合**：需要 headless 原语的场景、需要 CJS 的场景、React 19 以外的版本。

## 组件

18 个组件、3 个动效 API，全部从 `src/index.ts` 导出。

| 分组 | 组件 | 职责 |
| --- | --- | --- |
| 主题 | `Theme` | 提供 `day` / `night` 上下文与 CSS 变量作用域 |
| 操作 | `Button` | 四变体、三尺寸、loading 态 |
| 表单 | `Input` `Textarea` `Select` `Checkbox` `Switch` `Field` | 原生属性透传、invalid 态、错误消息关联 |
| 布局 | `Card` `Glass` `Stack` `Inline` | 内容容器与间距 |
| 浮层 | `Tabs` `Menu` `MenuItem` `Dialog` `SegmentedControl` | 键盘导航、焦点归还、原生模态 |
| 图形 | `Icon` | 内联 SVG，默认装饰性 |
| 动效 | `motionTokens` `useReducedMotion` `useLayoutTransition` | 读取 token、跟随偏好、布局过渡 |

## 安装

包是私有的，没有 registry 入口。两步：

```bash
git clone https://github.com/AkiraNyx/Arinox-React.git
cd Arinox-React
npm ci
npm run build:lib
npm pack --pack-destination checks
```

在目标 React 19 项目里安装产物：

```bash
npm install ../Arinox-React/checks/arinox-react-0.1.1.tgz
```

`react` / `react-dom` 是 peer dependency，要求 `>=19 <20`。`animejs` 是运行时依赖，随包安装。不提供 CJS 构建。

## 使用

```tsx
import { Theme, Button, Field, Input } from '@arinox/react';
import '@arinox/react/styles.css';

export function App() {
  return (
    <Theme theme="day">
      <Field label="名称" htmlFor="name" hint="为想法起一个名字">
        <Input id="name" defaultValue="我的想法" aria-describedby="name-help" />
      </Field>
      <Button variant="primary" onClick={save}>
        保存
      </Button>
    </Theme>
  );
}
```

两条硬约束：

- 浮层（`Menu`、`Dialog`）必须放在 `Theme` 内，否则拿不到 token。
- 样式文件必须引入一次。库的 CSS 只作用于 `.ax-theme` 作用域内；但字体和自定义属性是全局注册，它不是 Shadow DOM 隔离。

## 组件 API

未列出的属性一律透传给底层原生元素，`ref` 同样透传。

| 组件 | 主要 API |
| --- | --- |
| `Theme` | `theme="day" / "night"`，原生 div 属性与 ref |
| `Button` | `variant=primary/neutral/ghost/danger`、`size=sm/md/lg`、`loading`；默认 `type="button"` |
| `Input` `Textarea` `Select` | 原生属性与 ref，`value/onChange` 或 `defaultValue`，`invalid`；`Select` 保留原生 option |
| `Checkbox` `Switch` | 原生 `checked/onChange` 或 `defaultChecked`、`disabled`；`Checkbox` 另有 `indeterminate` |
| `Field` | `label`、`htmlFor`、`hint` / `error`；消息 id 为 `htmlFor + '-help'` |
| `Tabs` | `label`、`items=[{value, label, content, disabled}]`、`value/onValueChange` 或 `defaultValue`；单个 Tab 入口，左右 / Home / End 导航，面板保留挂载 |
| `Menu` `MenuItem` | `trigger(props)` 保留 ref、事件与 aria 属性，`open/onOpenChange` 或 `defaultOpen`；`MenuItem` 支持 `onSelect`、`disabled` |
| `Dialog` | `open/onOpenChange` 或 `defaultOpen + trigger`、`initialFocusRef`、`returnFocus()`、`onAfterClose`；children 可接收 `{ close, phase }` |
| `Card` `Glass` `Stack` `Inline` | 原生 article / div 属性与 ref；间距来自 token |
| `SegmentedControl` | `label`、`options`、`value/onValueChange` 或 `defaultValue`，`pill` / `underline` 外观 |
| `Icon` | `name` 联合类型与 SVG 属性；默认装饰性，独立图标按钮由 `Button` 提供名称 |

`Field` 的 `hint` 生成的消息 id 需要输入控件通过 `aria-describedby` 关联，库不会自动注入。

### 浮层组合

```tsx
<Menu aria-label="项目操作" trigger={props => <Button {...props}>操作</Button>}>
  <MenuItem onSelect={edit}>编辑</MenuItem>
  <MenuItem disabled>不可用</MenuItem>
</Menu>

<Dialog open={open} onOpenChange={setOpen} aria-labelledby="edit-title">
  {({ close, phase }) => (
    <form
      onSubmit={event => {
        event.preventDefault();
        if (phase === 'closing' || !event.currentTarget.reportValidity()) return;
        save();
        close();
      }}
    >
      <h2 id="edit-title">编辑</h2>
      <Input name="title" required />
      <Button type="submit">保存</Button>
      <Button onClick={close}>取消</Button>
    </form>
  )}
</Dialog>
```

`phase === 'closing'` 时不要再提交，退出动画期间的表单状态不受保护。关闭优先走 `close` 或 `open` 状态，让退出生命周期完整跑完。

表单验证、提交、去重与持久化由应用负责。基础组件不读写 localStorage。

## 动效

组件内部按官方 React 方式创建 Anime.js scope，卸载时取消并 revert。进出场沿用 120 / 200 / 320 ms 三档与对应曲线 token；快速反向操作衔接当前帧，不从头播放。原生模态保留到退出动画结束。

应用自己的动画通过公共入口取参数，不要写死：

```tsx
import { motionTokens, useReducedMotion } from '@arinox/react';

const reduced = useReducedMotion();
const { duration, easing } = motionTokens(ref.current);
```

**不要对同一目标同时用 CSS 和 Anime 动画同一个属性。** 库内已按属性分工：CSS 管颜色、焦点、按压与加载伪元素；Anime 管浮层 `opacity`/`transform`、选择指示器几何和布局位移。

`useLayoutTransition(ref)` 返回一个包裹状态更新的函数，按 `data-ax-layout-item` 跟踪稳定项目身份。

## 样式作用域

- 元素规则全部限制在 `.ax-theme` 内。示例页的 body 布局不进库。
- 字体与自定义属性是全局注册，没有 Shadow DOM 隔离。
- 原生 `<select>` 在支持 `appearance: base-select` 的浏览器里增强为 16px 浮层，其余保留原生外观。
- 浮层嵌套沿用最近的 `Dialog` 宿主，维持原生模态焦点关系。`Menu` 在支持 Popover API 时使用手动 top layer，定位不受祖先 `transform` 裁切；旧浏览器退回普通 `fixed`，复杂嵌套或变换容器需另行验证。

## 项目结构

```
src/
  components/   18 个组件，一文件一个
  motion.ts     动效 token、Anime scope 管理、三个公开 API
  styles/       CSS 源文件，构建时拷贝为 lib/styles/index.css
  index.ts      公共入口，也是唯一导出面
examples/
  workbench/    工作台应用：清单、笔记、收藏、布局、主题
  showcase/     组件展厅：只读主题，不写工作台数据
checks/         构建校验脚本与三阶段审查报告
scripts/        构建期资源拷贝
```

工作台与展厅都从 `@arinox/react` 公共入口消费 `lib/` 里的实际产物，不是直接引用 `src/`。

## 开发

验证环境：Node 24.20.0、npm 11.19.0。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 先编译库，再在 `127.0.0.1:5174` 起示例 |
| `npm run build:lib` | 只编译库：JS、`.d.ts`、样式拷贝 |
| `npm run typecheck` | 库与示例类型检查，不产出 |
| `npm run build` | `build:lib` + `typecheck` + 示例生产构建 |
| `npm run preview` | 预览生产构建，`127.0.0.1:5175` |

两个端口都开了 `strictPort`，被占用会直接失败，不会静默换端口。

改库源码后要跑一次 `npm run build:lib`——开发服务读的是 `lib/` 里的产物，不是源码。改示例则直接热更新。

启动后开这两个地址：

- 工作台 `http://127.0.0.1:5174/`
- 组件展厅 `http://127.0.0.1:5174/showcase.html`

是你本机的服务，不是在线部署。

## 校验

`checks/` 里的脚本和报告记录的是当时本机运行结果。

```bash
node checks/foundation.cjs http://127.0.0.1:5175/
node checks/interactions.cjs http://127.0.0.1:5174/
node checks/workspace.cjs http://127.0.0.1:5175/
node checks/showcase.cjs http://127.0.0.1:5175/
```

浏览器脚本里写死了本机 Playwright / Edge 路径，换机器要先改。`npm run check:protected` 依赖原工作区的只读参考目录与本地清单，不属于克隆后的通用步骤——`npm ci` 和 `npm run build` 可以独立运行。

## 已知限制

- 未在真实手机、Safari、Firefox 上验证，未做读屏与主观帧率测试。浏览器媒体模拟只作单独记录，不算设备验收。
- 只有 ESM，没有 CJS。
- 未发布 npm，未做在线部署。
- 工作台沿用单活动标签页限制，无账户同步与备份服务。

## 数据

工作台本地记录键为 `arinox-fusion-v1`（`version=1`，上限 50 项）。挂载不自动保存；创建、编辑、收藏、布局、主题、清单、笔记操作由应用层写入。坏记录不会被静默清空或覆盖，写入失败保留页面状态并提示。

**不同 origin 或端口的 localStorage 不互通。** 换端口预览不会带过来旧数据，也没有迁移逻辑。

## 许可证

Copyright (C) 2026 AkiraNyx。`GPL-3.0-only`，全文见 [LICENSE](LICENSE)。随附字体与依赖保留各自许可证，见 [LICENSES.md](LICENSES.md)。
