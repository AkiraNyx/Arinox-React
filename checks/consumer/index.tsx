import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Dialog, Field, Input, Menu, MenuItem, Theme } from '@arinox/react';
import '@arinox/react/styles.css';
function Consumer() {
  const [open,setOpen]=useState(false),[count,setCount]=useState(0);const field=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);
  return <Theme theme="night"><Card><h1>独立包接入</h1><p id="selected">操作 {count}</p><Button id="consumer-open" ref={trigger} onClick={()=>setOpen(true)}>打开弹窗</Button><Dialog id="consumer-dialog" open={open} onOpenChange={setOpen} initialFocusRef={field} returnFocus={()=>trigger.current} aria-label="消费方弹窗">{({close})=><><Field label="名称" htmlFor="consumer-name"><Input ref={field} id="consumer-name" defaultValue="独立消费方"/></Field><Menu id="consumer-menu" aria-label="弹窗内菜单" trigger={props=><Button {...props} id="consumer-menu-trigger">弹窗内操作</Button>}><MenuItem id="consumer-action" onSelect={()=>setCount(value=>value+1)}>选中此项</MenuItem></Menu><Button id="consumer-close" onClick={close}>关闭</Button></>}</Dialog></Card></Theme>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Consumer/></StrictMode>);
