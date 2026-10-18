# CR-R01 · 基础组件与作用域样式

2026-10-18，full / Minor，一次范围审查。

## Findings

最终范围内无确认达到 Minor 或更高阈值的未解决问题。

## Summary

- 审查：27 个基础源码、样式、配置、示例和检查文件；二进制字体按原文件复制并保留许可证，不声称逐行审查依赖。
- 确认问题计数：0（Critical 0 / Major 0 / Minor 0 / Nit 0）。
- 结论：R1 可推进 R2；尚未把动画、菜单、弹窗或完整页面宣称完成。

## Evidence

- 示例与类型 fixture 从 `@arinox/react` 读取实际 lib 导出；tsc 输出独立 JS/d.ts，样式显式导出。没有内部组件路径别名或业务存储依赖。
- 原生 ref、受控/非受控值、只读/禁用/错误、半选与原生选择由浏览器验证；Checkbox 仅通过 DOM 属性设置 indeterminate，不接管原生 checked/onChange。
- 字体注册之外，元素样式限定于 ax-theme；宿主按钮未收到库的字体或圆角重置。
- 初次浏览器检查发现 Vite 把外部 SVG sprite 内联成 data URL，导致 use 受同源限制。已用相同原始几何的静态 React SVG 替代，保留原 sprite 文件；复验无该错误。favicon 资源亦已补齐。
- 公共 Node SSR import 自检通过。一次 PowerShell 单行引号导致的自检语法错误已改用原样多行脚本，未将其当作产品语法失败。

## Verification

- `npm run build`：类型声明、示例类型检查、Vite 生产构建通过。
- `node checks/foundation.cjs http://127.0.0.1:5174/`：13 组通过，StrictMode 控制台/运行时错误 0。
- `npm run check:protected`：Fusion 209 与旧 Arinox 66 文件哈希未变；旧预览未停止。
- 动效与完整应用将在 R2/R3 验证；本次结果没有替代真实手机、其他浏览器或读屏验收。
