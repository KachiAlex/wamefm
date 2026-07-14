import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { api, useBroadcasts, useSermons, useUsers, usePrayers, useMusic, useDashboardAnalytics } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import {
  Users, Radio, Headphones, MessageSquare, Settings, Heart,
  BookOpen, StopCircle,
  Menu, X, Loader2, FileText, ListMusic,
  Search, Bell, HelpCircle, LayoutGrid
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const BroadcastManager = lazy(() => import('../components/admin/BroadcastManager'))
const SermonManager = lazy(() => import('../components/admin/SermonManager'))
const ChatSupervisor = lazy(() => import('../components/admin/ChatSupervisor'))
const AdminSettings = lazy(() => import('../components/admin/AdminSettings'))
const MusicManager = lazy(() => import('../components/admin/MusicManager'))
const GuestSpeakerManager = lazy(() => import('../components/admin/GuestSpeakerManager'))
const PrayerManager = lazy(() => import('../components/admin/PrayerManager'))
const TestimonyManager = lazy(() => import('../components/admin/TestimonyManager'))
const EventManager = lazy(() => import('../components/admin/EventManager'))
const DailyVerseManager = lazy(() => import('../components/admin/DailyVerseManager'))
const PrintManager = lazy(() => import('../components/admin/PrintManager'))
const SermonPlaylistManager = lazy(() => import('../components/admin/SermonPlaylistManager'))
const SermonRadioManager = lazy(() => import('../components/admin/SermonRadioManager'))

interface ChatMessage { id: string; broadcast_id?: string; user_name: string; message: string; created_at: string }

type Tab = 'dashboard' | 'broadcasts' | 'users' | 'sermons' | 'chat' | 'settings' | 'music' | 'speakers' | 'prayer' | 'testimonies' | 'events' | 'dailyverse' | 'print' | 'playlists' | 'radio'

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function LiveWaveform({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 40 }, () => 15))
  useEffect(() => {
    if (!active) { setBars(Array.from({ length: 40 }, () => 15)); return }
    const id = setInterval(() => {
      setBars(Array.from({ length: 40 }, () => Math.max(10, Math.min(100, Math.random() * 90 + 10))))
    }, 200)
    return () => clearInterval(id)
  }, [active])
  return (
    <div className="flex items-end gap-[2px] h-8 my-2">
      {bars.map((h, i) => (
        <div key={i} className={`w-[3px] rounded-full transition-all duration-200 ${active ? 'bg-[var(--violet)]' : 'bg-[var(--violet)]/30'}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}


export default function AdminDashboard() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: broadcasts = [] } = useBroadcasts()
  const { data: sermons = [] } = useSermons()
  const { data: users = [] } = useUsers()
  const { data: musicTracks = [] } = useMusic()
  const { data: prayers = [] } = usePrayers()
  const { data: analytics } = useDashboardAnalytics()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [bcActionLoading, setBcActionLoading] = useState(false)
  const [liveElapsed, setLiveElapsed] = useState(0)

  /* -- Live broadcast duration timer -- */
  useEffect(() => {
    const live = broadcasts.find(b => b.status === 'live')
    if (!live?.started_at) { setLiveElapsed(0); return }
    const start = new Date(live.started_at).getTime()
    setLiveElapsed(Math.floor((Date.now() - start) / 1000))
    const id = setInterval(() => setLiveElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [broadcasts])

  const dashboard = analytics?.stats ?? null
  const listenerChart = analytics?.listenerHistory ?? []
  const loading = !analytics

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
  }, [user, navigate])

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
    queryClient.invalidateQueries({ queryKey: ['sermons'] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
    queryClient.invalidateQueries({ queryKey: ['music'] })
    queryClient.invalidateQueries({ queryKey: ['prayers'] })
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    queryClient.invalidateQueries({ queryKey: ['print-media'] })
    queryClient.invalidateQueries({ queryKey: ['sermon-playlists'] })
  }

  async function fetchChat() {
    try {
      const res = await api.get('/broadcasts')
      const bcs = res.data.broadcasts as any[]
      const allMessages: ChatMessage[] = []
      for (const b of bcs.slice(0, 5)) {
        try { const msgRes = await api.get(`/chat/broadcast/${b.id}`); allMessages.push(...msgRes.data.messages) } catch {}
      }
      try { const general = await api.get('/chat/general'); allMessages.push(...general.data.messages) } catch {}
      setChatMessages(allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (err) { console.error('Failed to fetch chat:', err) }
  }

  useEffect(() => {
    if (activeTab === 'chat') { fetchChat(); const iv = setInterval(fetchChat, 5000); return () => clearInterval(iv) }
  }, [activeTab])

  async function updateUserRole(userId: string, newRole: string) {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole })
      queryClient.setQueryData(['users'], (old: any) => old?.map((u: any) => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to update role', 'error') }
  }

  /* -- Broadcast control helpers -- */
  async function endLiveBroadcast() {
    const live = broadcasts.find(b => b.status === 'live')
    if (!live) return
    setBcActionLoading(true)
    try {
      await api.post(`/broadcasts/${live.id}/end`)
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to end broadcast', 'error')
    } finally {
      setBcActionLoading(false)
    }
  }

  if (!user || user.role !== 'admin') return null

  const screenTitles: Record<string, string> = {
    dashboard: 'Overview', broadcasts: 'Broadcast Console', playlists: 'Playlist Manager',
    print: 'Print Media', prayer: 'Prayer Requests', users: 'User Management',
    sermons: 'Sermons', chat: 'Chat Moderation', settings: 'System Settings',
    music: 'Music Library', speakers: 'Guest Speakers', testimonies: 'Testimonies',
    events: 'Events', dailyverse: 'Daily Word'
  }

  const live = broadcasts.find(b => b.status === 'live')

  function NavItem({ label, tab, icon: I, badge }: any) {
    const active = activeTab === tab
    return (
      <button onClick={() => { setActiveTab(tab); setMobileSidebarOpen(false) }}
        className="sb-item" style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 4,
          fontSize: 12.5, fontWeight: 600, color: active ? 'var(--lav)' : 'var(--fog2)',
          background: active ? 'rgba(139,92,246,.08)' : 'transparent', border: 'none', width: '100%', textAlign: 'left',
          transition: 'all .13s', cursor: 'pointer', position: 'relative'
        }}>
        {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '60%', borderRadius: 2, background: 'var(--violet)' }} />}
        <I className="w-[14px] h-[14px] flex-shrink-0" style={{ opacity: active ? 1 : .6 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge ? <span style={{ marginLeft: 'auto', background: 'var(--violet)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, minWidth: 16, textAlign: 'center' }}>{badge}</span> : null}
      </button>
    )
  }

  function NavGroup({ title }: { title: string }) {
    return <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fog)', padding: '14px 10px 5px', userSelect: 'none', fontWeight: 600 }}>{title}</div>
  }

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--rim)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
          <circle cx="16" cy="16" r="15" fill="var(--abyss)" stroke="var(--violet)" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="10" fill="none" stroke="var(--lav)" strokeWidth=".7" strokeDasharray="2 3" />
          <rect x="12.5" y="7" width="7" height="11" rx="3.5" fill="var(--violet)" />
          <line x1="16" y1="18" x2="16" y2="22" stroke="var(--lav)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="22" x2="20" y2="22" stroke="var(--lav)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13.5" y1="11" x2="18.5" y2="11" stroke="#fff" strokeWidth=".7" opacity=".45" />
          <line x1="13.5" y1="13.5" x2="18.5" y2="13.5" stroke="#fff" strokeWidth=".7" opacity=".45" />
        </svg>
        <div>
          <div className="cg" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.02em', lineHeight: 1, color: 'var(--parch)' }}>Embassy Radio</div>
          <div style={{ fontSize: 9.5, color: 'var(--fog2)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 600 }}>Admin Console</div>
        </div>
        <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden ml-auto" style={{ color: 'var(--fog)', background: 'transparent', border: 'none', cursor: 'pointer' }}><X className="w-5 h-5" /></button>
      </div>

      {/* On-air pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: live ? 'rgba(245,158,11,.08)' : 'var(--panel)',
        border: `1px solid ${live ? 'rgba(245,158,11,.25)' : 'var(--rim)'}`,
        margin: '12px 12px 4px', borderRadius: 6, padding: '8px 12px'
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: live ? 'var(--ember)' : 'var(--fog)',
          display: 'inline-block', flexShrink: 0, animation: live ? 'airglow 2s ease-in-out infinite' : 'none'
        }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: live ? 'var(--ember)' : 'var(--fog2)' }}>{live ? 'On air' : 'Off air'}</span>
        {live && <span className="mono" style={{ fontSize: 11, color: 'var(--ember)', marginLeft: 'auto' }}>{formatDuration(liveElapsed)}</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        <NavGroup title="Studio" />
        <NavItem label="Overview" tab="dashboard" icon={LayoutGrid} />
        <NavItem label="Broadcast Console" tab="broadcasts" icon={Radio} />
        <NavItem label="Playlist Manager" tab="playlists" icon={ListMusic} />
        <NavItem label="Sermon Radio" tab="radio" icon={Radio} />
        <NavGroup title="Content" />
        <NavItem label="Sermons" tab="sermons" icon={BookOpen} />
        <NavItem label="Print Media" tab="print" icon={FileText} />
        <NavGroup title="Pastoral" />
        <NavItem label="Prayer Requests" tab="prayer" icon={Heart} badge={prayers.length} />
        <NavGroup title="Community" />
        <NavItem label="Chat Moderation" tab="chat" icon={MessageSquare} badge={chatMessages.length} />
        <NavItem label="User Management" tab="users" icon={Users} />
        <NavGroup title="Settings" />
        <NavItem label="System Settings" tab="settings" icon={Settings} />
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--rim)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--violet)', color: '#fff',
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--parch)' }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: 10.5, color: 'var(--fog2)', textTransform: 'capitalize' }}>{user?.role || 'Admin'}</div>
        </div>
        <button onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false) }} style={{ background: 'transparent', border: 'none', color: 'var(--fog)', cursor: 'pointer', padding: 4 }}>
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--abyss)', color: 'var(--parch)' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />}
      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <aside className="lg:hidden fixed inset-y-0 left-0 z-50" style={{ width: 'var(--sidebar-w)', background: 'var(--abyss)', borderRight: '1px solid var(--rim)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {sidebarContent}
        </aside>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 'var(--sidebar-w)', background: 'var(--abyss)', borderRight: '1px solid var(--rim)', overflowY: 'auto', zIndex: 50 }}>
        {sidebarContent}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="h-14 shrink-0 flex items-center gap-3 sm:gap-4 px-3 sm:px-6 max-w-full overflow-hidden" style={{
          background: 'var(--abyss)', borderBottom: '1px solid var(--rim)', zIndex: 30
        }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--fog)', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Open navigation"><Menu className="w-5 h-5" /></button>
          <div className="cg truncate" style={{ fontSize: 20, fontWeight: 600, flex: 1, minWidth: 0, color: 'var(--parch)' }}>{screenTitles[activeTab] || activeTab}</div>
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8, background: 'var(--panel)', border: '1px solid var(--rim)', borderRadius: 6, padding: '6px 12px', width: 220, maxWidth: '40vw', flexShrink: 1, minWidth: 0 }}>
            <Search className="w-[13px] h-[13px] flex-shrink-0" style={{ color: 'var(--fog)' }} />
            <input type="text" placeholder="Search sermons, files…" aria-label="Search dashboard"
              style={{ background: 'transparent', border: 'none', color: 'var(--parch)', fontSize: 12.5, width: '100%', outline: 'none', minWidth: 0 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button aria-label="Notifications" style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', border: 'none', color: 'var(--fog2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all .13s' }} className="hover:text-[var(--lav)]">
              <Bell className="w-[15px] h-[15px]" />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--ember)', border: '1.5px solid var(--abyss)' }} />
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--rim)' }} />
            <button aria-label="Help" style={{ width: 32, height: 32, borderRadius: 6, background: 'transparent', border: 'none', color: 'var(--fog2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .13s' }} className="hover:text-[var(--lav)]">
              <HelpCircle className="w-[15px] h-[15px]" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto dashboard-content p-3 sm:p-5">
          {activeTab === 'dashboard' ? (
            <div>
              {/* KPI row */}
              <div className="kpi-row">
                <div className="kpi" style={{ '--k-accent': 'var(--ember)' } as any}>
                  <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.1)' }}>
                    <Headphones className="w-4 h-4" style={{ color: 'var(--ember)' }} />
                  </div>
                  <div className="kpi-n cg">{loading ? '—' : (dashboard?.listenersOnline?.toLocaleString() || '0')}</div>
                  <div className="kpi-l">Listening now</div>
                  <div className="kpi-d up">▲ {live ? 'Live broadcast' : 'No stream active'}</div>
                </div>
                <div className="kpi" style={{ '--k-accent': 'var(--violet)' } as any}>
                  <div className="kpi-icon">
                    <BookOpen className="w-4 h-4" style={{ color: 'var(--violet)' }} />
                  </div>
                  <div className="kpi-n cg">{sermons.length}</div>
                  <div className="kpi-l">Sermons in library</div>
                  <div className="kpi-d up">▲ {sermons.length > 0 ? `${sermons.length} total` : 'Add your first'}</div>
                </div>
                <div className="kpi" style={{ '--k-accent': 'var(--green)' } as any}>
                  <div className="kpi-icon" style={{ background: 'rgba(52,211,153,.1)' }}>
                    <Users className="w-4 h-4" style={{ color: 'var(--green)' }} />
                  </div>
                  <div className="kpi-n cg">{loading ? '—' : (dashboard?.totalListenersToday?.toLocaleString() || '0')}</div>
                  <div className="kpi-l">Total listeners today</div>
                  <div className="kpi-d up">▲ {dashboard?.totalListenersToday ? '+12% vs yesterday' : 'No data yet'}</div>
                </div>
                <div className="kpi" style={{ '--k-accent': 'var(--blue)' } as any}>
                  <div className="kpi-icon" style={{ background: 'rgba(96,165,250,.1)' }}>
                    <Heart className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                  </div>
                  <div className="kpi-n cg">{prayers.length}</div>
                  <div className="kpi-l">Prayer requests</div>
                  <div className="kpi-d nu">— {prayers.length > 0 ? `${prayers.length} total` : 'None yet'}</div>
                </div>
              </div>

              {/* Chart + Quick actions */}
              <div className="g2" style={{ marginBottom: 18 }}>
                <div className="dcard">
                  <div className="dcard-h">
                    <h3>Listener activity — this week</h3>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--fog)' }}>
                      {listenerChart.length > 0 ? `Peak: ${Math.max(...listenerChart.map((d: any) => d.l || 0))}` : 'No data'}
                    </span>
                  </div>
                  <div className="dcard-b">
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={listenerChart.length ? listenerChart : [{ time: 'Mon', l: 0 }, { time: 'Tue', l: 0 }, { time: 'Wed', l: 0 }, { time: 'Thu', l: 0 }, { time: 'Fri', l: 0 }, { time: 'Sat', l: 0 }, { time: 'Sun', l: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--rim)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--fog)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--fog)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--rim2)', borderRadius: 8, fontSize: 12, color: 'var(--parch)' }} />
                        <Line type="monotone" dataKey="l" name="Listeners" stroke="var(--violet)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--violet)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 4px' }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} className="mono" style={{ fontSize: 10, color: 'var(--fog)' }}>{d}</span>)}
                    </div>
                  </div>
                </div>
                <div className="dcard">
                  <div className="dcard-h"><h3>Quick actions</h3></div>
                  <div className="dcard-b" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="dbtn dbtn-violet" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('broadcasts')}>
                      <Radio className="w-3.5 h-3.5" /> Open Broadcast Console
                    </button>
                    <button className="dbtn dbtn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('playlists')}>
                      <ListMusic className="w-3.5 h-3.5" /> Manage Playlist
                    </button>
                    <button className="dbtn dbtn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('print')}>
                      <FileText className="w-3.5 h-3.5" /> Upload Print Media
                    </button>
                    <button className="dbtn dbtn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('prayer')}>
                      <Heart className="w-3.5 h-3.5" /> Prayer Requests
                      {prayers.length > 0 && <span style={{ marginLeft: 'auto', background: 'var(--violet)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>{prayers.length}</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's programme / schedule strip */}
              <div className="dcard" style={{ marginBottom: 18 }}>
                <div className="dcard-h">
                  <h3>Today's programme</h3>
                  <button className="dbtn dbtn-ghost dbtn-sm" onClick={() => setActiveTab('broadcasts')}>View schedule</button>
                </div>
                <div className="dcard-b">
                  <div className="sched-strip">
                    {(() => {
                      const upcoming = broadcasts.filter((b: any) => b.status === 'scheduled' || b.status === 'live').slice(0, 6)
                      if (upcoming.length === 0) return <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fog)', fontSize: 13 }}>No scheduled broadcasts</div>
                      return upcoming.map((b: any) => (
                        <div key={b.id} className={`sched-card${b.status === 'live' ? ' now' : ''}`}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: b.status === 'live' ? 'var(--ember)' : 'var(--fog2)' }}>
                            {b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            {b.status === 'live' && <span className="dtag dtag-live" style={{ marginLeft: 6, padding: '2px 6px', fontSize: 9 }}>LIVE</span>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--parch)', marginTop: 4 }}>{b.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--fog2)', marginTop: 2 }}>{b.description || 'Scheduled broadcast'}</div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent sermons */}
              <div className="dcard">
                <div className="dcard-h">
                  <h3>Recent sermons</h3>
                  <button className="dbtn dbtn-ghost dbtn-sm" onClick={() => setActiveTab('sermons')}>View all</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="dtbl">
                    <thead><tr><th>Title</th><th>Speaker</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {(sermons.length ? sermons : []).slice(0, 5).map((s: any) => (
                        <tr key={s.id}>
                          <td><strong>{s.title}</strong></td>
                          <td>{s.speaker}</td>
                          <td className="mono" style={{ fontSize: 12 }}>{s.date ? s.date.split('T')[0] : '-'}</td>
                          <td><span className="dtag dtag-pub">Published</span></td>
                        </tr>
                      ))}
                      {sermons.length === 0 && <tr><td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--fog)' }}>No sermons uploaded yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'broadcasts' ? (
            <div>
              {/* Aurora + Console */}
              <div className={`aurora-wrap${live ? ' is-live' : ''}`} style={{ marginBottom: 18 }}>
                <div className="aurora-ring" />
                <div className="aurora-ring" />
                <div className="aurora-ring" />
                <div className={`console${live ? ' is-live' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: live ? 'var(--ember)' : 'var(--fog)' }}>
                        {live ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ember)', display: 'inline-block', animation: 'airglow 2s ease-in-out infinite' }} /> : <Radio className="w-3 h-3" />}
                        {live ? 'ON AIR' : 'OFF AIR'}
                      </div>
                      <div className="cg mono" style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginTop: 4 }}>{formatDuration(liveElapsed)}</div>
                      <div style={{ fontSize: 12, color: 'var(--fog2)', marginTop: 2 }}>{live ? 'Broadcast running · WameFM' : 'No broadcast running'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fog)', fontWeight: 600 }}>Currently airing</div>
                      <div className="cg" style={{ fontSize: 18, fontWeight: 600, color: 'var(--parch)', marginTop: 2 }}>{live ? (live.title || 'Live Broadcast') : '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fog2)', marginTop: 2 }}>{live ? (live.description || 'Live stream') : 'Start a broadcast to go live'}</div>
                    </div>
                    <div>
                      {live ? (
                        <button onClick={endLiveBroadcast} disabled={bcActionLoading} className="dbtn dbtn-red" style={{ padding: '12px 28px', fontSize: 15 }}>
                          {bcActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />} End Broadcast
                        </button>
                      ) : (
                        <button onClick={() => {}} className="dbtn dbtn-violet" style={{ padding: '12px 28px', fontSize: 15 }}>
                          <Radio className="w-3.5 h-3.5" /> Go Live
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Live waveform inside console */}
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(7,4,26,.5)', borderRadius: 8, border: '1px solid var(--rim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--fog)', fontWeight: 600 }}>Live waveform</span>
                      <span className="mono" style={{ fontSize: 10, color: live ? 'var(--ember)' : 'var(--fog)' }}>{live ? 'STREAMING' : 'IDLE'}</span>
                    </div>
                    <LiveWaveform active={!!live} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button className="dbtn dbtn-ghost dbtn-sm">Audio</button>
                    <button className="dbtn dbtn-ghost dbtn-sm">Test stream</button>
                    <button className="dbtn dbtn-ghost dbtn-sm" onClick={() => setActiveTab('playlists')}>Load playlist</button>
                    <button className="dbtn dbtn-ghost dbtn-sm">Announce</button>
                  </div>
                </div>
              </div>

              {/* Active queue */}
              <div className="dcard" style={{ marginBottom: 18 }}>
                <div className="dcard-h">
                  <h3>Active queue</h3>
                  <button className="dbtn dbtn-violet dbtn-sm" onClick={() => setActiveTab('playlists')}>Manage</button>
                </div>
                <div className="dcard-b">
                  {(sermons.length ? sermons : []).slice(0, 4).map((s: any, i: number) => (
                    <div key={s.id} className="cq-item">
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? 'var(--ember)' : i === 1 ? 'var(--lav)' : 'var(--rim2)', flexShrink: 0 }} />
                      <span className="mono" style={{ fontSize: 12, color: 'var(--fog2)', width: 20 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--parch)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--fog2)' }}>{s.speaker}</div>
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--fog)' }}>{s.duration || '—'}</span>
                      <button className="dbtn dbtn-ghost dbtn-xs">Skip</button>
                    </div>
                  ))}
                  {sermons.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--fog)', fontSize: 13 }}>No items in queue</div>}
                </div>
              </div>

              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                <BroadcastManager broadcasts={broadcasts as any} onRefresh={refresh} />
              </Suspense>
            </div>
          ) : activeTab === 'users' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>User Management</h3></div>
              <div className="dcard-b">
              {loading ? (
                <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--violet)' }} /><p className="mt-3 text-xs" style={{ color: 'var(--fog)' }}>Loading users...</p></div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center"><Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--rim2)' }} /><p className="text-xs" style={{ color: 'var(--fog)' }}>No users yet</p></div>
              ) : null}
              <div className="space-y-1">
                {users.map(u => u ? (
                  <div key={u.id} className="px-4 py-3 rounded-lg flex items-center justify-between" style={{ transition: 'all .13s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div><p className="text-xs font-medium" style={{ color: 'var(--parch)' }}>{u.name || u.email}</p><p className="text-[10px]" style={{ color: 'var(--fog)' }}>{u.email}</p></div>
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} className="text-xs rounded-md px-2.5 py-1 outline-none" style={{ background: 'var(--panel)', border: '1px solid var(--rim)', color: 'var(--parch)' }}>
                      <option value="listener">Listener</option><option value="broadcaster">Broadcaster</option><option value="admin">Admin</option>
                    </select>
                  </div>
                ) : null)}
              </div>
              </div>
            </div>
          ) : activeTab === 'sermons' ? (
            <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
              <SermonManager sermons={sermons as any} onRefresh={refresh} />
            </Suspense>
          ) : activeTab === 'chat' ? (
            <ChatSupervisor messages={chatMessages} onRefresh={fetchChat} />
          ) : activeTab === 'settings' ? (
            <AdminSettings />
          ) : activeTab === 'music' ? (
            <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
              <MusicManager music={musicTracks as any} onRefresh={refresh} />
            </Suspense>
          ) : activeTab === 'speakers' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Guest Speaker Spotlight</h3></div>
              <div className="dcard-b"><GuestSpeakerManager /></div>
            </div>
          ) : activeTab === 'prayer' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Prayer Wall Management</h3></div>
              <div className="dcard-b"><PrayerManager /></div>
            </div>
          ) : activeTab === 'testimonies' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Testimony Management</h3></div>
              <div className="dcard-b">
                <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                  <TestimonyManager />
                </Suspense>
              </div>
            </div>
          ) : activeTab === 'events' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Event Management</h3></div>
              <div className="dcard-b"><EventManager /></div>
            </div>
          ) : activeTab === 'dailyverse' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Daily Word & Push Notifications</h3></div>
              <div className="dcard-b">
                <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                  <DailyVerseManager />
                </Suspense>
              </div>
            </div>
          ) : activeTab === 'print' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Print Media</h3></div>
              <div className="dcard-b">
                <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                  <PrintManager />
                </Suspense>
              </div>
            </div>
          ) : activeTab === 'playlists' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Sermon Playlists</h3></div>
              <div className="dcard-b">
                <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                  <SermonPlaylistManager onRefresh={refresh} />
                </Suspense>
              </div>
            </div>
          ) : activeTab === 'radio' ? (
            <div className="dcard">
              <div className="dcard-h"><h3>Sermon Radio Schedules</h3></div>
              <div className="dcard-b">
                <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--fog)' }}>Loading...</div>}>
                  <SermonRadioManager onRefresh={refresh} />
                </Suspense>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

