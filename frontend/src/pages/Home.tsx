import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAudioPlayer, type Track } from '../contexts/AudioPlayerContext'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import {
  useActiveBroadcast,
  useFeaturedSermons,
  usePrintMedia,
  useRadioCurrent,
  usePublicRadioSchedules,
  getOptimizedImageUrl,
  useEvents,
} from '../lib/api'
import type { Sermon, PrintMedia, EventItem } from '../lib/api'
import StructuredData from '../components/StructuredData'
import { useState } from 'react'
import { Play, Pause, BookOpen, FileText, Bell, X, Radio, Video, Calendar, ArrowRight, Headphones, Download } from 'lucide-react'

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDateTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SignalLogo({ size = 100 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Embassy Radio"
      width={size}
      height={size}
      className="rounded-full object-cover"
      loading="eager"
      decoding="async"
    />
  )
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="max-w-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sunrise)] mb-2">
          {eyebrow}
        </div>
        <h2 className="font-bebas text-4xl md:text-5xl lg:text-6xl text-white leading-none">{title}</h2>
        <p className="mt-3 text-[var(--fog2)] text-sm md:text-base leading-relaxed">{subtitle}</p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

function SermonCard({ s }: { s: Sermon }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudioPlayer()
  const active = currentTrack?.id === s.id && isPlaying

  return (
    <div className="group relative bg-[var(--coal)] border border-[var(--line)] rounded-md overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[var(--sunrise)]">
      <div className="relative aspect-square bg-[var(--panel)] overflow-hidden">
        {s.thumbnail_url ? (
          <img
            src={getOptimizedImageUrl(s.thumbnail_url, 400)}
            alt={s.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[var(--ash)] opacity-30" />
          </div>
        )}
        <button
          onClick={() =>
            active
              ? togglePlay()
              : playTrack({
                  id: s.id,
                  title: s.title,
                  speaker: s.speaker || 'Pastor',
                  audioUrl: s.audio_url || '',
                  thumbnail: s.thumbnail_url,
                  trackType: 'sermon',
                })
          }
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[var(--flame)] text-white flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 transition-all hover:scale-105"
          aria-label={active ? 'Pause sermon' : 'Play sermon'}
        >
          {active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
      <div className="p-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--flame)] mb-1 truncate">
          {s.series || 'Sermon'}
        </div>
        <h3 className="font-bebas text-lg text-white truncate leading-tight">{s.title}</h3>
        <div className="mt-1 flex items-center justify-between text-xs text-[var(--ash2)]">
          <span className="truncate max-w-[70%]">{s.speaker || 'Embassy Radio'}</span>
          <span className="font-mono">{formatDuration(s.duration)}</span>
        </div>
      </div>
    </div>
  )
}

function PrintCard({ item }: { item: PrintMedia }) {
  return (
    <div className="group bg-[var(--coal)] border border-[var(--line)] rounded-md overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[var(--sunrise)]">
      {item.thumbnail_url ? (
        <div className="h-40 overflow-hidden bg-[var(--panel)]">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-40 bg-[var(--panel)] flex items-center justify-center">
          <FileText className="w-10 h-10 text-[var(--ash)] opacity-30" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bebas text-lg text-white leading-tight truncate">{item.title}</h3>
        {item.description && (
          <p className="mt-1 text-xs text-[var(--ash2)] line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ash)]">
            {item.published_date
              ? new Date(item.published_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Resource'}
          </span>
          {item.pdf_url && (
            <a
              href={item.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-ghost"
              download
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Get
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <div className="group bg-[var(--coal)] border border-[var(--line)] rounded-md p-5 transition-all duration-200 hover:border-[var(--sunrise)] hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-14 h-14 rounded-md bg-[var(--mahog)] border border-[var(--line)] flex flex-col items-center justify-center text-[var(--sunrise)]">
          <span className="text-[10px] uppercase tracking-wider">
            {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBC'}
          </span>
          <span className="font-bebas text-2xl leading-none">
            {event.date ? new Date(event.date).getDate() : '—'}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-bebas text-xl text-white leading-tight truncate">{event.title}</h3>
          {event.location && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ash2)]">
              <MapPinIcon className="w-3.5 h-3.5" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ash2)]">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>{event.date ? formatDateTime(`${event.date}T${event.time || '00:00'}`) : 'TBC'}</span>
          </div>
        </div>
      </div>
      {event.description && <p className="mt-3 text-sm text-[var(--fog2)] line-clamp-2">{event.description}</p>}
    </div>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function NowPlayingStrip({
  isLive,
  broadcast,
  nowPlaying,
}: {
  isLive: boolean
  broadcast: { id?: string; title?: string; speaker?: string } | null | undefined
  nowPlaying: { title: string; speaker: string; itemId: string; audioUrl: string; thumbnailUrl?: string; scriptureReference?: string; offsetSeconds?: number } | null | undefined
}) {
  const { currentTrack, isPlaying, togglePlay, playTrack, progress, duration, volume, setVolume, prev, next } = useAudioPlayer()
  const active = Boolean(nowPlaying?.itemId && currentTrack?.id === nowPlaying.itemId && isPlaying)
  const pct = duration ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0

  const title = isLive ? broadcast?.title || 'Live Broadcast' : nowPlaying?.title || 'Grace That Never Fails'
  const subtitle = isLive
    ? broadcast?.speaker || 'On air now'
    : `${nowPlaying?.speaker || 'Embassy Radio'}${nowPlaying?.scriptureReference ? ` · ${nowPlaying.scriptureReference}` : ''}`

  return (
    <div className="relative z-10 border-t border-[var(--line2)] bg-[rgba(15,4,0,0.85)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4 md:gap-6">
        {isLive ? (
          <Link
            to={broadcast?.id ? `/live/${broadcast.id}` : '/live'}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider text-white bg-red-500 hover:scale-[1.02] transition-transform"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live Broadcast
          </Link>
        ) : (
          <div className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider text-white bg-[var(--flame)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Now Playing
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-base font-semibold text-white truncate">{title}</div>
          <div className="text-xs text-[var(--ash2)] truncate">{subtitle}</div>
        </div>

        <div className="w-full md:w-72 shrink-0">
          <div className="h-1 bg-[var(--panel2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--flame)] to-[var(--sunrise)] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] font-mono text-[var(--ash)]">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={prev}
            className="p-2 text-[var(--ash2)] hover:text-white transition-colors"
            aria-label="Previous track"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (nowPlaying) {
                if (currentTrack?.id === nowPlaying.itemId) togglePlay()
                else
                  playTrack({
                    id: nowPlaying.itemId,
                    title: nowPlaying.title,
                    speaker: nowPlaying.speaker,
                    audioUrl: nowPlaying.audioUrl,
                    thumbnail: nowPlaying.thumbnailUrl,
                    trackType: 'sermon',
                    offsetSeconds: nowPlaying.offsetSeconds,
                  })
              }
            }}
            disabled={!nowPlaying && !isLive}
            className="w-10 h-10 rounded-full bg-[var(--flame)] text-white flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
            aria-label={active ? 'Pause' : 'Play'}
          >
            {active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={next}
            className="p-2 text-[var(--ash2)] hover:text-white transition-colors"
            aria-label="Next track"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0 text-[var(--ash)]">
          <Headphones className="w-4 h-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 accent-[var(--flame)] cursor-pointer"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  usePageTitle('The Whole Word to the Whole World')
  const { user } = useAuth()
  const { pushEnabled, pushSupported, requestPush, loadingPush } = useNotifications()
  const { data: broadcast } = useActiveBroadcast()
  const { data: sermons = [], isLoading: sermonsLoading } = useFeaturedSermons()
  const { data: printItems = [], isLoading: printLoading } = usePrintMedia()
  const { data: radioData } = useRadioCurrent()
  const { data: scheduleItems = [], isLoading: scheduleLoading } = usePublicRadioSchedules()
  const { data: events = [], isLoading: eventsLoading } = useEvents()
  const { playQueue } = useAudioPlayer()
  const isLive = broadcast?.status === 'live'
  const [dismissedPush, setDismissedPush] = useState(() => localStorage.getItem('push_dismissed') === '1')
  const showPushBanner = user && pushSupported && !pushEnabled && !dismissedPush
  const nowPlaying = radioData?.current

  function dismissPush() {
    localStorage.setItem('push_dismissed', '1')
    setDismissedPush(true)
  }

  function handlePlayAll() {
    const tracks: Track[] = sermons
      .filter((s) => s.audio_url)
      .map((s) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker || 'Pastor',
        audioUrl: s.audio_url!,
        thumbnail: s.thumbnail_url,
        trackType: 'sermon' as const,
      }))
    if (tracks.length) playQueue(tracks, 0)
  }

  return (
    <div className="min-h-screen bg-[var(--void)] text-[var(--parch)]">
      {showPushBanner && (
        <div className="bg-[#0B061F] border-b border-[rgba(139,92,246,0.2)] px-6 py-3 flex flex-wrap items-center justify-center gap-3">
          <Bell className="w-4 h-4 text-[var(--lav)] shrink-0" />
          <span className="text-sm font-medium text-[#F2EDFF]">Get notified when we go live and when new sermons drop.</span>
          <button
            onClick={requestPush}
            disabled={loadingPush}
            className="text-xs font-bold px-4 py-1.5 rounded-md bg-[var(--violet)] text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)] disabled:opacity-60"
          >
            {loadingPush ? 'Enabling…' : 'Enable Notifications'}
          </button>
          <button onClick={dismissPush} className="p-1 text-[var(--fog)] hover:text-white" aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <StructuredData />

      {/* Hero */}
      <section
        className="relative min-h-[calc(100vh-64px)] flex flex-col justify-center overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(224,90,26,0.18) 0%, rgba(245,166,35,0.06) 40%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(245,158,11,0.08) 0%, transparent 40%), var(--void)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bebas text-[clamp(120px,20vw,280px)] tracking-wider text-[var(--flame)] opacity-[0.04] whitespace-nowrap select-none">
            EMBASSY
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center md:text-left">
              {isLive ? (
                <Link
                  to={broadcast?.id ? `/live/${broadcast.id}` : '/live'}
                  className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-sm border border-red-400/30 border-l-[3px] border-l-red-500 bg-red-500/10 text-red-200 text-[11px] font-semibold uppercase tracking-widest hover:scale-[1.02] transition-transform hover:underline underline-offset-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
                  <Video className="w-3.5 h-3.5" />
                  Live Broadcast
                </Link>
              ) : nowPlaying ? (
                <Link
                  to="/archive"
                  className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-sm border border-[var(--gold)]/25 border-l-[3px] border-l-[var(--gold)] bg-[var(--gold)]/10 text-[var(--flame3)] text-[11px] font-semibold uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
                  <Radio className="w-3.5 h-3.5" />
                  Sermon Radio On Air
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-sm border border-[var(--flame)]/25 border-l-[3px] border-l-[var(--flame)] bg-[var(--flame)]/10 text-[var(--flame3)] text-[11px] font-semibold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--flame)] animate-pulse" />
                  Broadcasting 24 hours · 7 days a week
                </div>
              )}

              <h1 className="font-bebas text-[clamp(48px,9vw,96px)] leading-[0.9] tracking-wide text-white">
                THE <span className="text-[var(--flame)] [text-shadow:0_0_60px_rgba(224,90,26,0.35)]">WHOLE</span> WORD
              </h1>
              <p className="font-serif italic text-[clamp(16px,1.8vw,22px)] text-[var(--cream2)] mt-5 mb-8 max-w-md mx-auto md:mx-0 leading-relaxed">
                To the whole world — live from the studio, every hour of every day.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  to={isLive && broadcast ? `/live/${broadcast.id}` : '/live'}
                  className="btn btn-flame inline-flex items-center gap-2 text-sm md:text-base px-6 py-3"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isLive ? 'Watch Live' : 'Listen Live'}
                </Link>
                <Link to="/archive" className="btn btn-out text-sm md:text-base px-6 py-3">
                  Browse Sermons
                </Link>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center relative">
              <div className="relative w-80 h-80 lg:w-96 lg:h-96 flex items-center justify-center">
                <div className="signal-ring w-52 h-52 border-[var(--flame)] opacity-60" style={{ animationDelay: '0s' }} />
                <div className="signal-ring w-64 h-64 border-[var(--sunrise)] opacity-35" style={{ animationDelay: '0.9s' }} />
                <div className="signal-ring w-80 h-80 border-[var(--flame)] opacity-20" style={{ animationDelay: '1.8s' }} />
                <div className="absolute w-60 h-60 rounded-full border border-dashed border-[rgba(245,166,35,0.25)] animate-[spin_22s_linear_infinite]" />
                <div className="w-44 h-44 rounded-full bg-[radial-gradient(circle_at_40%_35%,var(--panel2),var(--coal))] border-2 border-[var(--flame)] flex items-center justify-center z-10 shadow-[0_0_60px_rgba(224,90,26,0.2),inset_0_1px_0_rgba(255,240,212,0.06)]">
                  <SignalLogo size={110} />
                </div>
                <div className="absolute top-4 right-4 text-center">
                  <div className="font-bebas text-3xl text-[var(--sunrise)] leading-none">24/7</div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ash2)]">Always on air</div>
                </div>
                <div className="absolute bottom-8 left-4 text-center">
                  <div className="font-bebas text-3xl text-[var(--sunrise)] leading-none">World</div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ash2)]">Reaching the nations</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NowPlayingStrip isLive={isLive} broadcast={broadcast} nowPlaying={nowPlaying} />
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-24">
        {/* Schedule */}
        <section>
          <SectionHeader
            eyebrow="Today on air"
            title="Program Schedule"
            subtitle="What's broadcasting on Embassy Radio today. Tune in live or catch each program in the archive later."
          >
            <Link to="/live" className="btn btn-ghost btn-sm">
              Full schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scheduleLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-[var(--coal)] border border-[var(--line)] rounded-md animate-pulse" />
              ))
            ) : scheduleItems.length === 0 ? (
              <div className="col-span-full text-center py-10 text-[var(--ash)]">
                <Radio className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No upcoming broadcasts scheduled.</p>
              </div>
            ) : (
              scheduleItems.map((s) => {
                const start = new Date(s.start_time)
                const end = s.end_time ? new Date(s.end_time) : null
                const now = new Date()
                const isNow = start <= now && (!end || end >= now)
                const hr = start.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
                const min = start.toLocaleTimeString('en-US', { minute: '2-digit' })
                const dur = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null
                return (
                  <Link
                    key={s.id}
                    to="/live"
                    className={`flex gap-4 p-4 rounded-md border transition-colors ${
                      isNow
                        ? 'bg-[var(--mahog)] border-[var(--flame)] hover:border-[var(--sunrise)]'
                        : 'bg-[var(--coal)] border-[var(--line)] hover:border-[var(--flame)]'
                    }`}
                  >
                    <div className="text-center min-w-[48px]">
                      <div className="font-bebas text-2xl text-[var(--sunrise)] leading-none">{hr}</div>
                      <div className="text-[11px] text-[var(--ash)]">{min}</div>
                    </div>
                    <div>
                      {isNow && (
                        <div className="inline-flex items-center gap-1.5 mb-1 bg-[var(--flame)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          Live
                        </div>
                      )}
                      <div className="font-semibold text-white text-sm">{s.playlist_title || 'Broadcast'}</div>
                      <div className="text-xs text-[var(--ash)]">{dur ? `${dur} min` : 'Until finished'}</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        {/* Featured sermons */}
        <section>
          <SectionHeader
            eyebrow="Sermon library"
            title="Featured Sermons"
            subtitle="Hand-picked messages to strengthen your faith and deepen your walk with God."
          >
            {!sermonsLoading && sermons.length > 0 && (
              <button onClick={handlePlayAll} className="btn btn-sun btn-sm">
                <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Play all
              </button>
            )}
          </SectionHeader>

          {sermonsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--coal)] border border-[var(--line)] rounded-md animate-pulse" />
              ))}
            </div>
          ) : sermons.length === 0 ? (
            <div className="text-center py-12 text-[var(--ash)]">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No sermons uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sermons.map((s) => (
                <SermonCard key={s.id} s={s} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:text-left">
            <Link to="/archive" className="btn btn-out btn-sm">
              View all sermons <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </section>

        {/* Events */}
        <section>
          <SectionHeader
            eyebrow="Coming up"
            title="Upcoming Events"
            subtitle="Conferences, live services, and special broadcasts you will not want to miss."
          >
            <Link to="/events" className="btn btn-ghost btn-sm">
              All events <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </SectionHeader>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 bg-[var(--coal)] border border-[var(--line)] rounded-md animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-[var(--ash)]">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No upcoming events right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.slice(0, 6).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Print media */}
        <section>
          <SectionHeader
            eyebrow="Print media"
            title="Read & Download"
            subtitle="Bulletins, devotional magazines, and study guides — free to download anytime."
          >
            <Link to="/print" className="btn btn-ghost btn-sm">
              Browse library <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </SectionHeader>

          {printLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-[var(--coal)] border border-[var(--line)] rounded-md animate-pulse" />
              ))}
            </div>
          ) : printItems.length === 0 ? (
            <div className="text-center py-12 bg-[var(--coal)] border border-[var(--line)] rounded-md text-[var(--ash)]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No resources available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {printItems.slice(0, 4).map((item) => (
                <PrintCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section
          className="rounded-xl border border-[var(--line)] p-8 md:p-12 text-center md:text-left"
          style={{
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(224,90,26,0.08) 50%, rgba(245,166,35,0.05) 100%), var(--coal)',
          }}
        >
          <div className="max-w-2xl">
            <h2 className="font-bebas text-3xl md:text-5xl text-white mb-3">Take Embassy Radio with you</h2>
            <p className="text-[var(--fog2)] mb-6 leading-relaxed">
              Install the app, enable notifications, and never miss a live broadcast or new sermon. The whole word, everywhere you go.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Link to="/live" className="btn btn-flame inline-flex items-center">
                <Radio className="w-4 h-4 mr-2" /> Start listening
              </Link>
              <Link to="/about" className="btn btn-ghost inline-flex items-center">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--abyss)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SignalLogo size={40} />
            <div>
              <div className="font-bebas text-xl text-white tracking-wide">EMBASSY RADIO</div>
              <div className="text-[11px] text-[var(--ash)] uppercase tracking-widest">The Whole Word to the Whole World</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--ash2)]">
            <Link to="/" className="hover:text-[var(--sunrise)] transition-colors">Home</Link>
            <Link to="/archive" className="hover:text-[var(--sunrise)] transition-colors">Sermons</Link>
            <Link to="/live" className="hover:text-[var(--sunrise)] transition-colors">Live</Link>
            <Link to="/events" className="hover:text-[var(--sunrise)] transition-colors">Events</Link>
            <Link to="/about" className="hover:text-[var(--sunrise)] transition-colors">About</Link>
          </div>
          <div className="text-xs text-[var(--ash)]">© {new Date().getFullYear()} Embassy Radio. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
