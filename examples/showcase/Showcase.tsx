import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Glass, Theme } from '@arinox/react';
import type { ThemeName } from '@arinox/react';
import { Foundations, MotionRules, tokenNames } from './Foundations.js';
import type { Tokens } from './Foundations.js';
import { ComponentExamples } from './ComponentExamples.js';
function initialTheme(): ThemeName {
  try { const value=JSON.parse(localStorage.getItem('arinox-fusion-v1') || 'null');if(value?.theme==='day'||value?.theme==='night')return value.theme; }catch{}
  return matchMedia('(prefers-color-scheme:dark)').matches?'night':'day';
}
export function Showcase() {
  const [theme,setTheme]=useState(initialTheme), [tokens,setTokens]=useState<Tokens>({});const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  useLayoutEffect(()=>{const style=getComputedStyle(root.current!);setTokens(Object.fromEntries(tokenNames.map(name=>[name,style.getPropertyValue(name).trim()])));},[theme]);
  return <Theme ref={root} theme={theme} className="showcase-page app-sandbox"><a className="skip-link" href="#gallery-main">跳到组件与规范</a><div className="gallery-shell"><Glass className="gallery-sidebar glass"><a className="gallery-brand" href="index.html" aria-label="Arinox 夜明，返回工作台"><span className="gallery-mark" aria-hidden="true"/><span>ARINOX<small>夜明 · React</small></span></a><p className="sidebar-caption">组件与规范</p><nav className="gallery-nav" aria-label="展厅章节">{[['foundations','基础规则'],['components','组件展厅'],['motion','运动与反馈'],['rules','使用原则']].map(([id,label],index)=><a key={id} href={'#'+id}><span>0{index+1}</span>{label}</a>)}</nav><div className="sidebar-end"><p>让内容保持纸感，<br/>把玻璃留给操作。</p><a href="index.html">返回工作台 ↗</a><small>React + Anime.js · 本地版本</small></div></Glass><main id="gallery-main" className="gallery-main"><header className="gallery-topbar"><span>Arinox <span aria-hidden="true">/</span> React component library</span><Glass className="theme-preview glass" role="group" aria-label="主题预览">{(['day','night'] as const).map(value=><Button key={value} variant="ghost" size="sm" data-preview-theme={value} aria-pressed={theme===value} onClick={()=>setTheme(value)}>{value==='day'?'白昼':'夜晚'}</Button>)}</Glass></header><section className="gallery-intro"><p className="eyebrow">A LANGUAGE OF LIGHT &amp; PAPER</p><h1>让每个细节，<br/>都有依据。</h1><p className="intro-description">纸感承载内容，玻璃组织操作。颜色、形状与运动，遵循同一套规则。</p><div className="intro-meta"><span>8 类组件</span><span>昼 / 夜双主题</span><span>公共入口组合</span></div><p className="working-note">这是当前 Fusion 的 React 工作基线。11px 控件圆角来自你的选择，其余层级继续通过实际界面验证。</p></section><Foundations tokens={tokens}/><ComponentExamples/><MotionRules tokens={tokens}/><footer className="gallery-footer"><span>Arinox React · 本地工作基线</span><a href="index.html">在完整工作台中查看 ↗</a><p>浏览器自动化与媒体模拟不等于真实手机、其他浏览器或读屏验收。</p></footer></main></div></Theme>;
}
