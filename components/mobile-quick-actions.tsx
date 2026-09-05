'use client'

import { CalendarDays, Coffee, Crosshair, Settings } from 'lucide-react'

type Channel = 'standard' | 'sh' | 'gl'
type MobileQuickActionsProps = {
  activeChannel: Channel
  onChannelChange: (channel: Channel) => void
  onGps: () => void
  onCalendar: () => void
  onAdmin: () => void
  onPause: () => void
}

export function MobileQuickActions({ activeChannel, onChannelChange, onGps, onCalendar, onAdmin, onPause }: MobileQuickActionsProps) {
  const actions = [
    { label: 'GPS Live-Suche', icon: Crosshair, onClick: onGps },
    { label: 'Kalender / Wochenplanung', icon: CalendarDays, onClick: onCalendar },
    { label: 'Admin', icon: Settings, onClick: onAdmin },
    { label: 'Pause & Verpflegung', icon: Coffee, onClick: onPause },
  ]

  return <div className="grid gap-2 lg:hidden" aria-label="Schnellaktionen"><span className="sr-only">Schnellaktionen für den Außendienst</span><div className="grid grid-cols-3 gap-1 rounded-xl border border-[#52605a] p-1">{(['standard', 'sh', 'gl'] as Channel[]).map((channel) => <button key={channel} type="button" onClick={() => onChannelChange(channel)} className={`min-h-11 rounded-lg px-2 py-2 text-xs font-semibold ${activeChannel === channel ? 'bg-[#b8f23f] text-[#17191b]' : 'text-[#9a9c9c]'}`}>{channel === 'standard' ? 'Trüffel' : channel === 'sh' ? 'Simply' : 'Great Lengths'}</button>)}</div><div className="grid grid-cols-2 gap-2">{actions.map(({ label, icon: Icon, onClick }) => <button key={label} type="button" onClick={onClick} className="flex min-h-14 items-center gap-2 rounded-xl border border-[#52605a] bg-[#202423] px-3 py-3 text-left text-xs font-semibold text-[#f5f3ef] shadow-sm transition hover:border-[#b8f23f] active:scale-[.98]"><Icon className="size-4 shrink-0 text-[#b8f23f]" aria-hidden="true" /><span>{label}</span></button>)}</div></div>
}
