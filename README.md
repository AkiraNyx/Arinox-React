# Arinox React

本地可复用的 React 19 / TypeScript 组件库与 Anime.js 4 动效系统。工作台和组件展厅从 `@arinox/react` 公共入口使用实际编译产物，页面组合与业务逻辑位于 `examples/`。

保留暖纸内容、月光蓝、玻璃操作层和离线字体。11px 控件圆角是已确认选择；16px 浮层、20px 内容、24px 大型玻璃是当前工作基线。

## 启动与构建

本机验证环境：Node 24.20.0、npm 11.19.0。

```powershell
git clone https://github.com/AkiraNyx/Arinox-React.git
cd Arinox-React
npm ci
npm run dev       # 127.0.0.1:5174，先编译库再启动示例
npm run build     # lib 的 JS/类型/样式 + 类型检查 + 示例生产构建
npm run preview   # 127.0.0.1:5175
```

启动开发服务后打开 [工作台](http://127.0.0.1:5174/) 或 [组件展厅](http://127.0.0.1:5174/showcase.html)。生产预览对应端口 5175；这些地址是你本机的服务，不是在线部署。两个端口均启用 strictPort，不会自动占用其他端口。修改库源码后运行 `npm run build:lib`，开发服务会重新加载实际 lib 输出；修改示例可直接热更新。

## 接入

公共源码为 `src/index.ts`；发布形态的本地入口为 `lib/index.js` / `lib/index.d.ts`，样式为 `@arinox/react/styles.css`。React / React DOM 是 peer dependencies；Anime.js 是运行时依赖。不提供 CJS 构建。

```tsx
import { Theme, Button, Field, Input } from '@arinox/react';
import '@arinox/react/styles.css';

<Theme theme="day">
  <Field label="名称" htmlFor="name" hint="为想法起一个名字">
    <Input id="name" defaultValue="我的想法" aria-describedby="name-help" />
  </Field>
  <Button variant="primary" onClick={save}>保存</Button>
</Theme>
```

跨项目本地安装可先 `npm run build:lib`，再 `npm pack --pack-destination checks`，在目标 React 19 项目安装生成的 `arinox-react-0.1.1.tgz`。这只是本地打包，不发布 npm；包本身为 private。

| 组件 | 主要 API |
| --- | --- |
| Theme | `theme="day" / "night"`，原生 div 属性与 ref；浮层需要放在 Theme 内 |
| Button | `variant=primary/neutral/ghost/danger`、`size=sm/md/lg`、`loading`、原生 button 属性/ref；默认 type=button |
| Input / Textarea / Select | 原生属性/ref，`value/onChange` 或 `defaultValue`，`invalid`；Select 保留原生 option |
| Checkbox / Switch | 原生 `checked/onChange` 或 `defaultChecked`、disabled/ref；Checkbox 另有 `indeterminate` |
| Field | `label`、`htmlFor`、`hint/error`；消息 id 为 `htmlFor + '-help'`，由输入的 aria-describedby 关联 |
| Tabs | `label`、`items=[{value,label,content,disabled}]`，`value/onValueChange` 或 `defaultValue`；一个 Tab 入口、左右/Home/End 导航，面板保留挂载 |
| Menu / MenuItem | `trigger(props)` 保留 ref/事件/aria 属性，`open/onOpenChange` 或 `defaultOpen`；MenuItem `onSelect`、disabled 及原生按钮属性 |
| Dialog | `open/onOpenChange` 或 `defaultOpen + trigger`，`initialFocusRef`、`returnFocus()`、`onAfterClose`；children 可接收 `{close,phase}`。默认 `modal=true` 使用原生模态；`modal=false` 使用原生非顶层对话框，背景隔离与键盘模态边界由接入应用负责 |
| Card / Glass / Stack / Inline | 原生 article/div 属性与 ref；Card 的 surface、布局 gap 来自间距 token |
| SegmentedControl | 工作台复用的按钮组；`label/options`、`value/onValueChange` 或 defaultValue、pill/underline 外观 |
| Icon | 原图标几何，`name` 联合类型与 SVG 属性；默认装饰性，独立图标按钮由按钮提供名称 |

```tsx
<Menu aria-label="项目操作" trigger={props => <Button {...props}>操作</Button>}>
  <MenuItem onSelect={edit}>编辑</MenuItem>
  <MenuItem disabled>不可用</MenuItem>
</Menu>

<Dialog open={open} onOpenChange={setOpen} aria-labelledby="edit-title">
  {({ close, phase }) => (
    <form onSubmit={event => {
      event.preventDefault();
      if (phase === 'closing' || !event.currentTarget.reportValidity()) return;
      save(); close();
    }}>
      <h2 id="edit-title">编辑</h2>
      <Input name="title" required />
      <Button type="submit">保存</Button>
      <Button onClick={close}>取消</Button>
    </form>
  )}
</Dialog>
```

表单验证、提交、去重与持久化由应用负责，基础组件不读写 localStorage。可通过原生 ref 访问控件；弹窗关闭优先使用 close 或 open 状态，使退出生命周期完整。

## 动效与样式边界

组件内部按官方 React 方式创建 Anime.js scope，并在清理时取消/revert。进入和退出沿用 120/200/320ms 与曲线 token；快速反向操作衔接当前帧，原生模态保留到退出完成。运行中改变减少动效偏好也可完成当前过渡。

CSS 负责颜色、焦点、按压和独立加载伪元素；Anime.js 负责浮层 opacity/transform、选择指示的几何和布局位置。不要在同一动画目标上再添加自定义 opacity/transform 动画。`useLayoutTransition(ref)` 返回包裹状态更新的函数，跟踪带 `data-ax-layout-item` 的稳定项目身份。

嵌套浮层沿用最近的 Dialog 宿主，保持原生模态焦点关系；菜单在支持 [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using) 时使用手动 top layer，定位不受祖先 transform 裁切，开关仍由 React 与 Anime 生命周期管理。旧浏览器退回普通 fixed 菜单，复杂嵌套/变换容器需另行验证。

应用专用组合可以通过公共入口调用 `motionTokens(element)` 读取当前主题的时长与曲线，并使用 `useReducedMotion()` 跟随运行期间偏好变化；为 Anime 创建 scope，在中断和卸载时取消并 revert。不要让 CSS 和 Anime 同时动画同一属性。

元素规则限制在 `.ax-theme` 内，示例的 body 布局不进入库。字体和命名自定义属性仍是 CSS 的全局注册，库不是 Shadow DOM 隔离。原生选择框在支持 `appearance: base-select` 的浏览器增强 16px 浮层，其他浏览器保留原生外观。

## 数据与来源

工作台保留 `arinox-fusion-v1`、version=1 及既有字段与 50 项限制。挂载不自动保存；创建、编辑、收藏、布局、主题、清单和笔记操作由应用保存。坏记录不会自动清空或覆盖，写入失败会保留页面状态并提示。

**不同来源或端口的 localStorage 不共享。** 新预览不会自动读取原 1700 端口的真实记录，也不进行迁移。展厅只读取主题，所有演示不写工作台记录。工作台继续沿用单活动标签页限制，没有账户同步或备份服务。

`arinox-fusion` 和旧 Arinox 为开发时的只读参考，克隆本仓库不需要这些目录。三阶段审查与实施验证报告保留在 `checks/`，其中记录的是当时的本机运行结果。构建产物、测试截图、本地包和原型保护清单不上传。

下面是开发期间使用的检查入口。浏览器脚本目前引用本机 Playwright/Edge 路径，在其他机器运行前需要调整路径；`check:protected` 依赖原工作区的只读参考与本地清单，不属于克隆后的通用构建步骤。`npm ci` 和 `npm run build` 可独立运行。

```powershell
npm run check:protected
node checks/foundation.cjs http://127.0.0.1:5175/
node checks/interactions.cjs http://127.0.0.1:5174/
node checks/workspace.cjs http://127.0.0.1:5175/
node checks/showcase.cjs http://127.0.0.1:5175/
```

真实手机、Safari、Firefox、读屏和主观帧率尚未验证。浏览器媒体模拟单独报告，不作为真实设备验收。GitHub 仓库提供源码；npm 包发布与在线部署尚未进行。

## 许可证

Copyright (C) 2026 AkiraNyx。项目使用 [GNU General Public License v3.0](LICENSE)，标识为 `GPL-3.0-only`。随附字体与依赖保留各自许可证，详见 [第三方声明](LICENSES.md)。
