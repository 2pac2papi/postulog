
import React, { useEffect, useMemo, useState } from 'react'
import { 
  Card, CardContent, CardHeader, CardTitle,
  Input, Label, Textarea, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
  CalendarInline, Select, Option, Dialog
} from './components.jsx'

const STORAGE_KEY = 'postulog_apps_v1'
const CURRENCIES = ['PEN','USD','EUR']
const STATUS = [
  { value: 'Draft',      label: 'Borrador',    tone: 'bg-slate-100 text-slate-700' },
  { value: 'Applied',    label: 'Postulado',   tone: 'bg-blue-100 text-blue-700' },
  { value: 'Screening',  label: 'Screening',   tone: 'bg-indigo-100 text-indigo-700' },
  { value: 'Interview',  label: 'Entrevista',  tone: 'bg-purple-100 text-purple-700' },
  { value: 'Offer',      label: 'Oferta',      tone: 'bg-emerald-100 text-emerald-700' },
  { value: 'On Hold',    label: 'En pausa',    tone: 'bg-amber-100 text-amber-700' },
  { value: 'Rejected',   label: 'Rechazado',   tone: 'bg-rose-100 text-rose-700' },
]
const PRIORITY = [
  { value: 'Low', label: 'Baja' },
  { value: 'Medium', label: 'Media' },
  { value: 'High', label: 'Alta' },
]

function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function loadApps(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): [] } catch{ return [] } }
function saveApps(apps){ localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)) }
const statusTone = (s)=> STATUS.find(x=>x.value===s)?.tone || 'bg-slate-100 text-slate-700'
const statusLabel = (s)=> STATUS.find(x=>x.value===s)?.label || s
const toNum = (v)=> { const n = Number(v); return isNaN(n)? undefined : n }

function exportCSV(rows){
  const header = ['dateApplied','company','role','source','link','location','contact','status','salaryMin','salaryMax','currency','nextActionDate','priority','notes']
  const csvEscape = (val)=>{
    if(val===undefined||val===null) return ''
    const str = String(val)
    if (str.includes(',')||str.includes('\\n')||str.includes('\"')) return '\"'+str.replace(/\"/g,'\"\"')+'\"'
    return str
  }
  const body = rows.map(r=> [
    r.dateApplied, r.company, r.role, r.source, r.link||'', r.location||'', r.contact||'', r.status,
    r.salaryMin ?? '', r.salaryMax ?? '', r.currency||'', r.nextActionDate||'', r.priority, r.notes||''
  ].map(csvEscape).join(',')).join('\\n')
  return header.join(',') + '\\n' + body + '\\n'
}
function parseCSVLine(line){
  const res=[]; let cur=''; let inQ=false
  for(let i=0;i<line.length;i++){ const ch=line[i]
    if(inQ){ if(ch==='\"'){ if(line[i+1]==='\"'){cur+='\"'; i++} else {inQ=false} } else {cur+=ch} }
    else { if(ch===','){res.push(cur); cur=''} else if(ch==='\"'){inQ=true} else {cur+=ch} }
  }
  res.push(cur); return res.map(s=>s.trim())
}
function importCSV(text){
  const lines=text.trim().split(/\\r?\\n/); if(lines.length<2) return []
  const header=lines[0].split(',').map(h=>h.trim()); const idx=(k)=> header.indexOf(k)
  const out=[]
  for(let i=1;i<lines.length;i++){ const row=parseCSVLine(lines[i]); const get=(k)=> row[idx(k)] ?? ''
    const a={
      id: uid(),
      dateApplied: String(get('dateApplied')) || new Date().toISOString().slice(0,10),
      company: String(get('company')),
      role: String(get('role')),
      source: String(get('source')),
      link: String(get('link')) || undefined,
      location: String(get('location')) || undefined,
      contact: String(get('contact')) || undefined,
      status: String(get('status')) || 'Applied',
      salaryMin: toNum(get('salaryMin')),
      salaryMax: toNum(get('salaryMax')),
      currency: String(get('currency')) || 'PEN',
      nextActionDate: String(get('nextActionDate')) || undefined,
      priority: String(get('priority')) || 'Medium',
      notes: String(get('notes')) || undefined,
    }
    out.push(a)
  }
  return out
}

export default function App(){
  const [apps,setApps]=useState([])
  const [search,setSearch]=useState('')
  const [statusFilter,setStatusFilter]=useState('All')
  const [priorityFilter,setPriorityFilter]=useState('All')
  const [tab,setTab]=useState('list')
  const [editing,setEditing]=useState(null)
  const [open,setOpen]=useState(false)
  
  useEffect(()=>{ setApps(loadApps()) },[])
  useEffect(()=>{ saveApps(apps) },[apps])
  
  const filtered = useMemo(()=>{
    const term=search.toLowerCase()
    return apps
      .filter(a=> statusFilter==='All' ? true : a.status===statusFilter)
      .filter(a=> priorityFilter==='All' ? true : a.priority===priorityFilter)
      .filter(a=> [a.company,a.role,a.source,a.location,a.contact,a.notes].join(' ').toLowerCase().includes(term))
      .sort((a,b)=> (b.dateApplied||'').localeCompare(a.dateApplied||''))
  },[apps,search,statusFilter,priorityFilter])
  
  const stats = useMemo(()=>{
    const map=new Map(); STATUS.forEach(s=>map.set(s.value,0))
    apps.forEach(a=> map.set(a.status, (map.get(a.status)||0)+1))
    return map
  },[apps])
  
  function resetForm(){
    setEditing({
      id: uid(),
      dateApplied: new Date().toISOString().slice(0,10),
      company: '',
      role: '',
      source: 'LinkedIn',
      link: '',
      location: 'Lima',
      contact: '',
      status: 'Applied',
      salaryMin: undefined,
      salaryMax: undefined,
      currency: 'PEN',
      nextActionDate: undefined,
      priority: 'Medium',
      notes: '',
    })
  }
  function handleDelete(id){ setApps(prev=> prev.filter(p=> p.id!==id)) }
  function handleExport(){
    const csv = exportCSV(apps)
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url; a.download=`postulog_${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }
  function handleImport(file){
    const reader=new FileReader()
    reader.onload=()=>{ try{ const rows=importCSV(String(reader.result||'')); if(rows.length) setApps(prev=> [...rows,...prev]) } catch{ alert('Archivo CSV inválido') } }
    reader.readAsText(file)
  }
  function quickSeed(){
    const today=new Date().toISOString().slice(0,10)
    const demo=[
      { id: uid(), dateApplied: today, company:'TASA', role:'Coordinador de Compras', source:'LinkedIn', link:'', location:'Lima', contact:'Gabriela Méndez <gmendez@tasa.com.pe>', status:'Interview', salaryMin:11000, salaryMax:13000, currency:'PEN', nextActionDate: today, priority:'High', notes:'Enviar caso de éxito y KPI de reducción de SOLPEDs.'},
      { id: uid(), dateApplied: today, company:'Atria Energía', role:'Jefe de Compras', source:'Referido', link:'', location:'Lima', contact:'', status:'Applied', salaryMin:12000, salaryMax:14000, currency:'PEN', nextActionDate: '', priority:'Medium', notes:'Adjuntar logros del proyecto de activos y TCO.'},
    ]
    setApps(prev=> [...demo, ...prev])
  }
  
  return (
    <div className='container-nice'>
      <header className='mb-6 flex items-center justify-between gap-2'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>PostuLog — Seguimiento de Postulaciones</h1>
          <p className='text-sm text-gray-500'>Controla tus procesos (LinkedIn, Laborum, referidos) con filtros, notas, fechas y exportación CSV. Todo se guarda en tu navegador.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <button className='btn' onClick={quickSeed}>Demo</button>
          <button className='btn' onClick={handleExport}>Exportar</button>
          <label className='btn'>
            Importar
            <input type='file' className='hidden-native' accept='.csv' onChange={(e)=> e.target.files && handleImport(e.target.files[0]) } />
          </label>
          <button className='btn primary' onClick={()=>{ resetForm(); setOpen(true) }}>Nueva postulación</button>
        </div>
      </header>
      
      <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Card><CardHeader><CardTitle>Búsqueda</CardTitle></CardHeader><CardContent><Input placeholder='Empresa, cargo, fuente, notas' value={search} onChange={(e)=> setSearch(e.target.value)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Filtrar por estado</CardTitle></CardHeader><CardContent>
          <Select value={statusFilter} onChange={setStatusFilter}>
            <Option value='All'>Todos</Option>
            {STATUS.map(s=> <Option key={s.value} value={s.value}>{s.label}</Option>)}
          </Select>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Filtrar por prioridad</CardTitle></CardHeader><CardContent>
          <Select value={priorityFilter} onChange={setPriorityFilter}>
            <Option value='All'>Todas</Option>
            {PRIORITY.map(p=> <Option key={p.value} value={p.value}>{p.label}</Option>)}
          </Select>
        </CardContent></Card>
      </div>
      
      <div className='mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4'>
        {STATUS.map(s=>(
          <Card key={s.value} className='border-dashed'>
            <CardContent className='flex items-center justify-between'>
              <span className={'badge '+s.tone}>{s.label}</span>
              <span className='text-lg font-semibold'>{stats.get(s.value) || 0}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value='list'>Lista</TabsTrigger>
          <TabsTrigger value='calendar'>Próximas acciones</TabsTrigger>
        </TabsList>
        <TabsContent value='list'>
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Salario</TableHead>
                  <TableHead>Próx. acción</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableHeader>
                <TableBody>
                  {filtered.map(a=>(
                    <TableRow key={a.id}>
                      <TableCell className='whitespace-nowrap'>{a.dateApplied}</TableCell>
                      <TableCell>
                        <div className='font-medium'>{a.company}</div>
                        <div className='text-xs text-gray-500'>{a.contact}</div>
                      </TableCell>
                      <TableCell>
                        <div>{a.role}</div>
                        <div className='text-xs text-gray-500 line-clamp-2 max-w-[320px]'>{a.notes}</div>
                      </TableCell>
                      <TableCell><Badge className={statusTone(a.status)}>{statusLabel(a.status)}</Badge></TableCell>
                      <TableCell className='whitespace-nowrap'>{a.source}</TableCell>
                      <TableCell className='whitespace-nowrap'>{a.location}</TableCell>
                      <TableCell className='whitespace-nowrap'>{(a.salaryMin||a.salaryMax) ? ((a.currency||'PEN')+' '+(a.salaryMin??'')+(a.salaryMax? ' – '+a.salaryMax:'')) : '—'}</TableCell>
                      <TableCell className='whitespace-nowrap'>{a.nextActionDate || '—'}</TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          {a.link? <a className='btn' href={a.link} target='_blank' rel='noreferrer'>Abrir</a> : null}
                          <button className='btn' onClick={()=>{ setEditing(a); setOpen(true) }}>Editar</button>
                          <button className='btn' onClick={()=> handleDelete(a.id)}>Eliminar</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length===0 && (
                    <TableRow><TableCell colSpan={9} className='py-10 text-center text-gray-500'>No hay resultados. Agrega una postulación o cambia los filtros.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='calendar'>
          <Card>
            <CardHeader><CardTitle>Próximas acciones por fecha</CardTitle></CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {groupByDate(apps.filter(a=>a.nextActionDate)).map(({date, items})=>(
                  <div key={date} className='rounded-2xl border p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-700'>{date}</div>
                    <ul className='space-y-2'>
                      {items.map(a=>(
                        <li key={a.id} className='flex items-start justify-between gap-3'>
                          <div>
                            <div className='font-medium'>{a.company} — {a.role}</div>
                            <div className='text-xs text-gray-500'>{a.notes || '(sin notas)'}</div>
                          </div>
                          <Badge className={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {groupByDate(apps.filter(a=>a.nextActionDate)).length===0 && (<div className='text-center text-gray-500'>No hay acciones programadas.</div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        {editing && (
          <>
            <div className='card-header'><div className='text-lg font-semibold'>{editing?.id ? 'Guardar postulación' : 'Nueva postulación'}</div></div>
            <div className='card-content'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div><Label>Fecha de postulación</Label><DateField value={editing.dateApplied} onChange={(v)=> setEditing({...editing, dateApplied:v})} /></div>
                <div><Label>Estado</Label><Select value={editing.status} onChange={(v)=> setEditing({...editing, status:v})}>{STATUS.map(s=> <Option key={s.value} value={s.value}>{s.label}</Option>)}</Select></div>
                <div><Label>Empresa</Label><Input value={editing.company} onChange={(e)=> setEditing({...editing, company:e.target.value})} placeholder='Nombre de la empresa' /></div>
                <div><Label>Cargo</Label><Input value={editing.role} onChange={(e)=> setEditing({...editing, role:e.target.value})} placeholder='Jefe de Compras' /></div>
                <div><Label>Fuente</Label><Input value={editing.source} onChange={(e)=> setEditing({...editing, source:e.target.value})} placeholder='LinkedIn / Laborum / Referido' /></div>
                <div><Label>Link</Label><Input value={editing.link||''} onChange={(e)=> setEditing({...editing, link:e.target.value})} placeholder='URL a la postulación' /></div>
                <div><Label>Ubicación</Label><Input value={editing.location||''} onChange={(e)=> setEditing({...editing, location:e.target.value})} placeholder='Lima / Remoto' /></div>
                <div><Label>Contacto</Label><Input value={editing.contact||''} onChange={(e)=> setEditing({...editing, contact:e.target.value})} placeholder='Nombre, correo o teléfono' /></div>
                <div><Label>Prioridad</Label><Select value={editing.priority} onChange={(v)=> setEditing({...editing, priority:v})}>{['Low','Medium','High'].map(p=> <Option key={p} value={p}>{p}</Option>)}</Select></div>
                <div>
                  <Label>Rango salarial</Label>
                  <div className='grid grid-cols-3 gap-2'>
                    <Input type='number' value={editing.salaryMin??''} onChange={(e)=> setEditing({...editing, salaryMin: e.target.value? Number(e.target.value): undefined})} placeholder='Mín' />
                    <Input type='number' value={editing.salaryMax??''} onChange={(e)=> setEditing({...editing, salaryMax: e.target.value? Number(e.target.value): undefined})} placeholder='Máx' />
                    <Select value={editing.currency||'PEN'} onChange={(v)=> setEditing({...editing, currency:v})}>{CURRENCIES.map(c=> <Option key={c} value={c}>{c}</Option>)}</Select>
                  </div>
                </div>
                <div><Label>Próxima acción</Label><DateField value={editing.nextActionDate||''} onChange={(v)=> setEditing({...editing, nextActionDate:v})} /></div>
                <div className='sm:col-span-2'><Label>Notas</Label><Textarea rows={4} value={editing.notes||''} onChange={(e)=> setEditing({...editing, notes:e.target.value})} placeholder='Seguimiento, acuerdos, pendientes...' /></div>
              </div>
            </div>
            <div className='flex justify-end gap-2 px-4 pb-4'>
              <button className='btn' onClick={()=> { setOpen(false) }}>Cancelar</button>
              <button className='btn primary' onClick={()=> { setApps(prev=> prev.some(p=>p.id===editing.id) ? prev.map(p=> p.id===editing.id? editing: p) : [editing, ...prev]); setOpen(false) }}>Guardar</button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  )
}

function DateField({value, onChange}){
  const date = value ? new Date(value) : undefined
  return (
    <div>
      <CalendarInline selected={date} onSelect={(d)=> d && onChange(d.toISOString().slice(0,10))} />
    </div>
  )
}

function groupByDate(list){
  const map = new Map()
  list.forEach(a=>{
    const key=a.nextActionDate
    map.set(key, [...(map.get(key)||[]), a])
  })
  return Array.from(map.entries()).map(([date, items])=> ({date, items})).sort((a,b)=> a.date.localeCompare(b.date))
}
