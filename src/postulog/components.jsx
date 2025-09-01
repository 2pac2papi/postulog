import React, { useEffect, useRef } from 'react'
export const cn = (...a)=>a.filter(Boolean).join(' ')
export const Card=({className,children})=> <div className={cn('card',className)}>{children}</div>
export const CardHeader=({className,children})=> <div className={cn('card-header',className)}>{children}</div>
export const CardTitle=({className,children})=> <div className={cn('card-title',className)}>{children}</div>
export const CardContent=({className,children})=> <div className={cn('card-content',className)}>{children}</div>
export const Button=({className,variant='default',...props})=> <button className={cn('btn',variant==='primary'&&'primary',className)} {...props}/>
export const Input=(p)=> <input className='input' {...p}/>
export const Textarea=(p)=> <textarea className='textarea' {...p}/>
export const Label=({children})=> <label className='label'>{children}</label>
export const Badge=({className,children})=> <span className={cn('badge',className)}>{children}</span>
export const Select=({value,onChange,children,className})=> <select className={cn('select',className)} value={value} onChange={e=>onChange?.(e.target.value)}>{children}</select>
export const Option=(p)=> <option {...p}/>
export const Table=({children})=> <table className='w-full text-sm'>{children}</table>
export const TableHeader=({children})=> <thead><tr>{children}</tr></thead>
export const TableHead=({children})=> <th>{children}</th>
export const TableBody=({children})=> <tbody>{children}</tbody>
export const TableRow=({children,className})=> <tr className={className}>{children}</tr>
export const TableCell=({children,className})=> <td className={className}>{children}</td>
export const Tabs=({value,onValueChange,children})=> <div>{React.Children.map(children,c=>React.cloneElement(c,{activeValue:value,setValue:onValueChange}))}</div>
export const TabsList=({children,activeValue,setValue})=> <div className='tabs'>{React.Children.map(children,c=>React.cloneElement(c,{activeValue,setValue}))}</div>
export const TabsTrigger=({value,children,activeValue,setValue})=> <button className={value===activeValue?'tab active':'tab'} onClick={()=>setValue?.(value)}>{children}</button>
export const TabsContent=({value,activeValue,children})=> value===activeValue? <div className='mt-4'>{children}</div>:null
export const Dialog=({open,onOpenChange,children})=> open? <div className='fixed inset-0 z-50 grid place-items-center bg-black/20 p-4' onClick={()=>onOpenChange?.(false)}><div className='card max-h-[90vh] w-full max-w-3xl overflow-y-auto' onClick={e=>e.stopPropagation()}>{children}</div></div>:null
export const CalendarInline=({selected,onSelect})=>{ const ref=useRef(null); useEffect(()=>{ if(ref.current&&selected) ref.current.value=selected.toISOString().slice(0,10)},[selected]); return <input ref={ref} type='date' className='input' onChange={e=>onSelect?.(new Date(e.target.value))}/>}
