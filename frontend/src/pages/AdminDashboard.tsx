import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { api, useBroadcasts, useSermons, useUsers, usePrayers, useMusic, useDashboardAnalytics, usePrintMedia } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import {
  Users, Radio, Headphones, MessageSquare, Settings, Heart, Calendar,
  BookOpen, DollarSign, Pause, StopCircle, BarChart3,
  Menu, X, Loader2, FileText, ListMusic,
  Search, Bell, HelpCircle, LayoutGrid,
  Play, ChevronRight, SkipForward, Square
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
        <div key={i} className={`w-[3px] rounded-full transition-all duration-200 ${active ? 'bg-[var(--dash-accent)]' : 'bg-[var(--dash-accent)]/30'}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function VUMeter({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(Array.from({ length: 32 }, () => 20))
  useEffect(() => {
    if (!active) { setBars(Array.from({ length: 32 }, () => 20)); return }
    const id = setInterval(() => {
      setBars(Array.from({ length: 32 }, () => Math.max(5, Math.min(100, Math.random() * 85 + 15))))
    }, 180)
    return () => clearInterval(id)
  }, [active])
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48, padding: '0 4px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 1,
          height: `${h}%`,
          background: h > 80 ? 'var(--dash-danger)' : h > 50 ? 'var(--dash-accent)' : 'var(--dash-success)',
          opacity: active ? 1 : .25,
          transition: 'height .18s ease'
        }} />
      ))}
    </div>
  )
}

function SignalBars({ label, value }: { label: string; value: number }) {
  const bars = [20, 40, 60, 80, 100]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--ash2)', width: 40, textAlign: 'right' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 18 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 4, borderRadius: 1, height: `${h * .16}px`,
            background: value >= h ? (i >= 3 ? 'var(--dash-accent)' : 'var(--dash-success)') : 'var(--dash-border)',
            transition: 'background .2s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: 'var(--cream2)', fontWeight: 600 }}>{value}%</span>
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
  const { data: printMedia = [] } = usePrintMedia()
  const { data: analytics } = useDashboardAnalytics()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [bcActionLoading, setBcActionLoading] = useState(false)
  const [liveElapsed, setLiveElapsed] = useState(0)
  const [geoData, setGeoData] = useState<{ byCountry: {country:string;count:number}[]; locations: {country:string;region:string;city:string;count:number}[] }>({ byCountry: [], locations: [] })
  const [radioStatus, setRadioStatus] = useState<any>(null)
  const [radioLoading, setRadioLoading] = useState(false)

  /* -- Live broadcast duration timer -- */
  useEffect(() => {
    const live = broadcasts.find(b => b.status === 'live')
    if (!live?.started_at) { setLiveElapsed(0); return }
    const start = new Date(live.started_at).getTime()
    setLiveElapsed(Math.floor((Date.now() - start) / 1000))
    const id = setInterval(() => setLiveElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [broadcasts])

  // Fetch geo data for live broadcast
  useEffect(() => {
    const live = broadcasts.find(b => b.status === 'live')
    if (!live) { setGeoData({ byCountry: [], locations: [] }); return }
    const fetchGeo = async () => {
      try {
        const { data } = await api.get(`/stream/${live.id}/listeners/geo`)
        setGeoData({ byCountry: data.byCountry || [], locations: data.locations || [] })
      } catch {}
    }
    fetchGeo()
    const iv = setInterval(fetchGeo, 15000)
    return () => clearInterval(iv)
  }, [broadcasts])

  // Poll radio status
  useEffect(() => {
    async function poll() {
      try {
        const { data } = await api.get('/radio/status')
        setRadioStatus(data.status)
      } catch { setRadioStatus(null) }
    }
    poll()
    const iv = setInterval(poll, 10000)
    return () => clearInterval(iv)
  }, [])

  const dashboard = analytics?.stats ?? null
  const platformData = analytics?.platformBreakdown ?? []
  const pendingTestimonies = analytics?.pendingTestimonies ?? []
  const recentDonations = analytics?.recentDonations ?? []
  const campaigns = analytics?.activeCampaigns ?? []
  const transcripts = analytics?.transcripts ?? []
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

  async function skipRadioSermon() {
    setRadioLoading(true)
    try {
      await api.post('/radio/skip')
      const { data } = await api.get('/radio/status')
      setRadioStatus(data.status)
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to skip sermon', 'error')
    } finally { setRadioLoading(false) }
  }

  async function stopRadioStream() {
    setRadioLoading(true)
    try {
      await api.post('/radio/stop')
      setRadioStatus(null)
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to stop radio', 'error')
    } finally { setRadioLoading(false) }
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

  async function pauseLiveBroadcast() {
    const live = broadcasts.find(b => b.status === 'live')
    if (!live) return
    setBcActionLoading(true)
    try {
      // No dedicated pause endpoint; treat as end and let broadcaster restart
      await api.post(`/broadcasts/${live.id}/end`)
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] })
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
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 3,
          fontSize: 13, color: active ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
          background: active ? 'var(--dash-card)' : 'transparent', border: 'none', width: '100%', textAlign: 'left',
          transition: 'all .13s', cursor: 'pointer', borderLeft: active ? '2px solid var(--dash-accent)' : '2px solid transparent'
        }}>
        <I className="w-[15px] h-[15px] flex-shrink-0" style={{ opacity: active ? 1 : .7 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge ? <span style={{ marginLeft: 'auto', background: 'var(--dash-accent)', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>{badge}</span> : null}
      </button>
    )
  }

  function NavGroup({ title }: { title: string }) {
    return <div style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ash)', padding: '12px 10px 5px', userSelect: 'none' }}>{title}</div>
  }

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
          <circle cx="16" cy="16" r="15" fill="#1a0a2e" stroke="#6b4c9a" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="10" fill="none" stroke="#9a84b7" strokeWidth=".7" strokeDasharray="2 3" />
          <rect x="12.5" y="7" width="7" height="11" rx="3.5" fill="#6b4c9a" />
          <line x1="16" y1="18" x2="16" y2="22" stroke="#9a84b7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="22" x2="20" y2="22" stroke="#9a84b7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13.5" y1="11" x2="18.5" y2="11" stroke="#fff" strokeWidth=".7" opacity=".45" />
          <line x1="13.5" y1="13.5" x2="18.5" y2="13.5" stroke="#fff" strokeWidth=".7" opacity=".45" />
        </svg>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: '.08em', lineHeight: 1 }}>Embassy Radio</div>
          <div style={{ fontSize: 10, color: 'var(--ash2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Admin Console</div>
        </div>
        <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden ml-auto" style={{ color: 'var(--ash)' }}><X className="w-5 h-5" /></button>
      </div>

      {/* Live badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: live ? 'var(--dash-success-soft)' : 'var(--dash-panel)',
        border: `1px solid ${live ? 'rgba(16,185,129,.25)' : 'var(--dash-border)'}`,
        margin: '12px 12px 4px', borderRadius: 3, padding: '8px 12px'
      }}>
        <span className="ldot" style={{
          width: 7, height: 7, borderRadius: '50%', background: live ? 'var(--dash-success)' : 'var(--dash-text-muted)',
          display: 'inline-block', flexShrink: 0, animation: live ? 'pulse 1.8s ease-in-out infinite' : 'none'
        }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: live ? 'var(--dash-success)' : 'var(--dash-text-muted)' }}>{live ? 'On air' : 'Off air'}</span>
        {live && <span className="font-mono" style={{ fontSize: 11, color: 'var(--dash-success)', marginLeft: 'auto' }}>{formatDuration(liveElapsed)}</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--flame)', color: '#fff',
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ash2)', textTransform: 'capitalize' }}>{user?.role || 'Admin'}</div>
        </div>
        <button onClick={() => { /* settings */ }} className="sb-foot-action" style={{ background: 'transparent', border: 'none', color: 'var(--ash)', cursor: 'pointer', padding: 4 }}>
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--ember)', color: 'var(--cream)' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />}
      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <aside className="lg:hidden fixed inset-y-0 left-0 z-50" style={{ width: 'var(--sidebar-w)', background: 'var(--coal)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {sidebarContent}
        </aside>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 'var(--sidebar-w)', background: 'var(--coal)', borderRight: '1px solid var(--line)', overflowY: 'auto', zIndex: 50 }}>
        {sidebarContent}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 60, flexShrink: 0, background: 'var(--coal)', borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,.12)', zIndex: 30
        }}>
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--ash)' }} aria-label="Open navigation"><Menu className="w-5 h-5" /></button>
          <div className="font-bebas" style={{ fontSize: 20, letterSpacing: '.04em', flex: 1 }}>{screenTitles[activeTab] || activeTab}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.08)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 12px', width: 240 }}>
            <Search className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--ash)' }} />
            <input type="text" placeholder="Search…" aria-label="Search dashboard"
              style={{ background: 'transparent', border: 'none', color: 'var(--cream)', fontSize: 13, width: '100%', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button aria-label="Notifications" style={{ width: 36, height: 36, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ash2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all .13s' }} className="hover:bg-[var(--mahog)] hover:text-[var(--cream)]">
              <Bell className="w-4 h-4" />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--dash-accent)', border: '1.5px solid var(--ember)' }} />
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--line)' }} />
            <button aria-label="Help" style={{ width: 36, height: 36, borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ash2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .13s' }} className="hover:bg-[var(--mahog)] hover:text-[var(--cream)]">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto dashboard-content" style={{ padding: 24 }}>
          {activeTab === 'dashboard' ? (
            <div className="space-y-6">
              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: '.02em', color: 'var(--dash-text)' }}>Overview</h1>
                  <p style={{ fontSize: 13, color: 'var(--dash-text-secondary)', marginTop: 2 }}>Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveTab('broadcasts')} className="dash-btn dash-btn-primary"><Radio className="w-4 h-4" /> Go Live</button>
                  <button onClick={() => setActiveTab('sermons')} className="dash-btn dash-btn-secondary"><BookOpen className="w-4 h-4" /> Upload Sermon</button>
                </div>
              </div>

              {/* Status row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live broadcast status */}
                <div className="admin-card p-5" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: live ? 'var(--dash-success)' : 'var(--dash-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Radio className="w-7 h-7" style={{ color: live ? '#fff' : 'var(--dash-text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: live ? 'var(--dash-success)' : 'var(--dash-text-muted)' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: live ? 'var(--dash-success)' : 'var(--dash-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{live ? 'On Air' : 'Off Air'}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dash-text)' }}>{live ? (live.title || 'Live Broadcast') : 'No active broadcast'}</div>
                    {live && <div className="font-mono" style={{ fontSize: 12, color: 'var(--dash-text-secondary)', marginTop: 2 }}>{formatDuration(liveElapsed)} elapsed</div>}
                  </div>
                  {live && <button onClick={endLiveBroadcast} disabled={bcActionLoading} className="dash-btn dash-btn-danger"><StopCircle className="w-4 h-4" /> End</button>}
                </div>
                {/* Radio status */}
                <div className="admin-card p-5" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: radioStatus ? 'var(--dash-info)' : 'var(--dash-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ListMusic className="w-7 h-7" style={{ color: radioStatus ? '#fff' : 'var(--dash-text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: radioStatus ? 'var(--dash-info)' : 'var(--dash-text-muted)' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: radioStatus ? 'var(--dash-info)' : 'var(--dash-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{radioStatus ? 'Radio Active' : 'Radio Idle'}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dash-text)' }}>{radioStatus ? (radioStatus.currentSermonTitle || 'Sermon radio playing') : 'No sermon radio stream'}</div>
                    {radioStatus && <div style={{ fontSize: 12, color: 'var(--dash-text-secondary)', marginTop: 2 }}>{radioStatus.currentSermonSpeaker || ''}</div>}
                  </div>
                  {radioStatus && (
                    <div className="flex items-center gap-2">
                      <button onClick={skipRadioSermon} disabled={radioLoading} className="dash-btn dash-btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }}><SkipForward className="w-3.5 h-3.5" /> Skip</button>
                      <button onClick={stopRadioStream} disabled={radioLoading} className="dash-btn dash-btn-danger" style={{ padding: '7px 12px', fontSize: 12 }}><Square className="w-3.5 h-3.5" /> Stop</button>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { icon: Headphones, label: 'Active Listeners', value: dashboard?.listenersOnline?.toLocaleString() || '0', trend: '+12%', trendUp: true, bg: 'var(--dash-accent-soft)', col: 'var(--dash-accent)' },
                  { icon: Users, label: 'Total Today', value: dashboard?.totalListenersToday?.toLocaleString() || '0', trend: '+5%', trendUp: true, bg: 'var(--dash-info-soft)', col: 'var(--dash-info)' },
                  { icon: BookOpen, label: 'Sermons', value: String(sermons.length || 0), trend: '0%', trendUp: true, bg: 'var(--dash-success-soft)', col: 'var(--dash-success)' },
                  { icon: Heart, label: 'Prayers', value: String(prayers.length || 0), trend: '+2', trendUp: true, bg: 'var(--dash-warning-soft)', col: 'var(--dash-warning)' },
                  { icon: DollarSign, label: 'Donations', value: dashboard?.totalDonations ? `$${Number(dashboard.totalDonations).toLocaleString()}` : '$0', trend: '+8%', trendUp: true, bg: 'var(--dash-accent-soft)', col: 'var(--dash-accent)' },
                  { icon: BarChart3, label: 'Streams', value: dashboard?.totalListenersToday?.toLocaleString() || '0', trend: '+3%', trendUp: true, bg: 'var(--dash-info-soft)', col: 'var(--dash-info)' },
                ].map((c, i) => (
                  <div key={i} className="dash-kpi-card animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="dash-kpi-icon" style={{ background: c.bg }}><c.icon className="w-5 h-5" style={{ color: c.col }} /></div>
                      {c.trend && <span className="dash-kpi-trend" style={{ color: c.trendUp ? 'var(--dash-success)' : 'var(--dash-danger)' }}>{c.trendUp ? '↑' : '↓'} {c.trend}</span>}
                    </div>
                    <div className="dash-kpi-value" style={{ marginTop: 12 }}>{loading ? <div className="dash-skeleton" style={{ height: 28, width: '60%' }} /> : c.value}</div>
                    <div className="dash-kpi-label">{c.label}</div>
                  </div>
                ))}
              </div>
              {/* Activity + Quick actions */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-8 admin-card p-5">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="dash-section-title">Listener Activity – Last 7 Days</div>
                    <span className="text-xs font-medium" style={{ color: 'var(--dash-accent)', cursor: 'pointer' }}>View full analytics</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={listenerChart.length ? listenerChart : [{ time: 'Mon', l: 0, u: 0 }, { time: 'Tue', l: 0, u: 0 }, { time: 'Wed', l: 0, u: 0 }, { time: 'Thu', l: 0, u: 0 }, { time: 'Fri', l: 0, u: 0 }, { time: 'Sat', l: 0, u: 0 }, { time: 'Sun', l: 0, u: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--dash-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--dash-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(26,10,46,.1)' }} />
                      <Line type="monotone" dataKey="l" name="Listeners" stroke="var(--dash-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--dash-accent)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="u" name="Unique" stroke="var(--dash-info)" strokeWidth={3} dot={{ r: 4, fill: 'var(--dash-info)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="xl:col-span-4 admin-card p-5">
                  <div className="dash-section-title" style={{ marginBottom: 16 }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: Radio, label: 'Start Live Broadcast', desc: 'Begin a new stream', action: () => setActiveTab('broadcasts'), color: 'var(--dash-accent)' },
                      { icon: BookOpen, label: 'Upload New Sermon', desc: 'Add sermon audio', action: () => setActiveTab('sermons'), color: 'var(--dash-success)' },
                      { icon: FileText, label: 'Create Print Media', desc: 'Design PDF or poster', action: () => setActiveTab('print'), color: 'var(--dash-info)' },
                      { icon: Calendar, label: 'Schedule Event', desc: 'Plan upcoming broadcast', action: () => setActiveTab('events'), color: 'var(--dash-warning)' },
                    ].map((a, i) => (
                      <button key={i} onClick={a.action} className="dash-btn dash-btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 14px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--dash-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <a.icon className="w-4 h-4" style={{ color: a.color }} />
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text)' }}>{a.label}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--dash-text-secondary)', fontWeight: 400 }}>{a.desc}</div>
                        </div>
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--dash-text-muted)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Bottom row: Recent Sermons + Schedule */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                <div className="xl:col-span-8 admin-card p-5">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="dash-section-title">Recent Sermons</div>
                    <button onClick={() => setActiveTab('sermons')} className="dash-btn dash-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--dash-text-muted)', borderBottom: '1px solid var(--dash-border)' }}>
                          <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: 500, fontSize: 12 }}>Title</th>
                          <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: 500, fontSize: 12 }}>Speaker</th>
                          <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: 500, fontSize: 12 }}>Date</th>
                          <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: 500, fontSize: 12 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sermons.length ? sermons : []).slice(0, 5).map((s: any) => (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--dash-border)' }}>
                            <td style={{ padding: '12px 0', fontWeight: 500, color: 'var(--dash-text)' }}>{s.title}</td>
                            <td style={{ padding: '12px 0', color: 'var(--dash-text-secondary)' }}>{s.speaker}</td>
                            <td style={{ padding: '12px 0', color: 'var(--dash-text-secondary)' }}>{s.date ? s.date.split('T')[0] : '-'}</td>
                            <td style={{ padding: '12px 0' }}><span className="admin-tag admin-tag-green">Published</span></td>
                          </tr>
                        ))}
                        {sermons.length === 0 && <tr><td colSpan={4} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--dash-text-muted)' }}>No sermons uploaded yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="xl:col-span-4 admin-card p-5">
                  <div className="dash-section-title" style={{ marginBottom: 16 }}>Upcoming Schedule</div>
                  <div className="space-y-3">
                    {(() => {
                      const upcoming = broadcasts.filter((b: any) => b.status === 'scheduled' || b.status === 'live').slice(0, 4)
                      return upcoming.map((b: any, i: number) => (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < upcoming.length - 1 ? '1px solid var(--dash-border)' : 'none' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: b.status === 'live' ? 'var(--dash-success-soft)' : 'var(--dash-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Calendar className="w-4 h-4" style={{ color: b.status === 'live' ? 'var(--dash-success)' : 'var(--dash-accent)' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--dash-text-secondary)' }}>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : 'Now'}</div>
                          </div>
                          <span className="admin-tag" style={{ background: b.status === 'live' ? 'var(--dash-success-soft)' : 'var(--dash-panel)', color: b.status === 'live' ? 'var(--dash-success)' : 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)' }}>{b.status === 'live' ? 'Live' : 'Scheduled'}</span>
                        </div>
                      ))
                    })()}
                    {broadcasts.filter((b: any) => b.status === 'scheduled' || b.status === 'live').length === 0 && (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--dash-text-muted)', fontSize: 13 }}>Nothing scheduled</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ):activeTab === 'broadcasts' ? (
            <div className="space-y-5">
              {/* Go-live card */}
              <div className="admin-card p-5">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 4, background: live ? 'var(--dash-success)' : 'var(--dash-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Radio className="w-7 h-7" style={{ color: live ? '#fff' : 'var(--dash-text-muted)' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: '.04em', color: 'var(--dash-text)' }}>{live ? 'On Air' : 'Off Air'}</div>
                      <div style={{ fontSize: 12, color: 'var(--dash-text-secondary)', marginTop: 2 }}>{live ? (live.title || 'Live Broadcast') : 'No active broadcast'}</div>
                      {live && <div className="font-mono" style={{ fontSize: 11, color: 'var(--dash-success)', marginTop: 2 }}>{formatDuration(liveElapsed)} elapsed</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {live ? (
                      <button onClick={endLiveBroadcast} disabled={bcActionLoading} className="btn btn-red">
                        {bcActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />} Stop
                      </button>
                    ) : (
                      <button className="btn btn-flame"><Play className="w-3.5 h-3.5" /> Go Live</button>
                    )}
                  </div>
                </div>
                {/* VU meter */}
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: 3 }}>
                  <VUMeter active={!!live} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--dash-text-secondary)' }}>
                    <span>L</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>-12 dB</span>
                    <span>R</span>
                  </div>
                </div>
                {/* Signal quality */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
                  <SignalBars label="L" value={live ? 92 : 0} />
                  <SignalBars label="R" value={live ? 88 : 0} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--dash-text-secondary)', width: 40, textAlign: 'right' }}>Bit rate</span>
                    <span style={{ fontSize: 10, color: 'var(--dash-text)', fontWeight: 600 }}>{live ? '128 kbps' : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--dash-text-secondary)', width: 40, textAlign: 'right' }}>Buffer</span>
                    <span style={{ fontSize: 10, color: 'var(--dash-text)', fontWeight: 600 }}>{live ? '0.4s' : '—'}</span>
                  </div>
                </div>
              </div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <BroadcastManager broadcasts={broadcasts as any} onRefresh={refresh} />
              </Suspense>
            </div>
          ) : activeTab === 'users' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>User Management</div>
              {loading ? (
                <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'var(--dash-accent)' }} /><p className="mt-3 text-xs" style={{ color: 'var(--dash-text-muted)' }}>Loading users...</p></div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center"><Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--dash-border)' }} /><p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>No users yet</p></div>
              ) : null}
              <div className="space-y-1">
                {users.map(u => u ? (
                  <div key={u.id} className="px-4 py-3 rounded-lg flex items-center justify-between" style={{ transition: 'all .13s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-accent-soft)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div><p className="text-xs font-medium">{u.name || u.email}</p><p className="text-[10px]" style={{ color: 'var(--ash)' }}>{u.email}</p></div>
                    <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} className="text-xs rounded-md px-2.5 py-1 outline-none" style={{ background: 'var(--coal)', border: '1px solid var(--line)', color: 'var(--cream)' }}>
                      <option value="listener">Listener</option><option value="broadcaster">Broadcaster</option><option value="admin">Admin</option>
                    </select>
                  </div>
                ) : null)}
              </div>
            </div>
          ) : activeTab === 'sermons' ? (
            <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
              <SermonManager sermons={sermons as any} onRefresh={refresh} />
            </Suspense>
          ) : activeTab === 'chat' ? (
            <ChatSupervisor messages={chatMessages} onRefresh={fetchChat} />
          ) : activeTab === 'settings' ? (
            <AdminSettings />
          ) : activeTab === 'music' ? (
            <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
              <MusicManager music={musicTracks as any} onRefresh={refresh} />
            </Suspense>
          ) : activeTab === 'speakers' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Guest Speaker Spotlight</div>
              <GuestSpeakerManager />
            </div>
          ) : activeTab === 'prayer' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Prayer Wall Management</div>
              <PrayerManager />
            </div>
          ) : activeTab === 'testimonies' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Testimony Management</div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <TestimonyManager />
              </Suspense>
            </div>
          ) : activeTab === 'events' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Event Management</div>
              <EventManager />
            </div>
          ) : activeTab === 'dailyverse' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Daily Word & Push Notifications</div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <DailyVerseManager />
              </Suspense>
            </div>
          ) : activeTab === 'print' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Print Media</div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <PrintManager />
              </Suspense>
            </div>
          ) : activeTab === 'playlists' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sermon Playlists</div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <SermonPlaylistManager onRefresh={refresh} />
              </Suspense>
            </div>
          ) : activeTab === 'radio' ? (
            <div className="admin-card p-4">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sermon Radio Schedules</div>
              <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: 'var(--ash)' }}>Loading...</div>}>
                <SermonRadioManager onRefresh={refresh} />
              </Suspense>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

