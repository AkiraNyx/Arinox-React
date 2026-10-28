<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/arinox-logo-dark.svg" />
    <img src="src/assets/arinox-logo.svg" width="88" height="88" alt="Arinox React" />
  </picture>
</p>

<h1 align="center">Arinox React</h1>

<p align="center">给 React 19 用的组件层。样式、主题与动效一起交付，不是一组无样式控件。</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--only-8F7CFF?style=flat-square" alt="GPL-3.0-only"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/build-ESM%20only-2b2930?style=flat-square" alt="ESM only">
</p>

<p align="center">
  <code>@arinox/react</code> 0.1.1 · 18 个组件 · TypeScript 7 / Vite 8 / Anime.js 4
</p>

> [!IMPORTANT]
> 私有包（`private: true`），没有 registry 入口。装它走本地打包，`npm install @arinox/react` 会返回 404。

## 它解决什么

三件通常要分开解决的事，这里绑在一起交付：

- **主题** — `day` / `night` 两套。切换时颜色、焦点环、玻璃层同步变化，不用自己接 CSS 变量。
- **动效** — 进出场由 Anime.js 驱动，时长与曲线是 token。快速反向操作衔接当前帧，不从头播放。
- **可访问性基线** — 焦点归还、原生模态、左右 / Home / End 键盘导航、跟随 `prefers-reduced-motion`。

代价是它有自己的审美：暖纸底、月光蓝、玻璃层、11px 控件圆角。接进现有设计系统要改 token，不是改组件。

**不适合** headless 原语需求、CJS 消费方、React 19 以外的版本。

## 快速开始

环境：Node 24.20.0 / npm 11.19.0 是验证环境。`react` 与 `react-dom` 是 peer dependency，要求 `>=19 <20`，由宿主项目提供。

包不在 registry 上，从源码打包，再装进目标项目：

```bash
git clone https://github.com/AkiraNyx/Arinox-React.git
cd Arinox-React
npm ci
npm run build:lib
npm pack --pack-destination checks
```

在 React 19 项目里装这个 tarball：

```bash
npm install ../Arinox-React/checks/arinox-react-0.1.1.tgz
```

最小用法：

```tsx
import { Theme, Button, Field, Input } from '@arinox/react';
import '@arinox/react/styles.css';

export function App() {
  return (
    <Theme theme="day">
      <Field label="名称" htmlFor="name" hint="留空会用默认值">
        <Input id="name" aria-describedby="name-help" defaultValue="未命名" />
      </Field>
      <Button variant="primary">保存</Button>
    </Theme>
  );
}
```

跑起来会看到暖纸底、带主题的输入框和按钮。两条硬约束：`Menu` 与 `Dialog` 必须放在 `Theme` 内，否则拿不到 token；样式文件必须引入一次，它不提供 Shadow DOM 隔离。

## 组件

18 个组件和 3 个动效 API，全部从 `src/index.ts` 导出。

| 分组 | 组件 | 用途 |
| --- | --- | --- |
| 主题 | `Theme` | 提供 `day`/`night` 上下文与 CSS 变量作用域 |
| 操作 | `Button` | 四变体、三尺寸、loading 态 |
| 表单 | `Input` `Textarea` `Select` `Checkbox` `Switch` `Field` | 原生属性透传、invalid 态、错误消息关联 |
| 布局 | `Card` `Glass` `Stack` `Inline` | 内容容器与间距 token |
| 浮层 | `Tabs` `Menu` `MenuItem` `Dialog` `SegmentedControl` | 键盘导航、焦点归还、原生模态 |
| 图形 | `Icon` | 内联 SVG，默认装饰性 |
| 动效 | `motionTokens` `useReducedMotion` `useLayoutTransition` | 读取 token、跟随偏好、布局过渡 |

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

`Field` 的 `hint` 生成的消息 id 是 `htmlFor + '-help'`，需要输入控件自己用 `aria-describedby` 关联，库不会自动注入。

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

`phase === 'closing'` 时不要再提交，退出动画期间的表单状态不受保护。关闭优先走 `close` 或 `open` 状态，让退出生命周期完整跑完。表单验证、提交、去重与持久化由应用负责，基础组件不读写 localStorage。

## 契约

**动效**。组件内部按官方 React 方式创建 Anime.js scope，卸载时取消并 revert。三档时长 120 / 200 / 320 ms 与对应曲线走 token，原生模态保留到退出动画结束。应用自己的动画从公共入口取参数，不要写死：

```tsx
import { motionTokens, useReducedMotion } from '@arinox/react';

const reduced = useReducedMotion();
const { duration, easing } = motionTokens(ref.current);
```

不要对同一目标同时用 CSS 和 Anime 动画同一个属性。库内已经分好：CSS 管颜色、焦点、按压与加载伪元素；Anime 管浮层 `opacity`/`transform`、选择指示器几何和布局位移。

**样式**。元素规则全部限制在 `.ax-theme` 内，示例页的 body 布局不进库。字体与自定义属性是全局注册，没有 Shadow DOM。原生 `<select>` 在支持 `appearance: base-select` 的浏览器里增强为 16px 浮层，其余保留原生外观。`Menu` 在支持 Popover API 时用手动 top layer，不受祖先 `transform` 裁切；旧浏览器退回 `fixed`，复杂变换容器下的定位需要自行验证。

`useLayoutTransition(ref)` 返回一个包裹状态更新的函数，按 `data-ax-layout-item` 跟踪稳定项目身份。

## 开发

```bash
npm run dev        # 编译库后在 127.0.0.1:5174 起示例，strictPort
npm run build:lib  # 只编译库：JS、.d.ts、样式拷贝
npm run typecheck  # 库与示例的类型检查，不产出
npm run build      # build:lib + typecheck + 示例生产构建
npm run preview    # 预览生产构建，127.0.0.1:5175，strictPort
```

两个端口都开了 `strictPort`，被占用会直接失败，不会静默换端口。启动后工作台在 `/`，组件展厅在 `/showcase.html`。

改库源码后跑一次 `build:lib`——开发服务读 `lib/` 里的实际产物，不是源码；改示例则直接热更新。

```
src/components/   18 个组件，每个一个文件
src/motion.ts     动效 token、scope 管理、三个公开 API
src/styles/       CSS 源文件，构建时拷到 lib/styles/
src/index.ts      唯一导出面
examples/         workbench 与 showcase 两个示例应用
checks/           构建校验脚本与三阶段审查报告
scripts/          构建期资源拷贝
```

`checks/` 里的浏览器脚本写死了本机 Playwright / Edge 路径，换机器要先改。`npm run check:protected` 依赖原工作区的只读参考目录，不属于克隆后的通用步骤；`npm ci` 和 `npm run build` 可以独立运行。

## 已知限制

- 未在真实手机、Safari、Firefox 上验证，未做读屏测试与主观帧率评估。浏览器媒体模拟只作单独记录，不算设备验收。
- 只有 ESM 构建，没有 CJS。
- 未发布 npm，未做在线部署。
- 工作台只有一个活动标签页，没有账户同步与备份。本地记录键 `arinox-fusion-v1`（`version=1`，上限 50 项）。不同 origin 或端口的 localStorage 不互通，换端口预览不会带过来旧数据。

## 许可证

Copyright (C) 2026 AkiraNyx。GPL-3.0-only，全文见 [LICENSE](LICENSE)。随附字体与依赖保留各自许可证，见 [LICENSES.md](LICENSES.md)。
