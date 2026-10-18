import { createRef } from 'react';
import { Button, Card, Checkbox, Field, Glass, Icon, Inline, Input, Select, Stack, Switch, Textarea, Theme } from '@arinox/react';
import type { ButtonProps, CheckboxProps, InputProps, ThemeName } from '@arinox/react';
import { Dialog, Menu, MenuItem, Tabs } from '@arinox/react';
const buttonProps: ButtonProps = { variant: 'primary', type: 'submit', 'aria-label': '提交' };
const inputProps: InputProps = { defaultValue: '非受控', readOnly: true, ref: createRef<HTMLInputElement>() };
const checkProps: CheckboxProps = { indeterminate: true, ref: createRef<HTMLInputElement>() };
const theme: ThemeName = 'night';
export const publicExample = <Theme theme={theme}><Stack><Card><Field label="名称" htmlFor="public-name"><Input id="public-name" {...inputProps} /></Field><Textarea name="note" /><Select name="category" defaultValue="a"><option value="a">A</option></Select><Checkbox {...checkProps} /><Switch defaultChecked /><Inline><Button {...buttonProps}><Icon name="check" />保存</Button></Inline></Card><Glass>操作层</Glass></Stack></Theme>;
export const interactiveExample = <Theme><Tabs label="示例标签" defaultValue="a" items={[{value:'a',label:'A',content:'Panel'}]} /><Menu aria-label="操作" trigger={props => <Button {...props}>打开</Button>}><MenuItem disabled>不可用</MenuItem><MenuItem onSelect={() => {}}>操作</MenuItem></Menu><Dialog ref={createRef<HTMLDialogElement>()} defaultOpen aria-label="示例弹窗">{({close,phase}) => <Button disabled={phase === 'closing'} onClick={close}>关闭</Button>}</Dialog></Theme>;
// @ts-expect-error Variants are a closed public contract.
export const invalidVariant = <Button variant="unknown" />;
