# CR-R02 · Anime.js 与交互组件

2026-10-18，full / Minor，一次正式范围审查，包含范围内最小修复及复验。

## Findings

| # | 严重度 | 位置 | 触发与影响 | 修复 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | Minor | src/components/Menu.tsx:48 | aria-disabled 项仍是原生可点击按钮；原处理先调用 onClick 才检查 aria-disabled，调用方副作用可能执行。 | 将禁用判断放在所有调用方处理之前；加入会累加 100 的禁用项点击回归。 | 已修复，19 组完整复验通过 |

## Summary

- 范围：motion.ts、Tabs/Menu/Dialog、overlays 样式、公共导出、交互示例与专项检查及直接调用方。
- 确认问题 1（Critical 0 / Major 0 / Minor 1 / Nit 0）；未解决 0。
- R2 可推进 R3；未将检查场景当作完整产品示例交付。

## Evidence

- React 决定 open/presence；Anime.js 只写分配给它的 opacity/transform/指示块几何。CSS 保留颜色、焦点与独立伪元素反馈，不争用同一目标属性。
- 每次过渡使用 createScope.add；清理先采样当前帧、取消实例，再 revert 作用域。旧回调受 effect 活跃标记限制；中断后续接保存的帧，不积累活跃作用域。
- 原生 dialog 直到 Anime onComplete 才 close/移除；关闭中 inert 且仍为 modal；原生选择先处理 Escape。受控与非受控路径均实测。
- useSyncExternalStore 订阅减少动效并清理监听；偏好改变会完成当前过渡。没有以固定 timeout 猜测动画完成。
- 布局 hook 在应用状态变化前采样，提交后以 Anime 实施位置过渡，重入前清理旧作用域；窗口变化与卸载会清理。
- Scope/Timer 的 cancel/complete 类型与文档核对 installed Anime.js 4.5.0；React StrictMode 一直启用。

## Fix Patches

```diff
- onClick?.(event); if (event.defaultPrevented || disabled) return;
+ if (disabled) { event.preventDefault(); return; }
+ onClick?.(event); if (event.defaultPrevented) return;
```

该片段描述 src/components/Menu.tsx 的同一处理顺序修正；工作区源码与新增 aria-disabled 点击断言为最终实现。

## Verification

- npm run build：声明、公共入口类型 fixture（含拒绝未知 variant）、示例类型与生产构建通过。
- interactions.cjs：19 组，覆盖方向键/禁用/外部关闭/焦点、原生表单与选择、退出模态、当前帧中断、快速开关、布局、卸载恢复样式与无延迟回调、live reduced motion。
- foundation.cjs：13 组重新通过。错误为 0。
- 检查中 400ms 等待仅用于证明卸载后无迟到回调；组件完成/退出逻辑没有固定等待。
- 真实设备、读屏和其他浏览器仍未验证。
