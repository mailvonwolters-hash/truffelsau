'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

type Customer = {
  id?: string
  tags?: string[]
  name: string
  street?: string
  postcode?: string
  city?: string
  source?: 'lead' | 'crm' | 'mcdonalds'
  email?: string
  phone?: string
}

type Group = 'all' | 'standard' | 'sh' | 'gl'
type SortKey = 'postcode' | 'name' | 'city'

const groupOf = (customer: Customer) => {
  const value = `${customer.id ?? ''} ${customer.tags?.join(' ') ?? ''} ${customer.name}`.toLowerCase()
  if (/(^|\s)sh-|\bsh\b|simply\s*hair/.test(value)) return 'sh'
  if (/(^|\s)gl-|\bgl\b|great\s*lengths/.test(value)) return 'gl'
  return 'standard'
}

const groupMeta = {
  standard: { label: 'Trüffel', className: 'border-emerald-300 bg-emerald-100 text-emerald-800' },
  sh: { label: 'Simply Hair', className: 'border-blue-300 bg-blue-100 text-blue-800' },
  gl: { label: 'Great Lengths', className: 'border-purple-300 bg-purple-100 text-purple-800' },
} as const

export function MasterDatabase({ customers, onClose }: { customers: Customer[]; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [storedCustomers, setStoredCustomers] = useState<Customer[]>([])
  useEffect(() => {
    try {
      const crm = JSON.parse(localStorage.getItem('truffelsau-crm-customers') || '[]')
      const leads = JSON.parse(localStorage.getItem('truffelsau-leads') || '[]')
      const saved = [...(Array.isArray(crm) ? crm : []), ...(Array.isArray(leads) ? leads : [])]
      if (Array.isArray(saved)) setStoredCustomers(saved)
    } catch { setStoredCustomers([]) }
  }, [])
  const masterCustomers = useMemo(() => {
    const merged = [...customers, ...storedCustomers]
    return Array.from(new Map(merged.map((customer) => [customer.id || `${customer.name}|${customer.postcode}|${customer.city}`, customer])).values())
  }, [customers, storedCustomers])
  const [group, setGroup] = useState<Group>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('truffelsau-master-notes') || '{}') } catch { return {} }
  })
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('truffelsau-master-status') || '{}') } catch { return {} }
  })

  const rows = useMemo(() => masterCustomers.filter((customer) => {
    const haystack = `${customer.name} ${customer.city ?? ''} ${customer.postcode ?? ''}`.toLowerCase()
    return (group === 'all' || groupOf(customer) === group) && haystack.includes(query.toLowerCase())
  }).sort((a, b) => {
    if (sort === 'postcode') return (a.postcode ?? '').localeCompare(b.postcode ?? '', 'de', { numeric: true })
    if (sort === 'city') return (a.city ?? '').localeCompare(b.city ?? '', 'de')
    return a.name.localeCompare(b.name, 'de')
  }), [masterCustomers, group, query, sort])

  function saveNote(customer: Customer, value: string) {
    const key = customer.id || `${customer.name}|${customer.postcode}|${customer.city}`
    const next = { ...notes, [key]: value }
    setNotes(next)
    localStorage.setItem('truffelsau-master-notes', JSON.stringify(next))
  }

  function saveStatus(customer: Customer, value: string) {
    const key = customer.id || `${customer.name}|${customer.postcode}|${customer.city}`
    const next = { ...statuses, [key]: value }
    setStatuses(next)
    localStorage.setItem('truffelsau-master-status', JSON.stringify(next))
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17191b]/70 p-4" role="dialog" aria-modal="true" aria-label="Master-Datenbank & Kundenliste">
    <section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#343938] bg-[#f5f3ef] shadow-2xl">
      <header className="flex items-center justify-between gap-4 border-b border-[#d7d3cc] bg-[#17191b] px-5 py-4 text-[#f5f3ef]">
        <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#b8f23f]">Datenbestand</p><h2 className="text-xl font-bold">Master-Datenbank & Kundenliste</h2><p className="text-sm text-[#9a9c9c]">{rows.length.toLocaleString('de-DE')} von {masterCustomers.length.toLocaleString('de-DE')} Salons geladen</p></div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-[#343938]" aria-label="Master-Datenbank schließen"><X className="size-5" /></button>
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b border-[#d7d3cc] p-4">
        <label className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-[#aaa59c] bg-white px-3 py-2"><Search className="size-4 text-[#52605a]" /><span className="sr-only">Salons durchsuchen</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, Stadt oder PLZ suchen …" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        <select value={group} onChange={(event) => setGroup(event.target.value as Group)} className="rounded-lg border border-[#aaa59c] bg-white px-3 py-2 text-sm"><option value="all">Alle Gruppen</option><option value="standard">Nur Trüffel</option><option value="sh">Nur Simply Hair</option><option value="gl">Nur Great Lengths</option></select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-lg border border-[#aaa59c] bg-white px-3 py-2 text-sm"><option value="postcode">Sortieren: PLZ</option><option value="name">Sortieren: Salon-Name</option><option value="city">Sortieren: Stadt</option></select>
      </div>
      <div className="min-h-0 overflow-auto p-4"><div className="grid gap-3">{rows.map((customer) => { const key = customer.id || `${customer.name}|${customer.postcode}|${customer.city}`; const meta = groupMeta[groupOf(customer)]; return <article key={key} className="rounded-xl border border-[#d7d3cc] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{customer.name}</h3><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span></div><p className="mt-1 text-sm text-[#52605a]">{customer.street || '—'} · {customer.postcode || '—'} {customer.city || '—'}</p><p className="text-xs text-[#77736c]">{customer.phone || customer.email || 'Keine Kontaktdaten'}</p></div><select aria-label={`Status für ${customer.name}`} value={statuses[key] || 'Offen'} onChange={(event) => saveStatus(customer, event.target.value)} className="rounded-lg border border-[#aaa59c] px-2 py-1 text-xs"><option>Offen</option><option>In Bearbeitung</option><option>Kontakt hergestellt</option><option>Kein Bedarf</option></select></div><label className="mt-3 block text-xs text-[#52605a]">Notiz<input value={notes[key] || ''} onChange={(event) => saveNote(customer, event.target.value)} placeholder="Notiz ergänzen …" className="mt-1 w-full rounded-lg border border-[#d7d3cc] bg-[#f5f3ef] px-3 py-2 text-sm outline-none focus:border-[#52605a]" /></label></article> })}</div>{rows.length === 0 && <p className="py-12 text-center text-sm text-[#52605a]">Keine Salons für diese Auswahl gefunden.</p>}</div>
    </section>
  </div>
}
