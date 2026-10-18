# CR-R03 · 完整应用、可复用交付与最终验证

2026-10-18。一次 full / Minor 正式范围审查，汇总阶段验证中确认的问题、最小修复和最终复验。没有以旧原型报告代替本次运行。

## Findings

| # | 严重度 | 位置 | 触发与影响 | 修复及当前结果 |
| --- | --- | --- | --- | --- |
| 1 | Major | src/styles/tokens.css:99、controls.css:13 | 将旧全局夜间选择器简单前缀化，变成 Theme 内部子孙；在系统白昼时手动切夜晚，容器标记已切换但 AX 颜色仍是白昼。 | 匹配 Theme 容器自身；增加实际颜色断言，昼夜/5宽度及基础检查通过。 |
| 2 | Major | src/components/Theme.tsx:7、Dialog.tsx:31、Menu.tsx:25 | 原生 dialog 外的全局 portal 被模态 inert 限制，弹窗内 Menu 看得到但不能获得焦点；变换祖先也会影响普通 fixed 定位。 | 最近 Dialog 的 OverlayHost、manual popover top layer、invoker source 关联；真实独立包消费方验证焦点、位置、Escape、Tab、选择和返回。 |
| 3 | Major | src/styles/controls.css 原 `.ax-dialog[open]` 动画规则 | 派生样式残留 ax-dialog-in，与 Anime 同时写 opacity/transform。实测 marker=open、inline opacity=1，而 computed opacity=0，完成状态与画面不一致。 | 移除旧对话框样式和关键帧，保留单独伪元素反馈；增加完成态 opacity=1、scale=1、animation=none 的运行断言及静态所有权检查。 |
| 4 | Minor | src/styles/components.css:10 | 标准 backdrop-filter 写在前缀属性之前，生产 CSS 优化后部分组件只剩旧前缀；实测原生 Dialog 的 computed backdrop-filter 为 none。 | 前缀在前、标准属性在后；生产和外部消费构建实测 blur(22px)，同时修正玻璃 Card 的实色降级选择器优先级。 |
| 5 | Minor | examples/workbench/Workspace.tsx:38 | 编辑时只用已知字段重建项目，可能丢弃旧验证器允许的项目扩展字段；旧原型的 Object.assign 会保留这些字段。 | 先合并 existing，再写入草稿与更新时间；独立存储流程检查验证项目扩展字段不丢失。 |

## Detailed Analysis

### 1. 手动主题作用域

原规则 `:where(.ax-theme) [data-theme="night"]` 匹配子孙，实际 Theme 的属性在自身；系统深色的兜底媒体规则掩盖了此路径。影响手动主题的视觉和变量说明一致性。修正为：

```diff
- :where(.ax-theme) [data-theme="night"] {
+ .ax-theme[data-theme="night"] {
```

### 2. 原生模态与嵌套浮层

Menu 的 React 上下文原先仍使用 Theme 外层 portal，DOM 不在 modal dialog 内，无法绕过浏览器 inert。复现于安装 tarball 的独立消费项目，焦点断言失败。内部 OverlayHost 使子浮层保留模态内 DOM 关系；manual Popover API 使视觉层不受祖先 transform 影响，React/Anime 仍管理退出与存在性。

```diff
- {children}
+ <OverlayHost root={node}>{children}</OverlayHost>
```

该摘录对应 Dialog.tsx 的孩子宿主修正；Menu.tsx 同时使用 `showPopover({source})`、manual 状态和清理。没有加入另一个浮层库。

### 3. 动画属性竞争

旧规则为 `:where(.ax-theme) .ax-dialog[open] { animation: ax-dialog-in var(--ax-motion-duration-slow) var(--ax-motion-easing-enter); }`，关键帧包含 opacity/transform。它并非只影响颜色或焦点，会覆盖 Anime 的实际呈现。

```diff
- :where(.ax-theme) .ax-dialog[open] { animation: ax-dialog-in var(--ax-motion-duration-slow) var(--ax-motion-easing-enter); }
- @keyframes ax-dialog-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
```

最终移除整个旧对话框规则段及两个旧关键帧，而不是等待额外固定时长掩盖竞争。加载旋转仅在独立 Button 伪元素上使用 CSS，未与 Anime 的目标属性重叠。

## Summary

- 范围：40 个应用/组件/样式/配置/检查文本文件及直接上下文；另核对编译输出、真实消费方和资产哈希。
- 确认问题 5（Critical 0 / Major 3 / Minor 2 / Nit 0）；已修复 5，未解决 0。
- 结论：R3 可交付本地组件库、动效系统、完整工作台和展厅。

## Verification

- npm run build：实际 JS/d.ts/CSS/资产输出、公共入口类型 fixture、示例类型检查及生产构建通过。
- 最终覆盖：工作台 51、展厅 26、交互/生命周期 20、基础 13、真实业务流程 6，共 116 组。最后业务兼容修复后，重新运行了受影响的工作台 51 与流程 6 组。
- React StrictMode 开启；交互专项在 dev 5174 验证额外清理，应用与基础在 production 5175 验证产物。
- 实际 tgz 安装到独立 consumer，独立类型检查、生产构建与浏览器运行通过；没有源码或内部入口别名。锁文件完整性与包匹配，安装 lib 与当前 lib 字节相同。
- 115/116 等历史计数不作为不同源码版本的替代结果；最终结果汇总见 FINAL_REPORT.md 与当前 JSON。
- 旧回归的行为断言保留。只修改唯一菜单实例定位与 React 卸载后的关闭判断；损坏记录与 quota 分开并加强保护。退出模态通过 MutationObserver 在 closing 提交时采样，保留 open/inert/modal 三项断言，避免两次跨进程读取跨过完成边界。
- 静态合同检查确认：库没有存储、固定动画完成 timer、危险 HTML；元素规则有 Theme 边界。资产 src/lib 原样保留 111 项；原型 209 与旧 Arinox 66 基线文件未变。

## Residual Risk

- Microsoft Edge 155 自动化及媒体模拟；未实测真实手机、Safari、Firefox、读屏或主观帧率。
- 增强原生选择与 Popover 有浏览器支持差异；普通 fixed 降级在旧浏览器的复杂嵌套/变换容器需另验。原生行为依据 [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)。
- 本地单活动工作台标签页、50 项上限保持；新来源不自动迁移旧来源记录。没有 CJS、账户同步、npm 发布或远端部署。
