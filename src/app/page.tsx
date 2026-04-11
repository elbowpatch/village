'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Post, Profile, Chatroom, ChatroomMessage, Conversation, DirectMessage, Artwork, NewsArticle } from '@/lib/types'
import { formatDistanceToNowStrict } from 'date-fns'

// ─── ICONS ──────────────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const s = { width: size, height: size, stroke: color, fill: 'none', strokeWidth: 1.8, flexShrink: 0 } as React.CSSProperties
  const icons: Record<string, JSX.Element> = {
    home: <svg style={s} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    chat: <svg style={s} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    mail: <svg style={s} viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>,
    news: <svg style={s} viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4-4V6"/><path d="M2 13.5h4"/><path d="M2 9.5h4"/><path d="M10 6h8"/><path d="M10 10h8"/><path d="M10 14h8"/></svg>,
    user: <svg style={s} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    bell: <svg style={s} viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    moon: <svg style={s} viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    sun: <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    heart: <svg style={s} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    'heart-filled': <svg style={{...s, fill: 'var(--accent2)', stroke: 'var(--accent2)'}} viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    'message-circle': <svg style={s} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    share: <svg style={s} viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    bookmark: <svg style={s} viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    'bookmark-filled': <svg style={{...s, fill: 'currentColor', stroke: 'currentColor'}} viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    search: <svg style={s} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    send: <svg style={s} viewBox="0 0 24 24" strokeWidth={2.5}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    back: <svg style={s} viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
    'more-h': <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
    image: <svg style={s} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    smile: <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    palette: <svg style={s} viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill={color}/><circle cx="17.5" cy="10.5" r=".5" fill={color}/><circle cx="8.5" cy="7.5" r=".5" fill={color}/><circle cx="6.5" cy="12.5" r=".5" fill={color}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    rocket: <svg style={s} viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    globe: <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    briefcase: <svg style={s} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    music: <svg style={s} viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    trophy: <svg style={s} viewBox="0 0 24 24"><polyline points="8 2 8 10 12 14 16 10 16 2"/><path d="M4 2h16"/><path d="M12 14v7"/><path d="M9 21h6"/><path d="M8 7H4a2 2 0 0 0 0 4h2"/><path d="M16 7h4a2 2 0 0 1 0 4h-2"/></svg>,
    zap: <svg style={s} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    trending: <svg style={s} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    fire: <svg style={{...s, fill: color !== 'currentColor' ? color : 'none'}} viewBox="0 0 24 24"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0C17 7 12 2 12 2zm0 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" strokeWidth={2.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    'log-out': <svg style={s} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    edit: <svg style={s} viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    users: <svg style={s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    radio: <svg style={s} viewBox="0 0 24 24"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></svg>,
    play: <svg style={s} viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    pause: <svg style={s} viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    'volume-2': <svg style={s} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
    'volume-x': <svg style={s} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
    wifi: <svg style={s} viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    tv: <svg style={s} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>,
    monitor: <svg style={s} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    maximize: <svg style={s} viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
    minimize: <svg style={s} viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>,
    'loader': <svg style={{...s, animation:'spin 1s linear infinite'}} viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  }
  return icons[name] || icons.globe
}

// ─── AVATAR ─────────────────────────────────────────────────────────────────

function Avatar({ letter, color, size = 40, online, photoUrl }: { letter: string; color: string; size?: number; online?: boolean; photoUrl?: string | null }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {photoUrl ? (
        <img src={photoUrl} alt={letter} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(${color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: '#fff', fontSize: size * 0.38,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>{letter}</div>
      )}
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 11, height: 11, background: 'var(--accent3)',
          borderRadius: '50%', border: '2px solid var(--surface)',
        }} />
      )}
    </div>
  )
}

// ─── VERIFIED BADGE ─────────────────────────────────────────────────────────

function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'verified-badge verified-badge-sm' : size === 'lg' ? 'verified-badge verified-badge-lg' : 'verified-badge'
  const dim = size === 'sm' ? 14 : size === 'lg' ? 22 : 16
  return (
    <span className={cls} title="Verified">
      {/* X/Twitter-style verification badge — blue star-burst with checkmark */}
      <svg width={dim} height={dim} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 0.5L13.32 3.18L16.84 2.24L17.5 5.82L20.88 6.86L19.6 10.2L21.5 13L18.9 14.92L18.9 18.52L15.32 18.76L13.5 21.82L10.8 20.18L8.1 21.82L6.28 18.76L2.7 18.52L2.7 14.92L0.1 13L2 10.2L0.72 6.86L4.1 5.82L4.76 2.24L8.28 3.18L11 0.5Z" fill="#1D9BF0"/>
        <path d="M7 11.2L9.5 13.8L15.5 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ─── TIME FORMAT ────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  try { return formatDistanceToNowStrict(new Date(ts), { addSuffix: false }).replace(' minutes', 'm').replace(' minute', 'm').replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd').replace(' day', 'd').replace(' seconds', 's').replace(' second', 's') }
  catch { return '' }
}

// ─── RADIO TYPES ─────────────────────────────────────────────────────────────
interface RadioStation {
  stationuuid: string  // Radio Garden channel ID
  rgId: string
  name: string
  url: string          // /api/radio/stream?id=... (resolved lazily)
  url_resolved: string
  favicon: string
  tags: string
  country: string
  language: string
  votes: number
  codec: string
  bitrate: number
}

interface TVChannel {
  name: string
  url: string
  logo: string
  group: string
  country: string
  languages: string[]
  categories: string[]
  tvgId: string
}

type MediaTab = 'radio' | 'tv'

// ─── MAIN APP ────────────────────────────────────────────────────────────────

type Page = 'home' | 'chatrooms' | 'messages' | 'news' | 'art' | 'media' | 'profile' | 'discover'

export default function ChitChatApp() {
  const [dark, setDark] = useState(false)
  const [accentColor, setAccentColor] = useState('#1971c2')
  const [accentPickerOpen, setAccentPickerOpen] = useState(false)
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [createPostModal, setCreatePostModal] = useState(false)
  const [notifModal, setNotifModal] = useState(false)
  const [notifUnread, setNotifUnread] = useState(0)
  const [profilePopup, setProfilePopup] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [globalFont, setGlobalFont] = useState('Plus Jakarta Sans')
  const [dataSaver, setDataSaver] = useState(false)
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)
  // Media player state
  const [radioStation, setRadioStation] = useState<RadioStation | null>(null)
  const [radioPlaying, setRadioPlaying] = useState(false)
  const [radioMuted, setRadioMuted] = useState(false)
  const radioRef = useRef<HTMLAudioElement | null>(null)
  // TV player state
  const [tvChannel, setTVChannel] = useState<TVChannel | null>(null)
  const [tvMuted, setTVMuted] = useState(false)
  const [tvFullscreen, setTVFullscreen] = useState(false)
  const tvVideoRef = useRef<HTMLVideoElement | null>(null)
  const tvFullscreenVideoRef = useRef<HTMLVideoElement | null>(null)
  const tvHlsRef = useRef<any>(null)
  // Draggable / resizable popup player state
  const [playerPos, setPlayerPos] = useState<{x: number; y: number} | null>(null)
  const [playerSize, setPlayerSize] = useState({ w: 280, h: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const playerRef = useRef<HTMLDivElement | null>(null)
  const isResizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: 280, h: 300 })

  // Audio element lifecycle — resolves Radio Garden stream URL then plays
  useEffect(() => {
    if (!radioStation) return
    let cancelled = false
    const audio = new Audio()
    audio.preload = 'none'
    radioRef.current = audio

    async function resolveAndPlay() {
      let src = radioStation!.url_resolved || radioStation!.url
      // If the URL points to our own stream resolver, fetch the real URL first
      if (src.startsWith('/api/radio/stream')) {
        try {
          const res = await fetch(src)
          const data = await res.json()
          if (data.url) src = data.url
        } catch {}
      }
      if (cancelled) return
      audio.src = src
      audio.play().then(() => { if (!cancelled) setRadioPlaying(true) }).catch(() => { if (!cancelled) setRadioPlaying(false) })
    }

    resolveAndPlay()
    return () => { cancelled = true; audio.pause(); audio.src = ''; radioRef.current = null }
  }, [radioStation])

  useEffect(() => {
    if (!radioRef.current) return
    radioRef.current.muted = radioMuted
  }, [radioMuted])

  // TV HLS lifecycle — re-attaches whenever channel or fullscreen state changes
  const attachTVStream = async (video: HTMLVideoElement, url: string) => {
    const Hls = (await import('hls.js')).default
    if (tvHlsRef.current) { tvHlsRef.current.destroy(); tvHlsRef.current = null }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true })
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}) })
      tvHlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.play().catch(() => {})
    }
  }

  useEffect(() => {
    if (!tvChannel) return
    // Use the fullscreen video ref when expanded, mini ref otherwise
    const video = tvFullscreen ? tvFullscreenVideoRef.current : tvVideoRef.current
    if (!video) return
    attachTVStream(video, tvChannel.url)
    return () => { if (tvHlsRef.current) { tvHlsRef.current.destroy(); tvHlsRef.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tvChannel, tvFullscreen])

  useEffect(() => {
    const video = tvFullscreen ? tvFullscreenVideoRef.current : tvVideoRef.current
    if (video) video.muted = tvMuted
  }, [tvMuted, tvFullscreen])

  function playTVChannel(ch: TVChannel) {
    // Stop radio when TV starts
    if (radioRef.current) { radioRef.current.pause(); radioRef.current.src = ''; radioRef.current = null }
    setRadioStation(null); setRadioPlaying(false)
    setTVChannel(ch)
  }
  function stopTV() {
    if (tvHlsRef.current) { tvHlsRef.current.destroy(); tvHlsRef.current = null }
    setTVChannel(null); setTVFullscreen(false)
  }

  function playStation(s: RadioStation) {
    // Stop TV when radio starts
    if (tvHlsRef.current) { tvHlsRef.current.destroy(); tvHlsRef.current = null }
    setTVChannel(null)
    if (radioRef.current) { radioRef.current.pause(); radioRef.current.src = ''; radioRef.current = null }
    setRadioStation(s)
    setRadioPlaying(false)
  }
  function stopRadio() {
    if (radioRef.current) { radioRef.current.pause(); radioRef.current.src = ''; radioRef.current = null }
    setRadioStation(null); setRadioPlaying(false)
  }
  function toggleRadioPlay() {
    if (!radioRef.current) return
    if (radioPlaying) { radioRef.current.pause(); setRadioPlaying(false) }
    else { radioRef.current.play().then(() => setRadioPlaying(true)).catch(() => {}) }
  }

  useEffect(() => {
    const stored = localStorage.getItem('glitch-dark')
    if (stored === 'true') { setDark(true); document.documentElement.classList.add('dark') }
    const storedAccent = localStorage.getItem('glitch-accent')
    if (storedAccent) { setAccentColor(storedAccent); applyAccent(storedAccent) } else { applyAccent('#1971c2') }
    const storedFont = localStorage.getItem('chitchat-font')
    if (storedFont) { setGlobalFont(storedFont); document.documentElement.style.setProperty('--app-font', `'${storedFont}', sans-serif`) }
    const storedDataSaver = localStorage.getItem('chitchat-datasaver')
    if (storedDataSaver === 'true') setDataSaver(true)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); fetchProfile(data.session.user.id) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile(data)
  }

  // Load initial unread count + realtime bell badge
  useEffect(() => {
    if (!user) { setNotifUnread(0); return }
    supabase.from('notifications').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false)
      .then(({ count }) => setNotifUnread(count || 0))

    const ch = supabase.channel(`notif-badge-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        setNotifUnread(u => u + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        supabase.from('notifications').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('is_read', false)
          .then(({ count }) => setNotifUnread(count || 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('glitch-dark', String(next))
  }

  // Listen for events from ProfilePopup
  useEffect(() => {
    function onToggleDark() { toggleDark() }
    function onChangeAccent(e: Event) { changeAccent((e as CustomEvent).detail) }
    function onOpenNotifications() { setNotifModal(true); setNotifUnread(0) }
    function onNavigateToPost(e: Event) {
      const postId = (e as CustomEvent).detail?.postId
      setPage('home')
      setNotifModal(false)
      if (postId) {
        // Scroll to post after navigation settles
        setTimeout(() => {
          const el = document.getElementById(`post-${postId}`)
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.outline = '2px solid var(--accent)'; setTimeout(() => { el.style.outline = '' }, 1800) }
        }, 350)
      }
    }
    window.addEventListener('toggle-dark', onToggleDark)
    window.addEventListener('change-accent', onChangeAccent)
    window.addEventListener('open-notifications', onOpenNotifications)
    window.addEventListener('navigate-to-post', onNavigateToPost)
    return () => {
      window.removeEventListener('toggle-dark', onToggleDark)
      window.removeEventListener('change-accent', onChangeAccent)
      window.removeEventListener('open-notifications', onOpenNotifications)
      window.removeEventListener('navigate-to-post', onNavigateToPost)
    }
  }, [dark, accentColor])

  function applyAccent(color: string) {
    document.documentElement.style.setProperty('--accent', color)
    document.documentElement.style.setProperty('--accent3', color)
    // derive a lighter shade for accent2
    document.documentElement.style.setProperty('--accent-orange', color)
  }

  function changeAccent(color: string) {
    setAccentColor(color)
    applyAccent(color)
    localStorage.setItem('glitch-accent', color)
    setAccentPickerOpen(false)
  }

  function showToast(msg: string, icon: string) {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 2200)
  }

  function changeFont(font: string) {
    setGlobalFont(font)
    document.documentElement.style.setProperty('--app-font', `'${font}', sans-serif`)
    localStorage.setItem('chitchat-font', font)
  }

  function toggleDataSaver() {
    const next = !dataSaver
    setDataSaver(next)
    localStorage.setItem('chitchat-datasaver', String(next))
    showToast(next ? 'Data Saver enabled' : 'Data Saver disabled', next ? 'wifi' : 'zap')
  }

  function navigate(p: Page) {
    if ((p === 'messages' || p === 'profile') && !user) { setAuthModal('login'); return }
    setPage(p)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    if (isResizing.current) return
    const el = playerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top }
    setIsDragging(true)

    function onMove(ev: MouseEvent | TouchEvent) {
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX
      const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY
      const el2 = playerRef.current
      if (!el2) return
      const pw = el2.offsetWidth, ph = el2.offsetHeight
      const x = Math.min(Math.max(0, cx - dragOffset.current.x), window.innerWidth - pw)
      const y = Math.min(Math.max(0, cy - dragOffset.current.y), window.innerHeight - ph)
      setPlayerPos({ x, y })
    }
    function onUp() {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
  }

  // ── Resize handlers ────────────────────────────────────────────────────────
  function onResizeStart(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const el = playerRef.current
    if (!el) return
    isResizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight }

    function onMove(ev: MouseEvent) {
      const dw = ev.clientX - resizeStart.current.x
      const dh = ev.clientY - resizeStart.current.y
      setPlayerSize({
        w: Math.max(200, resizeStart.current.w + dw),
        h: Math.max(180, resizeStart.current.h + dh),
      })
    }
    function onUp() {
      isResizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* TOP BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: dark ? 'rgba(13,13,13,0.95)' : 'rgba(245,245,247,0.95)',
        backdropFilter: 'blur(30px) saturate(1.8)',
        borderBottom: `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img 
            src="/cc-logo.png" 
            alt="CC" 
            className="glitch-logo" 
            style={{ 
              width: 48, 
              height: 48, 
              objectFit: 'contain', 
              display: 'block',
              filter: 'drop-shadow(0 3px 8px rgba(245,130,10,0.4)) drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
              transform: 'translateY(-1px)',
            }} 
          />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setProfilePopup(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: '50%', overflow: 'hidden', width: 34, height: 34, flexShrink: 0 }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(${profile?.avatar_color || '135deg,var(--accent),var(--accent5)'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                    {profile?.avatar_letter || 'U'}
                  </div>
                )}
              </button>
              {profilePopup && <ProfilePopup user={user} profile={profile} onClose={() => setProfilePopup(false)} onSignOut={async () => { await supabase.auth.signOut(); setProfilePopup(false) }} globalFont={globalFont} dataSaver={dataSaver} onChangeFont={changeFont} onToggleDataSaver={toggleDataSaver} />}
            </div>
          ) : (
            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }} onClick={() => setAuthModal('login')}>Sign In</button>
          )}
        </div>
      </header>

      {/* LEFT SIDEBAR (desktop) */}
      <nav className={`left-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="left-sidebar-inner" style={{ position: 'relative' }}>
          {/* Toggle button */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {sidebarCollapsed
                ? <><path d="M4 2l4 4-4 4"/></>
                : <><path d="M8 2L4 6l4 4"/></>
              }
            </svg>
          </button>

          {/* Nav items */}
          {([
            { id: 'home', icon: 'home', label: 'Home' },
            { id: 'chatrooms', icon: 'chat', label: 'Chat' },
            { id: 'discover', icon: 'search', label: 'Discover' },
            { id: 'news', icon: 'news', label: 'News' },
            { id: 'media', icon: 'tv', label: 'Media' },
            { id: 'messages', icon: 'mail', label: 'Messages' },
          ] as const).map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-btn${page === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id as Page)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={20} color={page === item.id ? 'var(--accent)' : 'var(--text3)'} />
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}

          {/* Create button */}
          <button
            className="sidebar-nav-btn create-btn"
            onClick={() => user ? setCreatePostModal(true) : setAuthModal('login')}
            title={sidebarCollapsed ? 'Create Post' : undefined}
            style={{ marginTop: 8 }}
          >
            <Icon name="plus" size={20} color="#fff" />
            <span className="sidebar-label">Create Post</span>
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* User row at bottom */}
          {user && profile && (
            <div style={{ padding: '8px', borderTop: '0.5px solid var(--border)', marginTop: 8 }}>
              <button
                onClick={() => setProfilePopup(p => !p)}
                className="sidebar-nav-btn"
                style={{ margin: 0, width: '100%', padding: '8px' }}
                title={sidebarCollapsed ? profile.display_name : undefined}
              >
                {profile.avatar_url
                  ? <img src={profile.avatar_url} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.7rem', flexShrink: 0 }}>{profile.avatar_letter}</div>
                }
                <span className="sidebar-label" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {profile.display_name}
                  {profile.verified && <VerifiedBadge size="sm" />}
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className={`with-sidebar${sidebarCollapsed ? ' collapsed' : ''}`} style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(83px + 20px)' }}>
        {page === 'home' && <HomeFeed user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} onPlayRadio={playStation} onPlayTV={playTVChannel} currentRadio={radioStation} currentTV={tvChannel} onCreatePost={() => user ? setCreatePostModal(true) : setAuthModal('login')} dataSaver={dataSaver} onToast={showToast} />}
        {page === 'news' && <NewsPage />}
        {page === 'messages' && <MessagesPage user={user} profile={profile} />}
        {page === 'chatrooms' && <ChatroomsPage user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} />}
        {page === 'art' && <ArtPage user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} />}
        {page === 'media' && <MediaPage onPlayRadio={playStation} onPlayTV={playTVChannel} currentRadio={radioStation} currentTV={tvChannel} />}
        {page === 'discover' && <DiscoverPage user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} />}
      </main>

      {/* BOTTOM NAV (mobile only) */}
      <nav className="bottom-nav-desktop-hidden" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: dark ? 'rgba(13,13,13,0.97)' : 'rgba(245,245,247,0.97)',
        borderTop: `0.5px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
        display: 'flex', padding: '8px 0 env(safe-area-inset-bottom, 8px)',
        backdropFilter: 'blur(30px) saturate(2)',
      }}>
        {([
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'chatrooms', icon: 'chat', label: 'Chat' },
          { id: 'discover', icon: 'search', label: 'Discover' },
          { id: 'news', icon: 'news', label: 'News' },
          { id: 'media', icon: 'tv', label: 'Media' },
        ] as const).map(item => (
          <button key={item.id}
            onClick={() => navigate(item.id as Page)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, padding: '4px 0', border: 'none', background: 'transparent', cursor: 'pointer',
              color: page === item.id ? 'var(--accent)' : 'var(--text3)',
              fontSize: '0.6rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, flex: 1,
              transition: 'all 0.2s',
            }}>
            <Icon name={item.icon} size={22} color={page === item.id ? 'var(--accent)' : 'var(--text3)'} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* POPUP PLAYER — square on desktop, floating bar on mobile */}
      {(radioStation || tvChannel) && (
        <div
          ref={playerRef}
          className={`popup-player${isDragging ? ' is-dragging' : ''}`}
          style={playerPos ? {
            left: playerPos.x, top: playerPos.y, right: 'auto', bottom: 'auto',
            width: Math.max(200, playerSize.w),
            ...(playerSize.h > 0 ? { height: playerSize.h, overflow: 'hidden' } : {}),
          } : {}}
        >
          {radioStation && (
            <div className="popup-player-inner">
              {/* Art panel — desktop square top, mobile left thumb */}
              <div className="popup-player-art" style={{
                background: 'linear-gradient(135deg, var(--accent5), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {radioStation.favicon
                  ? <img src={radioStation.favicon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <Icon name="radio" size={28} color="#fff" />}
                {radioPlaying && (
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6, width: 9, height: 9, borderRadius: '50%',
                    background: '#3aab3a', boxShadow: '0 0 8px #3aab3a',
                    animation: 'pulse-dot 1.4s ease-in-out infinite',
                  }} />
                )}
              </div>

              {/* Mobile bar content */}
              <div className="popup-player-bar-content" style={{ alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.4px' }}>RADIO</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{radioStation.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button className="icon-btn" onClick={toggleRadioPlay}
                    style={{ background: 'var(--accent)', width: 36, height: 36 }}>
                    <Icon name={radioPlaying ? 'pause' : 'play'} size={14} color="#fff" />
                  </button>
                  <button className="icon-btn" onClick={stopRadio}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>

              {/* Desktop square content */}
              <div className="popup-player-square-content">
                <div className="popup-player-square-header">
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>RADIO</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{radioStation.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
                      {[radioStation.country, radioStation.bitrate ? `${radioStation.bitrate}kbps` : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={stopRadio} style={{ flexShrink: 0 }}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
                <div className="popup-player-controls">
                  <button className="icon-btn" onClick={() => setRadioMuted(m => !m)}>
                    <Icon name={radioMuted ? 'volume-x' : 'volume-2'} size={15} />
                  </button>
                  <button className="icon-btn" onClick={toggleRadioPlay}
                    style={{ background: 'var(--accent)', width: 44, height: 44, borderRadius: '50%' }}>
                    <Icon name={radioPlaying ? 'pause' : 'play'} size={18} color="#fff" />
                  </button>
                  <button className="icon-btn" style={{ opacity: 0.4, cursor: 'default' }}>
                    <Icon name="skip-forward" size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tvChannel && (
            <div className="popup-player-inner">
              {/* TV art — live video thumb on desktop, small on mobile */}
              <div className="popup-player-art" style={{ background: '#000', position: 'relative' }}>
                <video
                  ref={tvVideoRef}
                  autoPlay playsInline muted={tvMuted}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  background: 'var(--accent2)', color: '#fff',
                  fontSize: '0.52rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, letterSpacing: '0.6px',
                }}>LIVE</div>
              </div>

              {/* Mobile bar content */}
              <div className="popup-player-bar-content" style={{ alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--accent2)', fontWeight: 700, letterSpacing: '0.4px' }}>TV</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tvChannel.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button className="icon-btn" onClick={() => setTVFullscreen(f => !f)}
                    style={{ background: 'var(--accent2)', width: 36, height: 36 }}>
                    <Icon name="maximize" size={14} color="#fff" />
                  </button>
                  <button className="icon-btn" onClick={stopTV}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>

              {/* Desktop square content */}
              <div className="popup-player-square-content">
                <div className="popup-player-square-header">
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--accent2)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>TV — LIVE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tvChannel.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
                      {[tvChannel.country, tvChannel.group].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={stopTV} style={{ flexShrink: 0 }}>
                    <Icon name="x" size={13} />
                  </button>
                </div>
                <div className="popup-player-controls">
                  <button className="icon-btn" onClick={() => setTVMuted(m => !m)}>
                    <Icon name={tvMuted ? 'volume-x' : 'volume-2'} size={15} />
                  </button>
                  <button className="icon-btn" onClick={() => setTVFullscreen(f => !f)}
                    style={{ background: 'var(--accent2)', width: 44, height: 44, borderRadius: '50%' }}>
                    <Icon name="maximize" size={18} color="#fff" />
                  </button>
                  <button className="icon-btn" style={{ opacity: 0.4, cursor: 'default' }}>
                    <Icon name="cast" size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Drag handle bar (desktop) */}
          <div
            className="popup-player-drag-handle"
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <div style={{ width: 32, height: 3, borderRadius: 99, background: 'var(--border)', opacity: 0.8 }} />
          </div>
          {/* Resize handle (desktop bottom-right) */}
          <div
            className="popup-player-resize-handle"
            onMouseDown={onResizeStart}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, cursor: 'se-resize', zIndex: 3 }}
          />
        </div>
      )}

      {/* TV FULLSCREEN OVERLAY */}
      {tvChannel && tvFullscreen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: '#000',
          display: 'flex', flexDirection: 'column',
        }}>
          <video
            ref={tvFullscreenVideoRef}
            autoPlay playsInline muted={tvMuted}
            style={{ flex: 1, width: '100%', objectFit: 'contain' }}
          />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {tvChannel.logo && (
              <img src={tvChannel.logo} alt="" style={{ height: 32, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{tvChannel.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                {[tvChannel.country, tvChannel.group].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn" onClick={() => setTVMuted(m => !m)}
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name={tvMuted ? 'volume-x' : 'volume-2'} size={18} color="#fff" />
              </button>
              <button className="icon-btn" onClick={() => setTVFullscreen(false)}
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Icon name="minimize" size={18} color="#fff" />
              </button>
              <button className="icon-btn" onClick={stopTV}
                style={{ background: 'rgba(255,45,85,0.8)' }}>
                <Icon name="x" size={18} color="#fff" />
              </button>
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,45,85,0.9)', borderRadius: 6, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px' }}>LIVE</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      {createPostModal && <CreatePostModal user={user} profile={profile} onClose={() => setCreatePostModal(false)} />}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={(m) => setAuthModal(m)} />}
      {notifModal && <NotifModal user={user} onClose={() => setNotifModal(false)} />}

      {/* Global toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,10,10,0.88)', color: '#fff',
          borderRadius: 99, padding: '10px 22px',
          fontSize: '0.88rem', fontWeight: 600,
          zIndex: 9999, pointerEvents: 'none',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: 'fadeInUp 0.22s ease',
          whiteSpace: 'nowrap',
        }}>{toast.msg}</div>
      )}
    </div>
  )
}

// ─── LINK POPUP ──────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {}
  return null
}

function LinkPopup({ url, onClose }: { url: string; onClose: () => void }) {
  const ytId = getYouTubeId(url)
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 640,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
        }}>
          <Icon name="globe" size={14} color="var(--text3)" />
          <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginRight: 8 }}>Open ↗</a>
          <button onClick={onClose} style={{
            background: 'var(--bg)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="x" size={14} color="var(--text)" />
          </button>
        </div>
        {/* Content */}
        {ytId ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <iframe
            src={url}
            style={{ width: '100%', height: 480, border: 'none' }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  )
}

// ─── RICH CONTENT RENDERER ───────────────────────────────────────────────────

function RichContent({ text, onLinkClick }: { text: string; onLinkClick: (url: string) => void }) {
  const URL_REGEX = /https?:\/\/[^\s<>"']+/g
  const parts: Array<{ type: 'text' | 'link'; content: string }> = []
  let last = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) })
    parts.push({ type: 'link', content: match[0] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })

  return (
    <span>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); onLinkClick(part.content) }}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline',
              fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit',
            }}
          >
            {getYouTubeId(part.content) ? '▶ YouTube Video' : part.content.length > 40 ? part.content.slice(0, 40) + '…' : part.content}
          </button>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </span>
  )
}

// ─── HOME FEED ───────────────────────────────────────────────────────────────

// ─── SHOWBIZ TAB ─────────────────────────────────────────────────────────────

const SHOWBIZ_COUNTRIES = [
  { code: 'all', name: 'All', query: '' },
  { code: 'ke', name: 'Kenya', query: 'Kenya' },
  { code: 'ng', name: 'Nigeria', query: 'Nigeria' },
  { code: 'za', name: 'S. Africa', query: 'South Africa' },
  { code: 'us', name: 'USA', query: 'USA' },
  { code: 'gb', name: 'UK', query: 'UK' },
  { code: 'in', name: 'India', query: 'India Bollywood' },
  { code: 'gh', name: 'Ghana', query: 'Ghana' },
  { code: 'fr', name: 'France', query: 'France' },
  { code: 'br', name: 'Brazil', query: 'Brazil' },
  { code: 'jp', name: 'Japan', query: 'Japan anime' },
  { code: 'kr', name: 'Korea', query: 'Korea Kpop' },
]

const SHOWBIZ_CATEGORIES = [
  { id: 'all', label: 'All', kw: 'entertainment showbiz' },
  { id: 'movies', label: 'Movies', kw: 'movie film review' },
  { id: 'music', label: 'Music', kw: 'music album song release' },
  { id: 'celebrity', label: 'Celebrity', kw: 'celebrity star news' },
  { id: 'tv', label: 'TV & Series', kw: 'tv show series streaming' },
  { id: 'awards', label: 'Awards', kw: 'awards grammy oscars' },
]

interface ShowbizItem {
  id: string
  title: string
  description: string
  url: string
  image: string
  source: string
  publishedAt: string
  category: string
  country: string
}

function ShowbizTab() {
  const [country, setCountry] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ShowbizItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)
  const showbizLoaderRef = useRef<HTMLDivElement>(null)

  // APITube.io — YouTube data API for entertainment/showbiz video content
  const APITUBE_KEY = 'api_live_5q8pA4Tis7nF2jgpxIiE0iYydkeTmxbW6kEC7N8Q'

  useEffect(() => { setVisibleCount(12); fetchShowbiz() }, [country, category])

  // Infinite scroll for showbiz items
  useEffect(() => {
    const el = showbizLoaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(prev => prev + 12)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [items])

  async function fetchShowbiz() {
    setLoading(true); setError('')
    try {
      const selectedCountry = SHOWBIZ_COUNTRIES.find(c => c.code === country)
      const selectedCategory = SHOWBIZ_CATEGORIES.find(c => c.id === category)

      const countryQ = selectedCountry?.query || ''
      const categoryKw = selectedCategory?.kw || 'entertainment showbiz'
      const q = [categoryKw, countryQ].filter(Boolean).join(' ')

      // APITube.io — search YouTube videos for showbiz/entertainment content
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoCategoryId=24&maxResults=30&key=${APITUBE_KEY}&regionCode=${country !== 'all' ? country.toUpperCase() : 'US'}`
      
      // Use APITube.io endpoint (wraps YouTube Data API)
      const apitubeUrl = `https://apitube.io/v1/news/youtube?api_key=${APITUBE_KEY}&q=${encodeURIComponent(q)}&lang=en&limit=30`

      let parsed: ShowbizItem[] = []

      try {
        const res = await fetch(apitubeUrl)
        if (res.ok) {
          const data = await res.json()
          const articles = data.articles || data.results || data.items || []
          parsed = articles.slice(0, 30).map((item: any, idx: number) => ({
            id: `apitube-${idx}-${item.url || item.id || idx}`,
            title: item.title || item.name || 'Untitled',
            description: (item.description || item.summary || item.content || '').replace(/<[^>]+>/g, '').slice(0, 180),
            url: item.url || item.link || '#',
            image: item.image || item.thumbnail || item.urlToImage || '',
            source: item.source?.name || item.channel || item.publisher || 'APITube',
            publishedAt: item.publishedAt || item.published_at || item.pubDate || new Date().toISOString(),
            category: category === 'all' ? 'entertainment' : category,
            country: country,
          }))
        }
      } catch {}

      // Fallback to Newsdata.io entertainment feed if APITube has no results
      if (parsed.length === 0) {
        const newsdataUrl = `https://newsdata.io/api/1/news?apikey=pub_18acd4915c114d97b073acbb1170fb83&q=${encodeURIComponent(q)}&category=entertainment&language=en${country !== 'all' ? `&country=${country}` : ''}`
        try {
          const res2 = await fetch(newsdataUrl)
          if (res2.ok) {
            const data2 = await res2.json()
            const articles2 = data2.results || []
            parsed = articles2.slice(0, 30).map((item: any, idx: number) => ({
              id: `nd-${idx}-${item.article_id || idx}`,
              title: item.title || 'Untitled',
              description: (item.description || item.content || '').replace(/<[^>]+>/g, '').slice(0, 180),
              url: item.link || '#',
              image: item.image_url || '',
              source: item.source_id || 'Newsdata',
              publishedAt: item.pubDate || new Date().toISOString(),
              category: category === 'all' ? 'entertainment' : category,
              country: country,
            }))
          }
        } catch {}
      }

      // Final fallback to Google News RSS proxy
      if (parsed.length === 0) {
        const rssUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' showbiz')}&hl=en-US&gl=US&ceid=US:en`
        )}`
        const res3 = await fetch(rssUrl)
        if (res3.ok) {
          const data3 = await res3.json()
          const xml = data3.contents
          const parser = new DOMParser()
          const doc = parser.parseFromString(xml, 'application/xml')
          const channelItems = Array.from(doc.querySelectorAll('item'))
          parsed = channelItems.slice(0, 30).map((item, idx) => {
            const title = item.querySelector('title')?.textContent || ''
            const desc = item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '') || ''
            const link = item.querySelector('link')?.textContent || ''
            const pubDate = item.querySelector('pubDate')?.textContent || ''
            const source = item.querySelector('source')?.textContent || 'Google News'
            return {
              id: `rss-${idx}-${link}`,
              title: title.replace(/ - .*$/, '').trim(),
              description: desc.slice(0, 180),
              url: link, image: '',
              source, publishedAt: pubDate,
              category: category === 'all' ? 'entertainment' : category,
              country: country,
            }
          })
        }
      }

      setItems(parsed)
    } catch (e) {
      setError('Could not load showbiz feed. Check connection.')
    }
    setLoading(false)
  }

  function timeAgoShort(ts: string) {
    try {
      const d = new Date(ts)
      const now = Date.now()
      const diff = (now - d.getTime()) / 1000
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      return `${Math.floor(diff / 86400)}d ago`
    } catch { return '' }
  }

  const filtered = items.filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Search */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', alignItems: 'center', marginBottom: 14 }}>
        <Icon name="search" size={15} color="var(--text3)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search showbiz news…"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 0', fontSize: '0.86rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={13} color="var(--text3)" /></button>}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
        {SHOWBIZ_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`cat-pill${category === cat.id ? ' active' : ''}`}
            style={{ flexShrink: 0, fontSize: '0.78rem' }}>{cat.label}</button>
        ))}
      </div>

      {/* Country pills */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16 }}>
        {SHOWBIZ_COUNTRIES.map(c => (
          <button key={c.code} onClick={() => setCountry(c.code)}
            className={`cat-pill${country === c.code ? ' active' : ''}`}
            style={{ flexShrink: 0, fontSize: '0.75rem' }}>{c.name}</button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
              <div style={{ padding: 14 }}>
                <div className="skeleton" style={{ height: 13, marginBottom: 7 }} />
                <div className="skeleton" style={{ height: 11, width: '70%', marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 11, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: 'rgba(255,45,85,0.08)', color: 'var(--accent2)', borderRadius: 12, padding: '16px', textAlign: 'center', fontSize: '0.85rem', marginBottom: 12 }}>
          <div style={{ marginBottom: 6, display:'flex', justifyContent:'center' }}><Icon name='wifi' size={28} color='var(--accent2)' /></div>
          {error}
          <button onClick={fetchShowbiz} style={{ display: 'block', margin: '10px auto 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600 }}>Retry</button>
        </div>
      )}

      {/* Cards grid */}
      {!loading && filtered.length > 0 && (
        <>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            {filtered.length} stories · Live feed
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.slice(0, visibleCount).map(item => (
              <div key={item.id}
                style={{
                  background: 'var(--surface)', borderRadius: 20, overflow: 'hidden',
                  border: '0.5px solid var(--border)', cursor: 'pointer',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
                onClick={() => window.open(item.url, '_blank')}
              >
                {/* Thumbnail */}
                <div style={{ height: 160, overflow: 'hidden', position: 'relative', background: 'var(--bg3)' }}>
                  <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                    color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    {SHOWBIZ_CATEGORIES.find(c => c.id === item.category)?.label || 'Showbiz'}
                  </div>
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                    color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: '0.66rem', fontWeight: 600,
                  }}>
                    {SHOWBIZ_COUNTRIES.find(c => c.code === item.country)?.name || 'All'}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '13px 14px 14px' }}>
                  <div style={{
                    fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.4, marginBottom: 7,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    color: 'var(--text)',
                  }}>{item.title}</div>
                  {item.description && (
                    <div style={{
                      fontSize: '0.78rem', color: 'var(--text3)', lineHeight: 1.45, marginBottom: 10,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{item.description}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700,
                      background: 'rgba(124,74,30,0.1)', padding: '3px 9px', borderRadius: 99,
                      maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.source}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{timeAgoShort(item.publishedAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Infinite scroll sentinel */}
          {visibleCount < filtered.length && (
            <div ref={showbizLoaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </>
      )}

      {!loading && !error && filtered.length === 0 && items.length > 0 && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: '0.85rem' }}>No stories match your search</div>
      )}
    </div>
  )
}


type FeedTab = 'top' | 'showbiz'

function HomeFeed({ user, profile, onAuthRequired, onPlayRadio, onPlayTV, currentRadio, currentTV, onCreatePost, dataSaver = false, onToast }: {
  user: any; profile: Profile | null; onAuthRequired: () => void
  onPlayRadio: (s: RadioStation) => void; onPlayTV: (ch: TVChannel) => void
  currentRadio: RadioStation | null; currentTV: TVChannel | null
  onCreatePost: () => void; dataSaver?: boolean; onToast?: (msg: string, icon: string) => void
}) {
  const [feedTab, setFeedTab] = useState<FeedTab>('top')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const loaderRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set())
  const [followingIds, setFollowingIds] = useState<string[]>([])

  const trends = ['All', ...Array.from(new Set(posts.map(p => p.chatroom_tag).filter((t): t is string => !!t)))]
  

  useEffect(() => { setPage(0); setPosts([]); setHasMore(true); loadPosts(0) }, [feedTab, followingIds])
  useEffect(() => {
    if (user) { loadLikes(); loadSaved(); loadReposts(); loadFollowing() }
  }, [user])

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => { const next = prev + 1; loadPosts(next); return next })
      }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, feedTab])

  // realtime — new posts
  useEffect(() => {
    const channel = supabase.channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        fetchSinglePost(payload.new.id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchSinglePost(id: string) {
    const { data } = await supabase.from('posts').select('*, profiles(*)').eq('id', id).single()
    if (data) {
      const post = data as Post
      if (feedTab === 'top') {
        setPosts(prev => [post, ...prev])
      }
    }
  }

  async function loadFollowing() {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    setFollowingIds(data?.map(f => f.following_id) || [])
  }

  async function loadPosts(pageNum = 0) {
    setLoading(true)
    if (feedTab === 'showbiz') {
      setLoading(false); return
    }
    const PAGE_SIZE = 15
    const from = pageNum * PAGE_SIZE
    const { data } = await supabase.from('posts').select('*, profiles(*)')
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    const newPosts = (data as Post[]) || []
    if (pageNum === 0) setPosts(newPosts)
    else setPosts(prev => [...prev, ...newPosts])
    if (newPosts.length < PAGE_SIZE) setHasMore(false)
    setLoading(false)
  }

  async function loadLikes() {
    const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
    setLikedPosts(new Set(data?.map(l => l.post_id)))
  }

  async function loadSaved() {
    const { data } = await supabase.from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'post')
    setSavedPosts(new Set(data?.map(s => s.item_id)))
  }

  async function loadReposts() {
    const { data } = await supabase.from('reposts').select('post_id').eq('user_id', user.id)
    setRepostedPosts(new Set(data?.map((r: any) => r.post_id)))
  }

  async function toggleLike(post: Post) {
    if (!user) { onAuthRequired(); return }
    const liked = likedPosts.has(post.id)
    if (liked) {
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p))
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setLikedPosts(prev => new Set([...prev, post.id]))
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p))
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      if (post.author_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: post.author_id, actor_id: user.id, type: 'like', post_id: post.id })
      }
    }
  }

  async function toggleRepost(post: Post) {
    if (!user) { onAuthRequired(); return }
    const reposted = repostedPosts.has(post.id)
    if (reposted) {
      setRepostedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposts_count: Math.max(0, (p.reposts_count || 0) - 1) } : p))
      setTrendingPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposts_count: Math.max(0, (p.reposts_count || 0) - 1) } : p))
      await supabase.from('reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setRepostedPosts(prev => new Set([...prev, post.id]))
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p))
      setTrendingPosts(prev => prev.map(p => p.id === post.id ? { ...p, reposts_count: (p.reposts_count || 0) + 1 } : p))
      await supabase.from('reposts').insert({ post_id: post.id, user_id: user.id })
      if (post.author_id !== user.id) {
        await supabase.from('notifications').insert({ user_id: post.author_id, actor_id: user.id, type: 'repost', post_id: post.id })
      }
    }
  }

  async function toggleSave(postId: string) {
    if (!user) { onAuthRequired(); return }
    if (savedPosts.has(postId)) {
      setSavedPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'post').eq('item_id', postId)
    } else {
      setSavedPosts(prev => new Set([...prev, postId]))
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'post', item_id: postId })
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 0 0 0' }}>
      {/* ── Feed column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
      {/* ── Feed Tab Switch ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
        display: 'flex', padding: '0 16px',
      }}>
        {(['top','showbiz'] as FeedTab[]).map(tab => (
          <button key={tab} onClick={() => setFeedTab(tab)} style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '0.9rem',
            color: feedTab === tab ? 'var(--text)' : 'var(--text3)',
            borderBottom: feedTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {tab === 'top' ? 'Top Posts' : 'Showbiz'}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Inline Post Composer — X-style, always at top of feed */}
        {feedTab === 'top' && (
          <div
            onClick={onCreatePost}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--border)', padding: '12px 14px',
              marginBottom: 12, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'box-shadow 0.18s, border-color 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(${profile?.avatar_color || '135deg,var(--accent),var(--accent5)'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>
                  {profile?.avatar_letter || <Icon name="user" size={18} color="#fff" />}
                </div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text3)', fontWeight: 400 }}>
                {user ? `What's on your mind, ${profile?.display_name?.split(' ')[0] || 'friend'}?` : 'Sign in to share your thoughts…'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Post
              </div>
            </div>
          </div>
        )}

        {/* Categories removed per design spec */}

        {/* Following empty state */}
        {feedTab === 'showbiz' && <ShowbizTab />}

        {/* Top empty state */}
        {feedTab === 'top' && !loading && posts.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}></div>
            <div className="empty-title">No posts yet</div>
            <div className="empty-sub">Be the first to share something with the community.</div>
          </div>
        )}

        {/* Skeleton */}
        {feedTab === 'top' && loading && Array(3).fill(0).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '25%' }} />
              </div>
            </div>
            <div className="skeleton" style={{ height: 12, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '80%' }} />
          </div>
        ))}

        {/* Posts — Friendster card feed */}
        {feedTab === 'top' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post}
                liked={likedPosts.has(post.id)}
                reposted={repostedPosts.has(post.id)}
                onLike={() => toggleLike(post)}
                onRepost={() => toggleRepost(post)}
                user={user}
                profile={profile}
                onAuthRequired={onAuthRequired}
                dataSaver={dataSaver}
                onToast={onToast}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading && <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />}
              {!hasMore && posts.length > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>You're all caught up ✓</div>}
            </div>
          </div>
        )}
      </div>
      </div>{/* end feed column */}

      {/* ── Sidebar (desktop only) ── */}
      <aside className="home-sidebar">
        <HomeSuggestedUsers user={user} />
        <HomeRadioCard onPlay={onPlayRadio} current={currentRadio} />
        <HomeTVCard onPlay={onPlayTV} current={currentTV} />
        <HomeNewsCard />
      </aside>
    </div>
  )
}

// ─── SUGGESTED USERS ─────────────────────────────────────────────────────────

function HomeSuggestedUsers({ user }: { user: any }) {
  const [suggested, setSuggested] = useState<Profile[]>([])
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSuggested() }, [user])

  async function loadSuggested() {
    setLoading(true)
    try {
      // Get who current user follows
      let followingIds: string[] = []
      if (user) {
        const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        followingIds = follows?.map((f: any) => f.following_id) || []
        setFollowingSet(new Set(followingIds))
      }
      // Fetch top profiles not already followed, not self
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('followers_count', { ascending: false })
        .limit(20)

      let filtered = (profiles as Profile[] || []).filter(p =>
        p.id !== user?.id && !followingIds.includes(p.id)
      ).slice(0, 5)

      // If less than 3, show some popular ones even if followed
      if (filtered.length < 3 && profiles) {
        filtered = (profiles as Profile[]).filter(p => p.id !== user?.id).slice(0, 5)
      }
      setSuggested(filtered)
    } catch {}
    setLoading(false)
  }

  async function toggleFollow(targetId: string) {
    if (!user) return
    if (followingSet.has(targetId)) {
      setFollowingSet(prev => { const s = new Set(prev); s.delete(targetId); return s })
      setSuggested(prev => prev.map(p => p.id === targetId ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) - 1) } : p))
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
    } else {
      setFollowingSet(prev => new Set([...prev, targetId]))
      setSuggested(prev => prev.map(p => p.id === targetId ? { ...p, followers_count: (p.followers_count || 0) + 1 } : p))
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      await supabase.from('notifications').insert({ user_id: targetId, actor_id: user.id, type: 'follow' })
    }
  }

  if (!loading && suggested.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      border: '0.5px solid var(--border)', marginBottom: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7950f2,#db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="users" size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Suggested for you</span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '8px 16px' }}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 11, width: '60%', marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 9, width: '40%' }} />
              </div>
              <div className="skeleton" style={{ width: 52, height: 26, borderRadius: 99 }} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          {suggested.map((acc, i) => {
            const isFollowing = followingSet.has(acc.id)
            return (
              <div key={acc.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                borderBottom: i < suggested.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <Avatar letter={acc.avatar_letter || 'U'} color={acc.avatar_color || '135deg,#7950f2,#db2777'} size={36} photoUrl={acc.avatar_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {acc.display_name}
                    {acc.verified && <VerifiedBadge size="sm" />}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 1 }}>
                    {(acc.followers_count || 0).toLocaleString()} followers
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(acc.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.18s', flexShrink: 0,
                    border: isFollowing ? '1.5px solid var(--border)' : '1.5px solid var(--accent)',
                    background: isFollowing ? 'transparent' : 'var(--accent)',
                    color: isFollowing ? 'var(--text)' : '#fff',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >{isFollowing ? 'Following' : 'Follow'}</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── HOME SIDEBAR CARDS ──────────────────────────────────────────────────────

function SidebarCard({ title, icon, accent, children }: { title: string; icon: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      border: '0.5px solid var(--border)', marginBottom: 16, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function HomeRadioCard({ onPlay, current }: { onPlay: (s: RadioStation) => void; current: RadioStation | null }) {
  const [stations, setStations] = useState<RadioStation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rgTrendingFetch()
      .then(d => setStations(d.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SidebarCard title="Top Radio" icon="radio" accent="var(--accent)">
      {loading ? (
        <div style={{ padding: '10px 16px' }}>
          {Array(4).fill(0).map((_,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 11, width: '60%', marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 9, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {stations.map((s, i) => {
            const isActive = current?.stationuuid === s.stationuuid
            return (
              <div key={s.stationuuid} onClick={() => onPlay(s)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer',
                borderBottom: i < stations.length - 1 ? '0.5px solid var(--border)' : 'none',
                background: isActive ? 'rgba(0,122,255,0.06)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                  background: 'linear-gradient(135deg,var(--accent5),var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  {s.favicon
                    ? <img src={s.favicon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <Icon name="radio" size={16} color="#fff" />}
                  {isActive && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,122,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                        {[0,1,2].map(j => <div key={j} style={{ width: 2, background: '#fff', borderRadius: 2, height: `${50+j*20}%`, animation: `eq-bar 0.8s ease-in-out ${j*0.15}s infinite alternate` }} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 1 }}>{s.country || 'Radio Garden'}</div>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isActive ? 'var(--accent)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={isActive ? 'pause' : 'play'} size={11} color={isActive ? '#fff' : 'var(--accent)'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SidebarCard>
  )
}

function HomeTVCard({ onPlay, current }: { onPlay: (ch: TVChannel) => void; current: TVChannel | null }) {
  const [channels, setChannels] = useState<TVChannel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTVChannels('KE', '')
      .then(chs => setChannels(chs.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SidebarCard title="Top TV" icon="tv" accent="var(--accent2)">
      {loading ? (
        <div style={{ padding: '10px 16px' }}>
          {Array(4).fill(0).map((_,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
              <div className="skeleton" style={{ width: 52, height: 34, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 11, width: '55%', marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 9, width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {channels.map((ch, i) => {
            const isActive = current?.tvgId === ch.tvgId
            return (
              <div key={`${ch.tvgId}-${i}`} onClick={() => onPlay(ch)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', cursor: 'pointer',
                borderBottom: i < channels.length - 1 ? '0.5px solid var(--border)' : 'none',
                background: isActive ? 'rgba(255,45,85,0.06)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ width: 52, height: 34, borderRadius: 6, flexShrink: 0, overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {ch.logo
                    ? <img src={ch.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <Icon name="tv" size={16} color="#666" />}
                  <div style={{ position: 'absolute', top: 2, left: 3, background: 'var(--accent2)', color: '#fff', fontSize: '0.42rem', fontWeight: 800, padding: '1px 3px', borderRadius: 2, letterSpacing: '0.5px' }}>LIVE</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'var(--accent2)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 1 }}>{[ch.country, ch.group].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isActive ? 'var(--accent2)' : 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={isActive ? 'pause' : 'play'} size={11} color={isActive ? '#fff' : 'var(--accent2)'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SidebarCard>
  )
}

function HomeNewsCard() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(d => setArticles((d.articles || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const catColors: Record<string, string> = {
    Technology: '#6c47ff', Politics: '#ff9500', Business: '#34c759',
    Sports: '#007aff', Entertainment: '#ff2d55', Health: '#ff6b6b',
    Science: '#00c7be', World: '#5ac8fa', Africa: '#ff9500',
  }

  const catIcons: Record<string, { icon: string; bg: string }> = {
    Technology: { icon: 'zap', bg: 'linear-gradient(135deg,#1a0e3a,#302b63)' },
    Politics:   { icon: 'globe', bg: 'linear-gradient(135deg,#3a1f00,#6b3a00)' },
    Business:   { icon: 'trending', bg: 'linear-gradient(135deg,#0f2027,#203a43)' },
    Sports:     { icon: 'trophy', bg: 'linear-gradient(135deg,#001f4d,#003580)' },
    Entertainment: { icon: 'tv', bg: 'linear-gradient(135deg,#3a0020,#7a0040)' },
    Health:     { icon: 'heart', bg: 'linear-gradient(135deg,#3a0010,#7a1030)' },
    Science:    { icon: 'rocket', bg: 'linear-gradient(135deg,#003a38,#006b66)' },
    World:      { icon: 'globe', bg: 'linear-gradient(135deg,#003a5c,#006b9e)' },
    Africa:     { icon: 'globe', bg: 'linear-gradient(135deg,#3a2000,#7a4a00)' },
  }

  return (
    <SidebarCard title="Top News" icon="news" accent="#ff9500">
      {loading ? (
        <div style={{ padding: '10px 16px' }}>
          {Array(4).fill(0).map((_,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 11, marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 11, width: '75%', marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 9, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {articles.map((a, i) => {
            const ci = catIcons[a.category] || { icon: 'news', bg: 'linear-gradient(135deg,#1a1a2e,#2a2a4e)' }
            const catColor = catColors[a.category] || 'var(--accent)'
            return (
            <div key={a.id} onClick={() => a.url && window.open(a.url, '_blank')} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px', cursor: 'pointer',
              borderBottom: i < articles.length - 1 ? '0.5px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}>
              {/* Category icon thumbnail */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                background: ci.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 1.5px ${catColor}44`,
              }}>
                <Icon name={ci.icon} size={22} color={catColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: catColor, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{a.category}</div>
                <div style={{ fontSize: '0.79rem', fontWeight: 600, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text)' }}>{a.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>{a.source} · {timeAgo(a.published_at)} ago</div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </SidebarCard>
  )
}

// ─── POST CARD (Reddit-style) ─────────────────────────────────────────────────

// ─── POST CARD (Reddit-style) ─────────────────────────────────────────────────

function PostCard({ post, liked, reposted, onLike, onRepost, user, profile, onAuthRequired, dataSaver = false, onToast }: {
  post: Post; liked: boolean; reposted: boolean
  onLike: () => void; onRepost: () => void
  user: any; profile: Profile | null; onAuthRequired: () => void
  dataSaver?: boolean; onToast?: (msg: string, icon: string) => void
}) {
  const p = post.profiles
  const grad = p?.avatar_color || '135deg,#007aff,#5856d6'
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentCount, setCommentCount] = useState(post.comments_count)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [postMenu, setPostMenu] = useState(false)
  const [editPostModal, setEditPostModal] = useState(false)
  const [localContent, setLocalContent] = useState(post.content)
  const [deleted, setDeleted] = useState(false)
  const [linkPopupUrl, setLinkPopupUrl] = useState<string | null>(null)
  const seedCount = (n: number, seed: number) => n > 0 ? n : seed
  const [liveLikes, setLiveLikes] = useState(() => seedCount(post.likes_count, Math.floor(Math.random() * 180) + 12))
  const [liveReposts, setLiveReposts] = useState(() => seedCount(post.reposts_count || 0, Math.floor(Math.random() * 60) + 3))
  const [liveShares, setLiveShares] = useState(() => Math.floor(Math.random() * 45) + 2)
  const menuRef = useRef<HTMLDivElement>(null)
  const postCardRef = useRef<HTMLDivElement>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCapturing, setShareCapturing] = useState(false)
  const [cardToast, setCardToast] = useState<string | null>(null)
  const postSlug = post.slug ?? post.id.slice(0, 8)

  // Follow state for post author
  const [followingAuthor, setFollowingAuthor] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!user || !p || user.id === p.id) return
    supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', p.id).single()
      .then(({ data }) => setFollowingAuthor(!!data))
  }, [user, p?.id])

  async function handleFollow(e: React.MouseEvent) {
    e.stopPropagation()
    if (!user) { onAuthRequired(); return }
    if (!p) return
    setFollowLoading(true)
    if (followingAuthor) {
      setFollowingAuthor(false)
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', p.id)
    } else {
      setFollowingAuthor(true)
      await supabase.from('follows').insert({ follower_id: user.id, following_id: p.id })
      await supabase.from('notifications').insert({ user_id: p.id, actor_id: user.id, type: 'follow' })
    }
    setFollowLoading(false)
  }

  function fireToast(msg: string, icon: string) {
    setCardToast(msg)
    setTimeout(() => setCardToast(null), 1800)
    onToast?.(msg, icon)
  }

  function handleLike() {
    if (!user) { onAuthRequired(); return }
    setLiveLikes(prev => liked ? Math.max(0, prev - 1) : prev + 1)
    onLike()
  }

  function handleRepost() {
    if (!user) { onAuthRequired(); return }
    setLiveReposts(prev => reposted ? Math.max(0, prev - 1) : prev + 1)
    fireToast(reposted ? 'Repost removed' : '🔁 Reposted!', 'zap')
    onRepost()
  }

  async function handleShare() {
    setShareLoading(true)
    setLiveShares(prev => prev + 1)
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${postSlug}` : `/post/${postSlug}`
    setShareCapturing(true)
    await new Promise(r => setTimeout(r, 80))
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = postCardRef.current
      if (!el) throw new Error('no ref')
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true, logging: false } as any)
      setShareCapturing(false)
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `cc-post-${postSlug}.png`, { type: 'image/png' })
        const shareData: ShareData = { title: `${p?.display_name || 'CC'} on CC`, text: localContent.slice(0, 100) + (localContent.length > 100 ? '…' : ''), url: postUrl }
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ ...shareData, files: [file] }).catch(() => {}) }
        else if (navigator.share) { await navigator.share(shareData).catch(() => {}) }
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cc-post-${postSlug}.png`; a.click(); try { await navigator.clipboard.writeText(postUrl) } catch {} }
        setShareLoading(false)
      }, 'image/png')
    } catch {
      setShareCapturing(false)
      if (navigator.share) await navigator.share({ text: localContent, url: postUrl }).catch(() => {})
      setShareLoading(false)
    }
  }

  useEffect(() => {
    const channel = supabase.channel(`post-stats-${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes', filter: `post_id=eq.${post.id}` }, () => {
        supabase.from('posts').select('likes_count,comments_count,reposts_count').eq('id', post.id).single().then(({ data }) => {
          if (data) { if (data.likes_count > 0) setLiveLikes(data.likes_count); setCommentCount(data.comments_count) }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reposts', filter: `post_id=eq.${post.id}` }, () => {
        supabase.from('posts').select('reposts_count').eq('id', post.id).single().then(({ data }) => {
          if (data && data.reposts_count > 0) setLiveReposts(data.reposts_count)
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, () => {
        supabase.from('posts').select('comments_count').eq('id', post.id).single().then(({ data }) => { if (data) setCommentCount(data.comments_count) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [post.id])

  useEffect(() => { if (post.likes_count > 0) setLiveLikes(post.likes_count) }, [post.likes_count])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPostMenu(false)
    }
    if (postMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [postMenu])

  async function toggleExpand() {
    const next = !expanded; setExpanded(next)
    if (next && comments.length === 0) {
      setCommentsLoading(true)
      const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', post.id).order('created_at')
      setComments(data || []); setCommentsLoading(false)
    }
  }

  async function submitComment() {
    if (!user) { onAuthRequired(); return }
    if (!commentText.trim()) return
    const text = commentText.trim(); setCommentText('')
    const parentId = replyTo?.id || null
    const parentAuthorId = replyTo ? comments.find(c => c.id === replyTo.id)?.author_id : null
    setReplyTo(null)
    const { data } = await supabase.from('comments').insert({ post_id: post.id, author_id: user.id, content: text, parent_comment_id: parentId }).select('*, profiles(*)').single()
    if (data) {
      setComments(prev => [...prev, data]); setCommentCount(c => c + 1)
      fireToast('💬 Comment posted!', 'message-circle')
      if (post.author_id !== user.id) await supabase.from('notifications').insert({ user_id: post.author_id, actor_id: user.id, type: 'comment', post_id: post.id, comment_id: data.id })
      if (parentId && parentAuthorId && parentAuthorId !== user.id && parentAuthorId !== post.author_id) await supabase.from('notifications').insert({ user_id: parentAuthorId, actor_id: user.id, type: 'reply', post_id: post.id, comment_id: data.id })
    }
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id)); setCommentCount(c => c - 1)
  }

  async function deletePost() {
    await supabase.from('posts').delete().eq('id', post.id)
    setDeleted(true); setPostMenu(false)
  }

  async function saveEditPost(newContent: string) {
    await supabase.from('posts').update({ content: newContent }).eq('id', post.id)
    setLocalContent(newContent); setEditPostModal(false)
  }

  if (deleted) return null

  const isOwnPost = user?.id === (p as any)?.id

  return (
    <div ref={postCardRef} id={`post-${post.id}`} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
      boxShadow: 'var(--shadow-sm)',
      ...(shareCapturing ? { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' } : {})
    }}>
      {cardToast && (
        <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.82)', color: '#fff', borderRadius: 99, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600, zIndex: 20, whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeInUp 0.2s ease' }}>{cardToast}</div>
      )}

      {/* Repost banner */}
      {(post as any).reposted_from && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          Reposted
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar letter={p?.avatar_letter || 'U'} color={grad} size={38} photoUrl={p?.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{p?.display_name || 'Unknown'}</span>
            {p?.verified && <VerifiedBadge size="sm" />}
            {post.chatroom_tag && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: '0.6rem', fontWeight: 700 }}>#{post.chatroom_tag}</span>}
            <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>· {timeAgo(post.created_at)}</span>
          </div>
          {p?.username && <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>@{p.username}</div>}
        </div>
        {/* Follow btn + menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {!isOwnPost && p && (
            <button onClick={handleFollow} disabled={followLoading} style={{
              padding: '4px 12px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              border: followingAuthor ? '1.5px solid var(--border)' : '1.5px solid var(--accent)',
              background: followingAuthor ? 'transparent' : 'var(--accent)',
              color: followingAuthor ? 'var(--text)' : '#fff',
              transition: 'all 0.18s', opacity: followLoading ? 0.6 : 1,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}>{followingAuthor ? 'Following' : 'Follow'}</button>
          )}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setPostMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text3)' }}>
              <Icon name="more-h" size={15} color="var(--text3)" />
            </button>
            {postMenu && (
              <div style={{ position: 'absolute', right: 0, top: 26, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 99, minWidth: 150, overflow: 'hidden' }}>
                {user?.id === post.author_id && (
                  <><button onClick={() => { setEditPostModal(true); setPostMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}><Icon name="edit" size={13} color="var(--accent)" />Edit</button>
                  <div style={{ height: '0.5px', background: 'var(--border)' }} />
                  <button onClick={deletePost} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent2)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}><Icon name="x" size={13} color="var(--accent2)" />Delete</button></>
                )}
                <button onClick={() => { navigator.clipboard?.writeText(localContent); setPostMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}><Icon name="share" size={13} color="var(--text3)" />Copy text</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content + media */}
      <div style={{ padding: '0 14px 10px', cursor: 'pointer' }} onClick={toggleExpand}>
        {localContent && (
          <p style={{ fontSize: '0.93rem', lineHeight: 1.65, color: 'var(--text)', fontWeight: 400, marginBottom: 8 }}>
            <RichContent text={localContent} onLinkClick={url => setLinkPopupUrl(url)} />
          </p>
        )}
        {(post.media_urls && post.media_urls.length > 1) ? (
          <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length === 2 ? '1fr 1fr' : post.media_urls.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 2, overflow: 'hidden', borderRadius: 8 }}>
            {post.media_urls.map((url, i) => (<div key={i} style={{ aspectRatio: '1/1', overflow: 'hidden' }}><img src={dataSaver ? (url + '?w=200&q=40') : url} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /></div>))}
          </div>
        ) : post.media_url ? (
          <div style={{ overflow: 'hidden', borderRadius: 8 }}>
            <img src={dataSaver ? (post.media_url + '?w=400&q=40') : post.media_url} alt="Post image" style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} loading="lazy" />
          </div>
        ) : null}
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderTop: '1px solid var(--border)',
        padding: '2px 4px',
      }}>
        {/* Like — thumbs up */}
        <button onClick={handleLike} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '9px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: liked ? 'var(--accent)' : 'var(--text3)',
          fontSize: '0.78rem', fontWeight: 600, borderRadius: 8,
          transition: 'background 0.15s, color 0.15s',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(25,113,194,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = liked ? 'var(--accent)' : 'var(--text3)' }}>
          {liked
            ? <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><rect x="2" y="9" width="4" height="12" rx="1" fill="currentColor"/></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          }
          <span>{liveLikes > 999 ? `${(liveLikes/1000).toFixed(1)}k` : liveLikes}</span>
        </button>

        {/* Comment */}
        <button onClick={toggleExpand} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '9px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: expanded ? 'var(--accent5)' : 'var(--text3)',
          fontSize: '0.78rem', fontWeight: 600, borderRadius: 8,
          transition: 'background 0.15s, color 0.15s',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(45,160,216,0.08)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent5)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = expanded ? 'var(--accent5)' : 'var(--text3)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>{commentCount}</span>
        </button>

        {/* Repost */}
        <button onClick={handleRepost} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '9px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: reposted ? '#46d160' : 'var(--text3)',
          fontSize: '0.78rem', fontWeight: 600, borderRadius: 8,
          transition: 'background 0.15s, color 0.15s',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(70,209,96,0.08)'; (e.currentTarget as HTMLElement).style.color = '#46d160' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = reposted ? '#46d160' : 'var(--text3)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={reposted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span>{liveReposts}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} disabled={shareLoading} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '9px 4px', background: 'transparent', border: 'none', cursor: shareLoading ? 'wait' : 'pointer',
          color: 'var(--text3)', fontSize: '0.78rem', fontWeight: 600, borderRadius: 8,
          transition: 'background 0.15s, color 0.15s', opacity: shareLoading ? 0.6 : 1,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
        onMouseEnter={e => { if (!shareLoading) { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)' }}>
          {shareLoading ? <Icon name="loader" size={17} color="currentColor" /> : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
          <span>{liveShares}</span>
        </button>
      </div>

      {/* Share branding — screenshot only */}
      {shareCapturing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src="/cc-logo.png" alt="CC" style={{ width: 20, height: 20, objectFit: 'contain' }} /><span style={{ fontWeight: 800, fontSize: '0.82rem' }}>CC</span></div>
          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>/post/{postSlug}</div>
        </div>
      )}

      {/* Inline comments */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '12px 14px' }}>
          {commentsLoading && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '8px 0', fontSize: '0.83rem' }}>Loading…</div>}
          {!commentsLoading && comments.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '8px 0', fontSize: '0.83rem' }}>No comments yet — be first!</div>}
          {comments.filter(c => !c.parent_comment_id).map(c => (
            <div key={c.id}>
              <CommentRow comment={c} currentUserId={user?.id} onDelete={() => deleteComment(c.id)} onQuote={(text, author) => { setCommentText(`> ${author}: "${text}"\n`); setReplyTo(null) }} onReply={(id, name) => { setReplyTo({ id, name }); setCommentText('') }} />
              {comments.filter(r => r.parent_comment_id === c.id).map(reply => (
                <div key={reply.id} style={{ marginLeft: 38, borderLeft: '2px solid var(--border)', paddingLeft: 10 }}>
                  <CommentRow comment={reply} currentUserId={user?.id} onDelete={() => deleteComment(reply.id)} onQuote={(text, author) => { setCommentText(`> ${author}: "${text}"\n`); setReplyTo(null) }} onReply={(id, name) => { setReplyTo({ id, name }); setCommentText('') }} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            {replyTo && (<div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>↩ Replying to {replyTo.name}</span><button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Icon name="x" size={11} color="var(--text3)" /></button></div>)}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {profile && <Avatar letter={profile.avatar_letter || 'U'} color={profile.avatar_color || '135deg,#007aff,#5856d6'} size={30} photoUrl={profile.avatar_url} />}
              <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea rows={1} placeholder={replyTo ? `Reply to ${replyTo.name}…` : (user ? 'Add a comment…' : 'Sign in to comment…')} value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }} style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.87rem', color: 'var(--text)', outline: 'none', maxHeight: 100 }} />
                <button onClick={submitComment} style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="send" size={12} color="#fff" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editPostModal && <EditTextModal title="Edit post" initialText={localContent} onSave={saveEditPost} onClose={() => setEditPostModal(false)} />}
      {linkPopupUrl && <LinkPopup url={linkPopupUrl} onClose={() => setLinkPopupUrl(null)} />}
    </div>
  )
}

function CommentRow({ comment: c, currentUserId, onDelete, onQuote, onReply }: {
  comment: any; currentUserId?: string
  onDelete: () => void; onQuote: (text: string, author: string) => void
  onReply: (commentId: string, authorName: string) => void
}) {
  const [menu, setMenu] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [localContent, setLocalContent] = useState(c.content)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    if (menu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menu])

  async function saveEdit(newText: string) {
    await supabase.from('comments').update({ content: newText }).eq('id', c.id)
    setLocalContent(newText)
    setEditModal(false)
  }

  // Parse quoted content
  const lines = localContent.split('\n')
  const quotedLines = lines.filter((l: string) => l.startsWith('> '))
  const bodyLines = lines.filter((l: string) => !l.startsWith('> '))
  const hasQuote = quotedLines.length > 0

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <Avatar letter={c.profiles?.avatar_letter || 'U'} color={c.profiles?.avatar_color || '135deg,#007aff,#5856d6'} size={30} photoUrl={c.profiles?.avatar_url} />
      <div style={{ flex: 1 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              {c.profiles?.display_name}
              {c.profiles?.verified && <VerifiedBadge size="sm" />}
            </div>
          {hasQuote && (
            <div style={{ background: 'var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 6, padding: '4px 8px', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
              {quotedLines.map((l: string) => l.replace(/^> /, '')).join(' ')}
            </div>
          )}
          <div style={{ fontSize: '0.87rem', lineHeight: 1.5 }}>{bodyLines.join('\n')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, paddingLeft: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{timeAgo(c.created_at)}</span>
          <button onClick={() => onReply(c.id, c.profiles?.display_name || 'User')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, padding: 0 }}>Reply</button>
          <button onClick={() => onQuote(localContent, c.profiles?.display_name || 'User')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text3)', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, padding: 0 }}>Quote</button>
          <div style={{ position: 'relative', marginLeft: 'auto' }} ref={menuRef}>
            <button onClick={() => setMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <Icon name="more-h" size={14} color="var(--text3)" />
            </button>
            {menu && (
              <div style={{ position: 'absolute', right: 0, top: 20, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 99, minWidth: 140, overflow: 'hidden' }}>
                {currentUserId === c.author_id && (
                  <>
                    <button onClick={() => { setEditModal(true); setMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <Icon name="edit" size={13} color="var(--accent)" /> Edit
                    </button>
                    <div style={{ height: '0.5px', background: 'var(--border)' }} />
                    <button onClick={() => { onDelete(); setMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent2)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <Icon name="x" size={13} color="var(--accent2)" /> Delete
                    </button>
                  </>
                )}
                <button onClick={() => { navigator.clipboard?.writeText(localContent); setMenu(false) }} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <Icon name="share" size={13} color="var(--text3)" /> Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {editModal && <EditTextModal title="Edit comment" initialText={localContent} onSave={saveEdit} onClose={() => setEditModal(false)} />}
    </div>
  )
}

// ─── EDIT TEXT MODAL ─────────────────────────────────────────────────────────

function EditTextModal({ title, initialText, onSave, onClose }: { title: string; initialText: string; onSave: (t: string) => void; onClose: () => void }) {
  const [text, setText] = useState(initialText)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 500 }}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14 }}>{title}</div>
        <textarea className="post-input" rows={4} value={text} onChange={e => setText(e.target.value)} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.9rem', color: 'var(--text)' }}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(text.trim())} style={{ flex: 1, padding: 11 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ─── NEWS PAGE ───────────────────────────────────────────────────────────────

const NEWS_CATS = ['All','Technology','Business','Sports','Entertainment','Politics','Art','Science','Health']

function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')
  const searchTimer = useRef<any>(null)

  useEffect(() => { loadArticles() }, [cat])

  // Debounce search — hit API for server-side full-text search
  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (!searchDebounce.trim()) { loadArticles(); return }
    searchTimer.current = setTimeout(() => searchArticles(searchDebounce), 400)
    return () => clearTimeout(searchTimer.current)
  }, [searchDebounce])

  async function loadArticles(forceRefresh = false) {
    setLoading(true)
    try {
      const catParam = cat !== 'All' ? `&category=${encodeURIComponent(cat)}` : ''
      const refreshParam = forceRefresh ? '&refresh=true' : ''
      const res = await fetch(`/api/news?${catParam}${refreshParam}`)
      const data = await res.json()
      setArticles(data.articles || [])
    } catch {
      // Fallback: query Supabase directly
      let q = supabase.from('news_articles').select('*').order('published_at', { ascending: false })
      if (cat !== 'All') q = q.eq('category', cat)
      const { data } = await q.limit(30)
      setArticles(data || [])
    }
    setLoading(false)
  }

  async function searchArticles(q: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setArticles(data.articles || [])
    } catch {
      const { data } = await supabase.from('news_articles').select('*')
        .or(`title.ilike.%${q}%,preview.ilike.%${q}%`)
        .order('published_at', { ascending: false }).limit(20)
      setArticles(data || [])
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadArticles(true)
    setRefreshing(false)
  }

  function handleSearchChange(val: string) {
    setSearch(val)
    setSearchDebounce(val)
  }

  // Client-side filter when no debounce active
  const filtered = searchDebounce ? articles : articles.filter(a => cat === 'All' || a.category === cat)
  const featured = filtered.find(a => a.is_featured) || filtered[0]
  const rest = filtered.filter(a => a.id !== featured?.id)

  // Illustrated SVG thumbnails per category
  function NewsIllustration({ category, size = 'featured' }: { category: string; size?: 'featured' | 'card' }) {
    const h = size === 'featured' ? 220 : 72
    const w = size === 'featured' ? '100%' : 86
    const illustrations: Record<string, JSX.Element> = {
      Technology: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0f0c29"/><stop offset="100%" stopColor="#302b63"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#tg)"/>
          <rect x="30" y="25" width="140" height="80" rx="6" fill="none" stroke="#6c47ff" strokeWidth="2"/>
          <rect x="38" y="33" width="124" height="64" rx="3" fill="#1a1040"/>
          <line x1="38" y1="48" x2="162" y2="48" stroke="#6c47ff" strokeWidth="0.5" strokeOpacity="0.4"/>
          {[0,1,2,3].map(i => <rect key={i} x={45+i*26} y={56} width={20} height={6} rx={2} fill="#6c47ff" opacity={0.4+i*0.15}/>)}
          <circle cx="100" cy="78" r="8" fill="none" stroke="#00c8a0" strokeWidth="1.5"/>
          <path d="M96 78 l4-4 4 4" stroke="#00c8a0" strokeWidth="1.5" fill="none"/>
          <rect x="85" y="105" width="30" height="4" rx="2" fill="#6c47ff" opacity="0.6"/>
          <line x1="100" y1="109" x2="100" y2="115" stroke="#6c47ff" strokeWidth="2" opacity="0.6"/>
        </svg>
      ),
      Business: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0f2027"/><stop offset="100%" stopColor="#203a43"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#bg2)"/>
          {[{x:30,h:60,c:'#34c759'},{x:60,h:40,c:'#34c75980'},{x:90,h:75,c:'#34c759'},{x:120,h:50,c:'#34c75980'},{x:150,h:85,c:'#34c759'}].map((b,i) => (
            <rect key={i} x={b.x} y={105-b.h} width={22} height={b.h} rx={3} fill={b.c}/>
          ))}
          <line x1="20" y1="105" x2="180" y2="105" stroke="#34c759" strokeWidth="1" strokeOpacity="0.4"/>
          <path d="M30 80 60 60 90 45 120 65 150 30" stroke="#00c8a0" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {[{x:30,y:80},{x:60,y:60},{x:90,y:45},{x:120,y:65},{x:150,y:30}].map((p,i) => (
            <circle key={i} cx={p.x+11} cy={p.y} r={3} fill="#00c8a0"/>
          ))}
        </svg>
      ),
      Sports: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#16213e"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#sg)"/>
          <ellipse cx="100" cy="60" rx="55" ry="40" fill="none" stroke="#ff9500" strokeWidth="1.5" strokeOpacity="0.5"/>
          <line x1="100" y1="20" x2="100" y2="100" stroke="#ff9500" strokeWidth="1" strokeOpacity="0.4"/>
          <rect x="45" y="45" width="110" height="30" rx="2" fill="none" stroke="#ff9500" strokeWidth="0.8" strokeOpacity="0.3"/>
          <circle cx="100" cy="60" r="10" fill="none" stroke="#ff9500" strokeWidth="1.5"/>
          <circle cx="100" cy="60" r="4" fill="#ff9500"/>
          <rect x="45" y="50" width="5" height="20" rx="1" fill="#ff9500" opacity="0.6"/>
          <rect x="150" y="50" width="5" height="20" rx="1" fill="#ff9500" opacity="0.6"/>
        </svg>
      ),
      Entertainment: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a0533"/><stop offset="100%" stopColor="#2d0a4e"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#eg)"/>
          <rect x="30" y="25" width="140" height="85" rx="6" fill="#0a0a1a"/>
          <polygon points="85,45 85,85 135,65" fill="#ff2d55" opacity="0.9"/>
          {[0,1,2,3,4].map(i => <circle key={i} cx={50+i*25} cy={100} r={3} fill={i===2?'#ff2d55':'#ffffff40'}/>)}
          <rect x="30" y="25" width="140" height="8" rx="0" fill="#ffffff10"/>
        </svg>
      ),
      Politics: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0a0a2e"/><stop offset="100%" stopColor="#1a1060"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#pg)"/>
          <polygon points="100,20 120,65 170,65 130,90 145,135 100,108 55,135 70,90 30,65 80,65" fill="none" stroke="#5856d6" strokeWidth="1.5"/>
          <polygon points="100,35 113,58 140,58 118,73 126,98 100,82 74,98 82,73 60,58 87,58" fill="#5856d6" opacity="0.3"/>
          <circle cx="100" cy="60" r="12" fill="#5856d6" opacity="0.8"/>
        </svg>
      ),
      Art: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a0010"/><stop offset="100%" stopColor="#2d0030"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#ag)"/>
          <circle cx="80" cy="55" r="30" fill="#ff6b6b" opacity="0.3"/>
          <circle cx="120" cy="55" r="30" fill="#6c47ff" opacity="0.3"/>
          <circle cx="100" cy="80" r="30" fill="#ffd93d" opacity="0.3"/>
          <circle cx="80" cy="55" r="15" fill="none" stroke="#ff6b6b" strokeWidth="1.5"/>
          <circle cx="120" cy="55" r="15" fill="none" stroke="#6c47ff" strokeWidth="1.5"/>
          <circle cx="100" cy="80" r="15" fill="none" stroke="#ffd93d" strokeWidth="1.5"/>
          <path d="M60 95 Q100 105 140 95" stroke="#ffffff40" strokeWidth="1" fill="none"/>
        </svg>
      ),
      Science: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="scg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#001a1a"/><stop offset="100%" stopColor="#003333"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#scg)"/>
          <path d="M80 30 L80 75 Q80 105 100 105 Q120 105 120 75 L120 30" stroke="#00c8a0" strokeWidth="2" fill="none"/>
          <line x1="72" y1="30" x2="128" y2="30" stroke="#00c8a0" strokeWidth="2"/>
          <line x1="76" y1="45" x2="124" y2="45" stroke="#00c8a040" strokeWidth="1"/>
          <circle cx="100" cy="88" r="10" fill="#00c8a0" opacity="0.6"/>
          <circle cx="88" cy="82" r="5" fill="#00c8a0" opacity="0.4"/>
          <circle cx="112" cy="82" r="5" fill="#00c8a0" opacity="0.4"/>
        </svg>
      ),
      Health: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a0010"/><stop offset="100%" stopColor="#200020"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#hg)"/>
          <path d="M100 90 C100 90 55 65 55 42 C55 28 65 20 77 20 C87 20 95 27 100 35 C105 27 113 20 123 20 C135 20 145 28 145 42 C145 65 100 90 100 90Z" fill="#ff2d55" opacity="0.7"/>
          <polyline points="30,60 55,60 65,40 80,80 95,55 110,70 125,45 145,60 170,60" stroke="#ff2d55" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ),
      default: (
        <svg width={w} height={h} viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a0533"/><stop offset="100%" stopColor="#0a1a4a"/></linearGradient></defs>
          <rect width="200" height="120" fill="url(#dg)"/>
          <rect x="35" y="25" width="130" height="15" rx="3" fill="#ffffff20"/>
          <rect x="35" y="48" width="95" height="10" rx="2" fill="#ffffff15"/>
          <rect x="35" y="66" width="110" height="10" rx="2" fill="#ffffff15"/>
          <rect x="35" y="84" width="75" height="10" rx="2" fill="#ffffff15"/>
          <rect x="140" y="48" width="25" height="46" rx="3" fill="#6c47ff" opacity="0.5"/>
        </svg>
      ),
    }
    return illustrations[category] || illustrations.default
  }

  const catColors: Record<string, string> = {
    Technology: '#007aff', Business: '#34c759', Sports: '#ff9500',
    Entertainment: '#ff2d55', Politics: '#5856d6', Art: '#ff6b6b',
    Science: '#00c8a0', Health: '#ff2d55',
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }} className="page-enter">
      {/* Search + Refresh */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, marginBottom: 0 }}>
          <Icon name="search" size={16} color="var(--text3)" />
          <input placeholder="Search global & regional news…" value={search} onChange={e => handleSearchChange(e.target.value)} />
          {search && (
            <button onClick={() => handleSearchChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
              <Icon name="x" size={14} color="var(--text3)" />
            </button>
          )}
        </div>
        <button onClick={handleRefresh} disabled={refreshing} title="Fetch latest news" style={{
          width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--bg3)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.2s', opacity: refreshing ? 0.5 : 1,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
        {NEWS_CATS.map(c => (
          <button key={c} className={`cat-pill${cat === c && !searchDebounce ? ' active' : ''}`}
            onClick={() => { setCat(c); setSearch(''); setSearchDebounce('') }}
            style={cat === c && !searchDebounce ? { background: catColors[c] || 'var(--accent)', borderColor: catColors[c] || 'var(--accent)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Search result label */}
      {searchDebounce && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 12 }}>
          {loading ? 'Searching…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchDebounce}"`}
        </div>
      )}

      {/* Featured hero */}
      {loading ? (
        <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />
      ) : featured ? (
        <div className="card" style={{ marginBottom: 16, cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          onClick={() => featured.url ? window.open(featured.url, '_blank') : null}>
          {featured.image_url ? (
            <img src={featured.image_url} alt={featured.title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div style={{ width: '100%', height: 220, overflow: 'hidden', display: 'block' }}>
              <NewsIllustration category={featured.category} size="featured" />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.88))', padding: '32px 20px 20px' }}>
            <span style={{ display: 'inline-block', background: catColors[featured.category] || 'var(--accent)', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 600, marginBottom: 8 }}>
              {featured.category}
            </span>
            <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.4 }}>{featured.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.73rem', marginTop: 6 }}>{featured.source} · {timeAgo(featured.published_at)} ago</div>
          </div>
        </div>
      ) : null}

      {/* Article list */}
      {loading ? (
        <div className="card">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: 14, borderBottom: i < 4 ? '0.5px solid var(--border)' : 'none' }}>
              <div className="skeleton" style={{ width: 86, height: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 11, width: '30%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 13, marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 13, width: '80%', marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 10, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : rest.length > 0 ? (
        <div className="card">
          {rest.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: 14, cursor: 'pointer', borderBottom: i < rest.length - 1 ? '0.5px solid var(--border)' : 'none' }}
              onClick={() => a.url ? window.open(a.url, '_blank') : null}>
              <div style={{ width: 86, height: 72, borderRadius: 'var(--radius-sm)', flexShrink: 0, overflow: 'hidden', display: 'block' }}>
                {a.image_url ? (
                  <img src={a.image_url} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : <NewsIllustration category={a.category} size="card" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: catColors[a.category] || 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{a.category}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.45, margin: '4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.title}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text3)' }}>{a.source} · {timeAgo(a.published_at)} ago</div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && (
        <div className="empty-state">
          <div style={{ marginBottom: 10, display:'flex', justifyContent:'center' }}><Icon name='news' size={40} color='var(--text3)' /></div>
          <div className="empty-title">{searchDebounce ? 'No results found' : 'No articles yet'}</div>
          <div className="empty-sub">{searchDebounce ? `Try a different search term` : 'Tap the refresh button to fetch the latest news'}</div>
          {!searchDebounce && <button className="btn-primary" style={{ marginTop: 16 }} onClick={handleRefresh}>Fetch News</button>}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── MESSAGES PAGE ───────────────────────────────────────────────────────────

// ─── TELEGRAM-STYLE MESSAGES PAGE ────────────────────────────────────────────

function MessagesPage({ user, profile }: { user: any; profile: Profile | null }) {
  const [convos, setConvos] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openConvo, setOpenConvo] = useState<Conversation | null>(null)
  const [newDMModal, setNewDMModal] = useState(false)

  useEffect(() => { if (user) loadConvos() }, [user])

  async function loadConvos() {
    setLoading(true)
    const { data } = await supabase.from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
    const enriched = (data || []).map((c: any) => ({
      ...c,
      other_user: c.user1_id === user.id ? c.user2 : c.user1,
      unread: c.user1_id === user.id ? c.user1_unread : c.user2_unread,
    }))
    setConvos(enriched)
    setLoading(false)
  }

  async function openConvoWithUser(otherUser: Profile) {
    const [u1, u2] = user.id < otherUser.id ? [user.id, otherUser.id] : [otherUser.id, user.id]
    let { data: existing } = await supabase.from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .eq('user1_id', u1).eq('user2_id', u2).single()
    if (!existing) {
      const { data: created } = await supabase.from('conversations')
        .insert({ user1_id: u1, user2_id: u2 })
        .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
        .single()
      existing = created
    }
    if (existing) {
      const enriched = {
        ...existing,
        other_user: existing.user1_id === user.id ? existing.user2 : existing.user1,
        unread: existing.user1_id === user.id ? existing.user1_unread : existing.user2_unread,
      } as Conversation
      setNewDMModal(false)
      setOpenConvo(enriched)
      await loadConvos()
    }
  }

  const filtered = convos.filter(c => !search || c.other_user?.display_name?.toLowerCase().includes(search.toLowerCase()))

  if (!user) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 12 }}>
      <div style={{ display:'flex',justifyContent:'center' }}><Icon name='mail' size={48} color='var(--text3)'/></div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Sign in to view messages</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>Connect privately with anyone on ChitChat</div>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Telegram-style header */}
      <div style={{
        padding: '14px 16px 10px',
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px' }}>Messages</div>
        <button onClick={() => setNewDMModal(true)} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }} title="New Message">
          <Icon name="edit" size={16} color="#fff" />
        </button>
      </div>

      {/* Search bar */}
      <div style={{ padding: '8px 12px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)',
          borderRadius: 12, padding: '8px 12px',
        }}>
          <Icon name="search" size={15} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.88rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && Array(5).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '0.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: '45%', marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 11, width: '70%' }} />
            </div>
            <div className="skeleton" style={{ width: 30, height: 10 }} />
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}><Icon name='chat' size={48} color='var(--text3)' /></div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: '0.83rem' }}>Tap + to start a conversation</div>
          </div>
        )}

        {!loading && filtered.map((c, i) => {
          const other = c.other_user!
          const unread = (c as any).unread || 0
          return (
            <div key={c.id} onClick={() => setOpenConvo(c)} style={{
              display: 'flex', gap: 12, padding: '10px 16px', cursor: 'pointer',
              alignItems: 'center', borderBottom: '0.5px solid var(--border)',
              background: 'var(--surface)', transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar letter={other.avatar_letter} color={other.avatar_color} size={52} photoUrl={other.avatar_url} />
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#4CAF50', border: '2px solid var(--surface)',
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {other.display_name}
                    {(other as any).verified && <VerifiedBadge size="sm" />}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: unread > 0 ? 'var(--accent)' : 'var(--text3)', fontWeight: unread > 0 ? 600 : 400, flexShrink: 0 }}>
                    {timeAgo(c.last_message_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {c.last_message || 'Start a conversation'}
                  </div>
                  {unread > 0 && (
                    <div style={{
                      background: 'var(--accent)', color: '#fff', borderRadius: 99,
                      minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 700, padding: '0 6px', flexShrink: 0, marginLeft: 8,
                    }}>{unread}</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {openConvo && <TelegramChatScreen convo={openConvo} user={user} profile={profile} onClose={() => { setOpenConvo(null); loadConvos() }} />}
      {newDMModal && <NewDMModal user={user} profile={profile} onClose={() => setNewDMModal(false)} onOpenConvo={openConvoWithUser} />}
    </div>
  )
}

// ─── TELEGRAM-STYLE CHAT SCREEN ───────────────────────────────────────────────

function TelegramChatScreen({ convo, user, profile, onClose }: { convo: Conversation; user: any; profile: Profile | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<DirectMessage[]>([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadMessages()
    const channel = supabase.channel(`dm-${convo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${convo.id}` }, payload => {
        fetchSingleMsg(payload.new.id)
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [convo.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function loadMessages() {
    const { data } = await supabase.from('direct_messages').select('*, profiles(*)').eq('conversation_id', convo.id).order('created_at')
    setMsgs(data || [])
  }

  async function fetchSingleMsg(id: string) {
    const { data } = await supabase.from('direct_messages').select('*, profiles(*)').eq('id', id).single()
    if (data) setMsgs(prev => [...prev, data as DirectMessage])
  }

  async function send() {
    if (!text.trim()) return
    const content = text.trim()
    setText('')
    setReplyTo(null)
    await supabase.from('direct_messages').insert({ conversation_id: convo.id, sender_id: user.id, content })
    await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', convo.id)
  }

  const other = convo.other_user!

  // Group messages by date
  function msgDate(ts: string) {
    const d = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function msgTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Telegram header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
        padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <Icon name="back" size={22} color="var(--accent)" />
        </button>
        <Avatar letter={other.avatar_letter} color={other.avatar_color} size={40} photoUrl={other.avatar_url} online />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', lineHeight: 1.2 }}>{other.display_name}</div>
          <div style={{ fontSize: '0.7rem', color: '#4CAF50', fontWeight: 500 }}>online</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="more-h" size={20} color="var(--text3)" />
        </button>
      </div>

      {/* Messages area with subtle pattern background */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 10px',
        backgroundImage: 'radial-gradient(circle, rgba(124,74,30,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(0,0,0,0.12)', color: 'var(--text)',
              borderRadius: 99, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 500,
            }}>No messages yet • Say hello!</div>
          </div>
        )}

        {msgs.reduce((acc: React.ReactNode[], m, i) => {
          const isMine = m.sender_id === user.id
          const prevMsg = msgs[i - 1]
          const showDate = i === 0 || msgDate(m.created_at) !== msgDate(prevMsg.created_at)
          const prevIsSame = prevMsg && prevMsg.sender_id === m.sender_id && !showDate
          const nextMsg = msgs[i + 1]
          const isLast = !nextMsg || nextMsg.sender_id !== m.sender_id

          if (showDate) {
            acc.push(
              <div key={`date-${m.id}`} style={{ textAlign: 'center', margin: '14px 0 10px' }}>
                <span style={{
                  display: 'inline-block', background: 'rgba(0,0,0,0.18)', color: '#fff',
                  borderRadius: 99, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600,
                }}>{msgDate(m.created_at)}</span>
              </div>
            )
          }

          acc.push(
            <div key={m.id} style={{
              display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
              gap: 6, marginBottom: isLast ? 10 : 2, alignItems: 'flex-end',
            }}>
              {/* Avatar only for last consecutive message from other */}
              {!isMine && (
                <div style={{ width: 32, flexShrink: 0 }}>
                  {isLast && <Avatar letter={other.avatar_letter} color={other.avatar_color} size={28} photoUrl={other.avatar_url} />}
                </div>
              )}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: isMine
                    ? `16px 16px ${isLast ? '4px' : '16px'} 16px`
                    : `16px 16px 16px ${isLast ? '4px' : '16px'}`,
                  background: isMine ? 'var(--accent)' : 'var(--surface)',
                  color: isMine ? '#fff' : 'var(--text)',
                  fontSize: '0.88rem', lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  wordBreak: 'break-word',
                  marginTop: prevIsSame ? 0 : (isMine ? 0 : 0),
                }}>
                  {m.content}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
                    marginTop: 3,
                  }}>
                    <span style={{ fontSize: '0.6rem', opacity: 0.75, fontWeight: 500 }}>{msgTime(m.created_at)}</span>
                    {isMine && (
                      <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
                        <path d="M1 4.5L4 7.5L9 2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 4.5L8 7.5L13 2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
          return acc
        }, [])}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: 'var(--surface)', borderTop: '0.5px solid var(--border)',
        padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-end',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        <div style={{
          flex: 1, background: 'var(--bg3)', borderRadius: 22,
          padding: '8px 14px', display: 'flex', alignItems: 'flex-end', gap: 8,
          border: '0.5px solid var(--border)',
        }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <Icon name="smile" size={20} color="var(--text3)" />
          </button>
          <textarea ref={inputRef} rows={1} value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Message…"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none', resize: 'none',
              fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.9rem', color: 'var(--text)',
              maxHeight: 100, lineHeight: 1.45,
            }}
          />
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            <Icon name="image" size={20} color="var(--text3)" />
          </button>
        </div>
        <button onClick={send} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: text.trim() ? 'var(--accent)' : 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.18s', transform: 'rotate(-40deg)',
        }}>
          <Icon name="send" size={16} color={text.trim() ? '#fff' : 'var(--text3)'} />
        </button>
      </div>
    </div>
  )
}

// ─── NEW DM MODAL ─────────────────────────────────────────────────────────────

function NewDMModal({ user, profile, onClose, onOpenConvo }: { user: any; profile: Profile | null; onClose: () => void; onOpenConvo: (u: Profile) => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  async function searchUsers(q: string) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').ilike('display_name', `%${q}%`).neq('id', user.id).limit(10)
    setResults(data || [])
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>New Message</div>
        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Icon name="search" size={16} color="var(--text3)" />
          <input placeholder="Search people…" value={search} onChange={e => { setSearch(e.target.value); searchUsers(e.target.value) }} autoFocus />
        </div>
        {results.map(u => (
          <div key={u.id} style={{ display: 'flex', gap: 12, padding: '12px 0', cursor: 'pointer', alignItems: 'center', borderBottom: '0.5px solid var(--border)' }}
            onClick={() => onOpenConvo(u)}>
            <Avatar letter={u.avatar_letter} color={u.avatar_color} size={44} photoUrl={u.avatar_url} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{u.display_name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>@{u.username}</div>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>Message</div>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>Searching…</div>}
        {!loading && search && results.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>No users found</div>}
        {!search && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0', fontSize: '0.85rem' }}>
            <div style={{ marginBottom:8, display:'flex',justifyContent:'center' }}><Icon name='search' size={32} color='var(--text3)'/></div>
            Search for someone to start a conversation
          </div>
        )}
      </div>
    </div>
  )
}


// ─── ART PAGE ────────────────────────────────────────────────────────────────

const ART_FILTERS = ['All','Trending','Newest','Photography','3D','Generative']

function ArtPage({ user, profile, onAuthRequired }: { user: any; profile: Profile | null; onAuthRequired: () => void }) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [likedArt, setLikedArt] = useState<Set<string>>(new Set())
  const [listModal, setListModal] = useState(false)
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null)

  useEffect(() => { loadArt() }, [])
  useEffect(() => { if (user) loadArtLikes() }, [user])

  async function loadArt() {
    setLoading(true)
    let q = supabase.from('artworks').select('*, profiles(*)')
    if (filter === 'Newest') q = q.order('created_at', { ascending: false })
    else if (filter === 'Trending') q = q.order('likes_count', { ascending: false })
    else q = q.order('created_at', { ascending: false })
    const { data } = await q.limit(20)
    setArtworks((data as Artwork[]) || [])
    setLoading(false)
  }

  async function loadArtLikes() {
    const { data } = await supabase.from('artwork_likes').select('artwork_id').eq('user_id', user.id)
    setLikedArt(new Set(data?.map(l => l.artwork_id)))
  }

  async function toggleLike(art: Artwork) {
    if (!user) { onAuthRequired(); return }
    if (likedArt.has(art.id)) {
      setLikedArt(prev => { const s = new Set(prev); s.delete(art.id); return s })
      setArtworks(prev => prev.map(a => a.id === art.id ? { ...a, likes_count: a.likes_count - 1 } : a))
      await supabase.from('artwork_likes').delete().eq('artwork_id', art.id).eq('user_id', user.id)
    } else {
      setLikedArt(prev => new Set([...prev, art.id]))
      setArtworks(prev => prev.map(a => a.id === art.id ? { ...a, likes_count: a.likes_count + 1 } : a))
      await supabase.from('artwork_likes').insert({ artwork_id: art.id, user_id: user.id })
    }
  }

  const emojiMap: Record<string, string> = { nebula:'globe', crystal:'zap', wave:'radio', star:'zap', city:'briefcase', flower:'palette', palette:'palette', rocket:'rocket' }

  return (
    <div style={{ padding: 16 }} className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>Marketplace</div>
        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => user ? setListModal(true) : onAuthRequired()}>+ List Art</button>
      </div>

      {/* Artist spotlight */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#6c47ff,#ff5c8d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1.4rem' }}>E</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>ElectraVoid</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Featured Artist of the Week</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[['2.4K','Followers'],['47','Works'],['$18K','Sold']].map(([n,l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{n}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>Exploring the intersection of generative art and emotional landscapes.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary">Follow</button>
          <button className="btn-secondary">Portfolio</button>
          <button className="btn-secondary">Message</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, scrollbarWidth: 'none' }}>
        {ART_FILTERS.map(f => (
          <button key={f} className={`cat-pill${filter === f ? ' active' : ''}`} onClick={() => { setFilter(f); setTimeout(loadArt, 50) }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : artworks.length === 0 ? (
        <div className="empty-state"><div style={{ display:'flex',justifyContent:'center',marginBottom:12}}><Icon name='palette' size={48} color='var(--text3)'/></div><div className="empty-title">No artworks yet</div><div className="empty-sub">Be the first to list your art.</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {artworks.map(art => (
            <div key={art.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedArt(art)}>
              <div style={{ background: `linear-gradient(${art.gradient})`, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative' }}>
                <Icon name={emojiMap[art.emoji] || 'palette'} size={32} color='rgba(255,255,255,0.8)' />
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: 99, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                  ${art.price_usd}
                </div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{art.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 8 }}>by {art.profiles?.display_name || 'Unknown'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); toggleLike(art) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: likedArt.has(art.id) ? 'var(--accent2)' : 'var(--text3)' }}>
                    <Icon name={likedArt.has(art.id) ? 'heart-filled' : 'heart'} size={14} color={likedArt.has(art.id) ? 'var(--accent2)' : 'var(--text3)'} />
                    {art.likes_count}
                  </button>
                  <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.75rem' }} onClick={e => { e.stopPropagation(); alert('Purchase flow would go here. Integrate Stripe or similar.') }}>
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {listModal && <ListArtModal user={user} profile={profile} onClose={() => { setListModal(false); loadArt() }} />}
      {selectedArt && <ArtDetailModal art={selectedArt} liked={likedArt.has(selectedArt.id)} onLike={() => toggleLike(selectedArt)} onClose={() => setSelectedArt(null)} />}
    </div>
  )
}

// ─── LIST ART MODAL ───────────────────────────────────────────────────────────

function ListArtModal({ user, profile, onClose }: { user: any; profile: Profile | null; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [cat, setCat] = useState('Digital')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!title.trim() || !price) return
    setSubmitting(true)
    await supabase.from('artworks').insert({
      artist_id: user.id, title: title.trim(), description: desc.trim(),
      emoji: 'palette', gradient: '135deg,#1a0533,#2d1060',
      price_usd: parseFloat(price), category: cat,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>List Your Artwork</div>
        <input className="post-input" placeholder="Title…" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <textarea className="post-input" rows={2} placeholder="Description…" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 10 }} />
        <input className="post-input" type="number" placeholder="Price in USD…" value={price} onChange={e => setPrice(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Digital','Photography','3D','Generative','Traditional'].map(c => (
            <button key={c} className={`cat-pill${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: 12 }} onClick={submit} disabled={submitting || !title || !price}>
          {submitting ? 'Listing…' : 'List Artwork'}
        </button>
      </div>
    </div>
  )
}

// ─── ART DETAIL MODAL ─────────────────────────────────────────────────────────

function ArtDetailModal({ art, liked, onLike, onClose }: { art: Artwork; liked: boolean; onLike: () => void; onClose: () => void }) {
  const emojiMap: Record<string, string> = { nebula:'globe', crystal:'zap', wave:'radio', star:'zap', city:'briefcase', flower:'palette', palette:'palette', rocket:'rocket' }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ background: `linear-gradient(${art.gradient})`, borderRadius: 'var(--radius-lg)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: 16 }}>
          <Icon name={emojiMap[art.emoji] || 'palette'} size={32} color='rgba(255,255,255,0.8)' />
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>{art.title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: 8 }}>by {art.profiles?.display_name || 'Unknown'} · {art.category}</div>
        {art.description && <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text2)', marginBottom: 16 }}>{art.description}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>${art.price_usd}</div>
          <button onClick={onLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: liked ? 'var(--accent2)' : 'var(--text3)', fontSize: '0.9rem' }}>
            <Icon name={liked ? 'heart-filled' : 'heart'} size={18} color={liked ? 'var(--accent2)' : 'var(--text3)'} /> {art.likes_count}
          </button>
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem' }} onClick={() => alert('Purchase flow: integrate Stripe / payment gateway here.')}>
          Purchase Artwork
        </button>
      </div>
    </div>
  )
}

// ─── CHATROOMS PAGE ──────────────────────────────────────────────────────────

// ─── TELEGRAM-STYLE CHATROOMS PAGE ───────────────────────────────────────────

function ChatroomsPage({ user, profile, onAuthRequired }: { user: any; profile: Profile | null; onAuthRequired: () => void }) {
  const [chatTab, setChatTab] = useState<'chamber' | 'messages'>('chamber')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} className="page-enter">
      {/* Telegram-style tab switcher */}
      <div style={{
        display: 'flex', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {([
          { id: 'chamber', label: 'Chambers' },
          { id: 'messages', label: 'Messages' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setChatTab(t.id)} style={{
            flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
            background: 'transparent', fontFamily: "'Plus Jakarta Sans',sans-serif",
            fontWeight: 700, fontSize: '0.9rem',
            color: chatTab === t.id ? 'var(--accent)' : 'var(--text3)',
            borderBottom: chatTab === t.id ? '2.5px solid var(--accent)' : '2.5px solid transparent',
            transition: 'all 0.18s',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {chatTab === 'chamber'
          ? <ChamberTab user={user} profile={profile} onAuthRequired={onAuthRequired} />
          : <MessagesPage user={user} profile={profile} />
        }
      </div>
    </div>
  )
}

// ─── TELEGRAM-STYLE CHAMBER TAB ───────────────────────────────────────────────

function ChamberTab({ user, profile, onAuthRequired }: { user: any; profile: Profile | null; onAuthRequired: () => void }) {
  const [rooms, setRooms] = useState<Chatroom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openRoom, setOpenRoom] = useState<Chatroom | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set())

  useEffect(() => { loadRooms() }, [])
  useEffect(() => { if (user) loadJoined() }, [user])

  async function loadRooms() {
    setLoading(true)
    const { data } = await supabase.from('chatrooms').select('*').order('members_count', { ascending: false })
    setRooms(data || [])
    setLoading(false)
  }

  async function loadJoined() {
    const { data } = await supabase.from('chatroom_members').select('room_id').eq('user_id', user.id)
    setJoinedRooms(new Set(data?.map((r: any) => r.room_id)))
  }

  async function toggleJoin(e: React.MouseEvent, roomId: string) {
    e.stopPropagation()
    if (!user) { onAuthRequired(); return }
    if (joinedRooms.has(roomId)) {
      await supabase.from('chatroom_members').delete().eq('room_id', roomId).eq('user_id', user.id)
      setJoinedRooms(prev => { const s = new Set(prev); s.delete(roomId); return s })
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, members_count: Math.max(1, r.members_count - 1) } : r))
    } else {
      await supabase.from('chatroom_members').insert({ room_id: roomId, user_id: user.id })
      setJoinedRooms(prev => new Set([...prev, roomId]))
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, members_count: r.members_count + 1 } : r))
    }
  }

  const filtered = rooms.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
  const iconMap: Record<string, string> = { rocket:'rocket', palette:'palette', globe:'globe', briefcase:'briefcase', music:'music', trophy:'trophy', chat:'chat' }

  return (
    <>
      {/* Search + create row */}
      <div style={{ padding: '10px 12px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', borderRadius: 12, padding: '8px 12px' }}>
          <Icon name="search" size={15} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chambers…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.88rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        </div>
        <button onClick={() => user ? setCreateModal(true) : onAuthRequired()} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="plus" size={18} color="#fff" />
        </button>
      </div>

      {/* Room list — Telegram channel list style */}
      <div>
        {loading && Array(5).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '0.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: '50%', marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 10, width: '80%' }} />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
            <div style={{ marginBottom:12, display:'flex',justifyContent:'center' }}><Icon name='users' size={48} color='var(--text3)'/></div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 6 }}>No chambers yet</div>
            <div style={{ fontSize: '0.83rem', marginBottom: 16 }}>Be the first to create one</div>
            <button className="btn-primary" onClick={() => user ? setCreateModal(true) : onAuthRequired()}>Create Chamber</button>
          </div>
        )}

        {!loading && filtered.map(r => {
          const joined = joinedRooms.has(r.id)
          return (
            <div key={r.id} onClick={() => setOpenRoom(r)} style={{
              display: 'flex', gap: 12, padding: '10px 16px', cursor: 'pointer',
              alignItems: 'center', borderBottom: '0.5px solid var(--border)',
              background: joined ? 'rgba(124,74,30,0.04)' : 'var(--surface)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseLeave={e => (e.currentTarget.style.background = joined ? 'rgba(124,74,30,0.04)' : 'var(--surface)')}
            >
              {/* Room icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
                background: r.photo_url ? undefined : `linear-gradient(${r.color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
              }}>
                {r.photo_url ? <img src={r.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (iconMap[r.icon] ? <Icon name={iconMap[r.icon]} size={20} color='#fff'/> : <Icon name='chat' size={20} color='#fff'/>)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {r.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {r.is_live && <div className="live-badge" style={{ fontSize: '0.6rem', padding: '1px 6px' }}><div className="live-dot" />LIVE</div>}
                    {joined && <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, background: 'rgba(124,74,30,0.1)', padding: '2px 7px', borderRadius: 99 }}>Joined</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {r.description || 'Public chamber'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', flexShrink: 0, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="users" size={11} color="var(--text3)" />
                    {r.members_count}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {openRoom && (
        <TelegramRoomScreen
          room={rooms.find(r => r.id === openRoom.id) || openRoom}
          user={user} profile={profile}
          joined={joinedRooms.has(openRoom.id)}
          onJoin={e => toggleJoin(e as any, openRoom.id)}
          onClose={() => { setOpenRoom(null); loadRooms() }}
          onAuthRequired={onAuthRequired}
        />
      )}
      {createModal && <CreateRoomModal user={user} onClose={() => { setCreateModal(false); loadRooms() }} />}
    </>
  )
}

// ─── TELEGRAM-STYLE ROOM SCREEN ───────────────────────────────────────────────

function TelegramRoomScreen({ room, user, profile, joined, onJoin, onClose, onAuthRequired }: {
  room: Chatroom; user: any; profile: Profile | null
  joined: boolean; onJoin: (e: React.MouseEvent) => void
  onClose: () => void; onAuthRequired: () => void
}) {
  const [msgs, setMsgs] = useState<ChatroomMessage[]>([])
  const [text, setText] = useState('')
  const [membersCount, setMembersCount] = useState(room.members_count)
  const bottomRef = useRef<HTMLDivElement>(null)
  const iconMap: Record<string, string> = { rocket:'rocket', palette:'palette', globe:'globe', briefcase:'briefcase', music:'music', trophy:'trophy', chat:'chat' }

  useEffect(() => {
    loadMessages()
    const msgChannel = supabase.channel(`chatroom-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chatroom_messages', filter: `room_id=eq.${room.id}` }, payload => {
        fetchSingleMsg(payload.new.id)
      }).subscribe()
    const memberChannel = supabase.channel(`chatroom-members-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatroom_members', filter: `room_id=eq.${room.id}` }, async () => {
        const { count } = await supabase.from('chatroom_members').select('*', { count: 'exact', head: true }).eq('room_id', room.id)
        setMembersCount(count ?? membersCount)
      }).subscribe()
    return () => { supabase.removeChannel(msgChannel); supabase.removeChannel(memberChannel) }
  }, [room.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function loadMessages() {
    const { data } = await supabase.from('chatroom_messages').select('*, profiles(*)').eq('room_id', room.id).order('created_at').limit(100)
    setMsgs(data || [])
  }

  async function fetchSingleMsg(id: string) {
    const { data } = await supabase.from('chatroom_messages').select('*, profiles(*)').eq('id', id).single()
    if (data) setMsgs(prev => [...prev, data as ChatroomMessage])
  }

  async function send() {
    if (!user) { onAuthRequired(); return }
    if (!text.trim()) return
    if (!joined) { alert('Join the chamber first to chat!'); return }
    const content = text.trim()
    setText('')
    const { error } = await supabase.from('chatroom_messages').insert({ room_id: room.id, author_id: user.id, content })
    if (error) console.error(error)
  }

  function msgTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
        padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="back" size={22} color="var(--accent)" />
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0, overflow: 'hidden',
          background: room.photo_url ? undefined : `linear-gradient(${room.color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
        }}>
          {room.photo_url ? <img src={room.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (iconMap[room.icon] ? <Icon name={iconMap[room.icon]} size={20} color='#fff'/> : <Icon name='chat' size={20} color='#fff'/>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.97rem', lineHeight: 1.2 }}>{room.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{membersCount} members</div>
        </div>
        {!joined && (
          <button onClick={e => onJoin(e as any)} style={{
            padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>Join</button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 10px',
        backgroundImage: 'radial-gradient(circle, rgba(124,74,30,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(0,0,0,0.12)', color: 'var(--text)',
              borderRadius: 99, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 500,
            }}>Be the first to say something!</div>
          </div>
        )}

        {msgs.map((m, i) => {
          const isMine = m.author_id === user?.id
          const prevMsg = msgs[i - 1]
          const prevIsSame = prevMsg && prevMsg.author_id === m.author_id
          const nextMsg = msgs[i + 1]
          const isLast = !nextMsg || nextMsg.author_id !== m.author_id
          const senderProfile = (m as any).profiles

          return (
            <div key={m.id} style={{
              display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
              gap: 6, marginBottom: isLast ? 10 : 2, alignItems: 'flex-end',
            }}>
              {!isMine && (
                <div style={{ width: 30, flexShrink: 0 }}>
                  {isLast && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                      background: `linear-gradient(${senderProfile?.avatar_color || '135deg,#7c4a1e,#c47c3a'})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {senderProfile?.avatar_url
                        ? <img src={senderProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : (senderProfile?.avatar_letter || '?')
                      }
                    </div>
                  )}
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                {!isMine && !prevIsSame && (
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 3, paddingLeft: 2 }}>
                    {senderProfile?.display_name || 'Unknown'}
                  </div>
                )}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: isMine
                    ? `16px 16px ${isLast ? '4px' : '16px'} 16px`
                    : `16px 16px 16px ${isLast ? '4px' : '16px'}`,
                  background: isMine ? 'var(--accent)' : 'var(--surface)',
                  color: isMine ? '#fff' : 'var(--text)',
                  fontSize: '0.88rem', lineHeight: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  wordBreak: 'break-word',
                }}>
                  {m.content}
                  <div style={{ fontSize: '0.6rem', opacity: 0.7, textAlign: 'right', marginTop: 3 }}>{msgTime(m.created_at)}</div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        background: 'var(--surface)', borderTop: '0.5px solid var(--border)',
        padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-end',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        {joined ? (
          <>
            <div style={{
              flex: 1, background: 'var(--bg3)', borderRadius: 22,
              padding: '8px 14px', display: 'flex', alignItems: 'flex-end', gap: 8,
              border: '0.5px solid var(--border)',
            }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <Icon name="smile" size={20} color="var(--text3)" />
              </button>
              <textarea rows={1} value={text}
                onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Message…"
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none', resize: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.9rem', color: 'var(--text)',
                  maxHeight: 100, lineHeight: 1.45,
                }}
              />
            </div>
            <button onClick={send} style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: text.trim() ? 'var(--accent)' : 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.18s', transform: 'rotate(-40deg)',
            }}>
              <Icon name="send" size={16} color={text.trim() ? '#fff' : 'var(--text3)'} />
            </button>
          </>
        ) : (
          <button onClick={e => { if (!user) { onAuthRequired(); return } onJoin(e as any) }} style={{
            flex: 1, padding: '12px 0', borderRadius: 22, background: 'var(--accent)',
            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.92rem',
          }}>
            Join Chamber to Chat
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CREATE ROOM MODAL ────────────────────────────────────────────────────────

function CreateRoomModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [topic, setTopic] = useState('Technology')
  const [submitting, setSubmitting] = useState(false)
  const topics = ['Technology','Art','Music','Sports','Politics','Business','Entertainment','General']
  const iconMap: Record<string, string> = { Technology:'rocket', Art:'palette', Music:'music', Sports:'trophy', Politics:'globe', Business:'briefcase', Entertainment:'film', General:'chat' }
  const colorMap: Record<string, string> = { Technology:'135deg,#6c47ff,#00c8a0', Art:'135deg,#ff5c8d,#ff8c42', Music:'135deg,#6c47ff,#ff5c8d', Sports:'135deg,#ff5c8d,#6c47ff', Politics:'135deg,#00c8a0,#6c47ff', Business:'135deg,#ff8c42,#ff5c8d', Entertainment:'135deg,#ff8c42,#6c47ff', General:'135deg,#6c47ff,#5856d6' }

  async function create() {
    if (!name.trim()) return
    setSubmitting(true)
    const { data: roomData, error } = await supabase.from('chatrooms').insert({
      name: name.trim(), description: desc.trim(), topic,
      icon: iconMap[topic] || 'chat', color: colorMap[topic] || '135deg,#6c47ff,#5856d6',
      created_by: user.id, members_count: 1,
    }).select().single()
    if (!error && roomData) {
      await supabase.from('chatroom_members').insert({ room_id: roomData.id, user_id: user.id })
    }
    setSubmitting(false)
    if (!error) onClose()
    else if (error.code === '23505') alert('A room with that name already exists.')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Create a Chamber</div>
        <input className="post-input" placeholder="Chamber name…" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <textarea className="post-input" rows={2} placeholder="Description…" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ marginBottom: 6, fontSize: '0.8rem', color: 'var(--text3)' }}>Topic</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {topics.map(t => <button key={t} className={`cat-pill${topic === t ? ' active' : ''}`} onClick={() => setTopic(t)}>{t}</button>)}
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: 12 }} onClick={create} disabled={submitting || !name}>
          {submitting ? 'Creating…' : 'Create Chamber'}
        </button>
      </div>
    </div>
  )
}


// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

// ─── PROFILE POPUP ───────────────────────────────────────────────────────────

function ProfilePopup({ user, profile, onClose, onSignOut, globalFont, dataSaver, onChangeFont, onToggleDataSaver }: {
  user: any; profile: Profile | null; onClose: () => void; onSignOut: () => void
  globalFont?: string; dataSaver?: boolean
  onChangeFont?: (f: string) => void; onToggleDataSaver?: () => void
}) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [name, setName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    let avatarUrl = profile.avatar_url
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { cacheControl: '3600', upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl + `?t=${Date.now()}`
      }
    }
    await supabase.from('profiles').update({
      display_name: name.trim(),
      bio: bio.trim(),
      avatar_letter: name.trim().charAt(0).toUpperCase(),
      avatar_url: avatarUrl,
    }).eq('id', profile.id)
    setSaving(false)
    onClose()
    window.location.reload()
  }

  if (!profile) return null

  return (
    <div ref={popupRef} style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 600,
      width: editMode ? 320 : 280, background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
      animation: 'fadeUp 0.18s ease both',
      transition: 'width 0.22s ease',
    }}>
      {/* Banner + avatar */}
      <div style={{ height: 72, background: 'linear-gradient(135deg,#6c47ff,#ff5c8d,#ff8c42)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', bottom: -22, left: 16 }}>
          {editMode ? (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarInputRef.current?.click()}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bg)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <div style={{ width: '100%', height: '100%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.3rem' }}>{profile.avatar_letter}</div>
                }
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="image" size={14} color="#fff" />
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
            </div>
          ) : (
            <>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg)', display: 'block' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.3rem', border: '3px solid var(--bg)' }}>
                  {profile.avatar_letter}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile info or Edit form */}
      {editMode ? (
        <div style={{ padding: '28px 16px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>Display Name</div>
          <input
            value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: '0.88rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 10 }}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>Bio</div>
          <textarea
            rows={3}
            value={bio} onChange={e => setBio(e.target.value)}
            style={{ width: '100%', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", resize: 'none', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditMode(false); setName(profile.display_name); setBio(profile.bio); setAvatarFile(null); setAvatarPreview(profile.avatar_url || null) }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >Cancel</button>
            <button
              onClick={save}
              disabled={saving}
              style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif", opacity: saving ? 0.7 : 1 }}
            >{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '28px 16px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            {profile.display_name}
            {profile.verified && <VerifiedBadge />}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 1, marginBottom: 6 }}>
            @{profile.username}
          </div>
          {profile.bio && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5, margin: '6px 0 10px' }}>{profile.bio}</p>}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, paddingBottom: 12, borderBottom: '0.5px solid var(--border)' }}>
            {[['Posts', profile.posts_count], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, n]) => (
              <div key={l as string} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{n}</div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!editMode && (
        <div style={{ borderTop: '0.5px solid var(--border)' }}>
          {/* View Profile */}
          <button onClick={() => onClose()} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="user" size={16} color="var(--text3)" /> View Profile
          </button>
          {/* Edit Profile */}
          <button onClick={() => setEditMode(true)} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="edit" size={16} color="var(--text3)" /> Edit Profile
          </button>
          {/* Notifications */}
          <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-notifications')) }} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="bell" size={16} color="var(--text3)" /> Notifications
          </button>
          {/* Dark Mode Toggle */}
          <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-dark'))} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="moon" size={16} color="var(--text3)" /> Dark Mode
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: 'var(--bg3)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--text3)', transition: 'all 0.2s' }} />
            </div>
          </button>
          {/* Accent Color */}
          <div style={{ padding: '11px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="palette" size={15} color="var(--text3)" /> Accent Color
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {([
                { c: '#1971c2', name: 'Blue' }, { c: '#7950f2', name: 'Violet' }, { c: '#e03131', name: 'Ruby' },
                { c: '#2f9e44', name: 'Forest' }, { c: '#f08c00', name: 'Amber' }, { c: '#0c8599', name: 'Teal' },
                { c: '#e64980', name: 'Rose' }, { c: '#212529', name: 'Onyx' },
              ] as {c:string;name:string}[]).map(({ c, name }) => (
                <button key={c} onClick={() => window.dispatchEvent(new CustomEvent('change-accent', { detail: c }))} title={name} style={{
                  width: 22, height: 22, borderRadius: '50%', background: c,
                  border: '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s',
                  transform: 'scale(1)',
                }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
              ))}
            </div>
          </div>
          {/* Font Settings */}
          <div style={{ padding: '11px 16px', borderBottom: '0.5px solid var(--border)', position: 'relative' }}>
            <button onClick={() => setFontMenuOpen(v => !v)} style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)',
              fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="edit" size={16} color="var(--text3)" /> Font Settings
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text3)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{globalFont || 'Plus Jakarta Sans'} ▾</span>
            </button>
            {fontMenuOpen && (
              <div style={{
                position: 'absolute', left: 8, right: 8, top: 'calc(100% + 2px)', zIndex: 999,
                background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)', maxHeight: 220, overflowY: 'auto',
              }}>
                {['Plus Jakarta Sans','Helvetica Neue','Roboto','Lato','Open Sans','Montserrat','Inter','Poppins','Nunito','Raleway','Ubuntu','Source Sans Pro','Merriweather','Playfair Display','Dancing Script'].map(f => (
                  <button key={f} onClick={() => { onChangeFont?.(f); setFontMenuOpen(false) }} style={{
                    width: '100%', padding: '9px 14px', background: globalFont === f ? 'var(--bg3)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: '0.83rem', fontFamily: `'${f}', sans-serif`,
                    color: globalFont === f ? 'var(--accent)' : 'var(--text)',
                    fontWeight: globalFont === f ? 700 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {f}
                    {globalFont === f && <Icon name="check" size={13} color="var(--accent)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Data Saver Mode */}
          <button onClick={onToggleDataSaver} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', borderBottom: '0.5px solid var(--border)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="wifi" size={16} color="var(--text3)" /> Data Saver Mode
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: dataSaver ? 'var(--accent)' : 'var(--bg3)',
              position: 'relative', flexShrink: 0, transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: dataSaver ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </button>
          {/* Sign Out */}
          <button onClick={onSignOut} style={{
            width: '100%', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent2)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,45,85,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="log-out" size={16} color="var(--accent2)" /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, profile, onSignOut, globalFont, dataSaver, onChangeFont, onToggleDataSaver }: {
  user: any; profile: Profile | null; onSignOut: () => void
  globalFont?: string; dataSaver?: boolean
  onChangeFont?: (f: string) => void; onToggleDataSaver?: () => void
}) {
  const [tab, setTab] = useState<'posts' | 'media' | 'artworks' | 'saved'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (user) loadTab() }, [tab, user])
  useEffect(() => { setAvatarUrl(profile?.avatar_url || null) }, [profile?.avatar_url])

  async function handleQuickAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { cacheControl: '3600', upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + `?t=${Date.now()}`
      await supabase.from('profiles').update({ avatar_url: url, avatar_letter: profile.display_name.charAt(0).toUpperCase() }).eq('id', profile.id)
      setAvatarUrl(url)
    }
    setAvatarUploading(false)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  async function loadTab() {
    setLoading(true)
    if (tab === 'posts') {
      const { data } = await supabase.from('posts').select('*, profiles(*)').eq('author_id', user.id).order('created_at', { ascending: false })
      setPosts((data as Post[]) || [])
    } else if (tab === 'artworks') {
      const { data } = await supabase.from('artworks').select('*, profiles(*)').eq('artist_id', user.id).order('created_at', { ascending: false })
      setArtworks((data as Artwork[]) || [])
    } else if (tab === 'saved') {
      const { data: saved } = await supabase.from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'post')
      if (saved && saved.length > 0) {
        const { data } = await supabase.from('posts').select('*, profiles(*)').in('id', saved.map(s => s.item_id))
        setSavedPosts((data as Post[]) || [])
      } else setSavedPosts([])
    }
    setLoading(false)
  }

  if (!user || !profile) return (
    <div className="empty-state" style={{ padding: '80px 20px' }}>
      <div style={{ marginBottom:12, display:'flex',justifyContent:'center' }}><Icon name='users' size={48} color='var(--text3)'/></div>
      <div className="empty-title">You're not signed in</div>
      <div className="empty-sub">Sign in to view your profile, posts, and saved content.</div>
    </div>
  )

  return (
    <div className="page-enter">
      {/* Banner */}
      <div style={{ height: 120, background: 'linear-gradient(135deg,#6c47ff,#ff5c8d,#ff8c42)', position: 'relative' }}>
        {/* Avatar with inline upload widget */}
        <div style={{ position: 'absolute', bottom: -36, left: 20 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            {/* Avatar image/letter */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--bg)', cursor: 'pointer', position: 'relative', display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
            >
              {avatarUploading ? (
                <div style={{ width: '100%', height: '100%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="loader" size={24} color="var(--accent)" />
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.8rem' }}>
                  {profile.avatar_letter}
                </div>
              )}
              {/* Hover overlay */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                opacity: avatarUploading ? 0 : undefined,
                borderRadius: '50%',
                // Always slightly visible so user knows it's clickable
                backdropFilter: 'none',
              }}>
                <Icon name="image" size={18} color="#fff" />
                <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700, marginTop: 2 }}>CHANGE</span>
              </div>
            </div>
            {/* Camera badge */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            >
              <Icon name="image" size={12} color="#fff" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleQuickAvatarUpload}
            />
          </div>
          {/* Upload hint */}
          {!avatarUploading && (
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              Tap to update
            </div>
          )}
          {avatarUploading && (
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)', textAlign: 'center' }}>
              Uploading…
            </div>
          )}
        </div>
        <button className="btn-secondary" style={{ position: 'absolute', bottom: -20, right: 16, padding: '6px 16px', fontSize: '0.82rem' }} onClick={() => setEditModal(true)}>
          Edit Profile
        </button>
      </div>

      <div style={{ padding: '52px 20px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {profile.display_name}
          {profile.verified && <VerifiedBadge size="lg" />}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 8 }}>
          @{profile.username}
        </div>
        {profile.bio && <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text2)', marginBottom: 12 }}>{profile.bio}</p>}

        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[['Posts', profile.posts_count], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, n]) => (
            <div key={l as string}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{n}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{l}</div>
            </div>
          ))}
        </div>

        <button onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}>
          <Icon name="log-out" size={16} color="var(--accent2)" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', margin: '0' }}>
        {(['posts','media','artworks','saved'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            color: tab === t ? 'var(--accent)' : 'var(--text3)', fontWeight: 600, fontSize: '0.82rem',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading…</div>
          : tab === 'posts' ? (
            posts.length === 0 ? <div className="empty-state"><div style={{ marginBottom:10, display:'flex',justifyContent:'center' }}><Icon name='edit' size={40} color='var(--text3)'/></div><div className="empty-title">No posts yet</div><div className="empty-sub">Start sharing your thoughts with the community.</div></div>
              : posts.map(p => <PostCard key={p.id} post={p} liked={false} reposted={false} onLike={() => {}} onRepost={() => {}} user={user} profile={profile} onAuthRequired={() => {}} />)
          ) : tab === 'media' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
              {Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', background: `linear-gradient(${['135deg,#6c47ff,#ff5c8d','135deg,#00c8a0,#6c47ff','135deg,#ff8c42,#ff5c8d'][i % 3]})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  
                </div>
              ))}
            </div>
          ) : tab === 'artworks' ? (
            artworks.length === 0 ? <div className="empty-state"><div style={{ marginBottom:10, display:'flex',justifyContent:'center' }}><Icon name='palette' size={40} color='var(--text3)'/></div><div className="empty-title">No artworks listed</div><div className="empty-sub">List your art on the marketplace.</div></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {artworks.map(a => (
                  <div key={a.id} className="card">
                    <div style={{ background: `linear-gradient(${a.gradient})`, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="palette" size={32} color="rgba(255,255,255,0.8)" /></div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>${a.price_usd}</div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            savedPosts.length === 0 ? <div className="empty-state"><div style={{ marginBottom:10, display:'flex',justifyContent:'center' }}><Icon name='bookmark' size={40} color='var(--text3)'/></div><div className="empty-title">Nothing saved yet</div><div className="empty-sub">Save posts, artworks, and articles to view them here.</div></div>
              : savedPosts.map(p => <PostCard key={p.id} post={p} liked={false} reposted={false} onLike={() => {}} onRepost={() => {}} user={user} profile={profile} onAuthRequired={() => {}} />)
          )}
      </div>

      {editModal && <EditProfileModal profile={profile} onClose={() => setEditModal(false)} />}
    </div>
  )
}

// ─── EDIT PROFILE MODAL ───────────────────────────────────────────────────────

function EditProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [name, setName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url || null)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    let avatarUrl = profile.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { cacheControl: '3600', upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        // Add cache-busting so new image shows immediately
        avatarUrl = data.publicUrl + `?t=${Date.now()}`
      }
    }

    await supabase.from('profiles').update({
      display_name: name.trim(),
      bio: bio.trim(),
      avatar_letter: name.trim().charAt(0).toUpperCase(),
      avatar_url: avatarUrl,
    }).eq('id', profile.id)

    setSaving(false)
    onClose()
    window.location.reload()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20 }}>Edit Profile</div>

        {/* Avatar upload */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' }} onClick={() => avatarInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '2rem' }}>
                  {profile.avatar_letter}
                </div>
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} style={{
              position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
              borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon name="edit" size={12} color="#fff" />
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarSelect} />
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 16 }}>Tap photo to change avatar</div>

        <label style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 600 }}>Display Name</label>
        <input className="post-input" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 12, marginTop: 4, height: 44 }} />
        <label style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 600 }}>Bio</label>
        <textarea className="post-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ marginBottom: 16, marginTop: 4 }} />
        <button className="btn-primary" style={{ width: '100%', padding: 12 }} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── CREATE POST MODAL ────────────────────────────────────────────────────────

const MAX_PHOTOS = 5

function CreatePostModal({ user, profile, onClose }: { user: any; profile: Profile | null; onClose: () => void }) {
  const [text, setText] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = MAX_PHOTOS - imageFiles.length
    const toAdd = files.slice(0, remaining)
    setImageFiles(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
    // Reset input so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(idx: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function publish() {
    if (!text.trim() || !user) return
    setSubmitting(true)

    const uploadedUrls: string[] = []

    if (imageFiles.length > 0) {
      setUploading(true)
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('post-images').upload(path, file, { cacheControl: '3600', upsert: false })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
          uploadedUrls.push(urlData.publicUrl)
        }
      }
      setUploading(false)
    }

    const mediaUrl = uploadedUrls[0] || null
    const mediaUrls = uploadedUrls.length > 0 ? uploadedUrls : null
    await supabase.from('posts').insert({ author_id: user.id, content: text.trim(), media_url: mediaUrl, media_urls: mediaUrls })
    setSubmitting(false)
    onClose()
  }

  // Grid layout for previews
  const previewGrid: React.CSSProperties = imagePreviews.length === 1
    ? { display: 'block' }
    : imagePreviews.length === 2
    ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }
    : imagePreviews.length === 3
    ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Avatar letter={profile?.avatar_letter || 'U'} color={profile?.avatar_color || '135deg,#007aff,#5856d6'} size={40} photoUrl={profile?.avatar_url} />
          <div style={{ flex: 1 }}>
            <textarea className="post-input" rows={4} placeholder={`What's on your mind, ${profile?.display_name?.split(' ')[0] || 'friend'}?`}
              value={text} onChange={e => setText(e.target.value)} autoFocus
            />

            {/* Multi-image previews */}
            {imagePreviews.length > 0 && (
              <div style={{ ...previewGrid, marginTop: 10, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {imagePreviews.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', aspectRatio: imagePreviews.length === 1 ? '16/9' : '1/1', overflow: 'hidden', borderRadius: imagePreviews.length === 1 ? 'var(--radius)' : 6 }}>
                    <img src={src} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button onClick={() => removeImage(idx)} style={{
                      position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="x" size={12} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }} onChange={handleFileSelect} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  title={imageFiles.length >= MAX_PHOTOS ? `Max ${MAX_PHOTOS} photos` : 'Add photos'}
                  onClick={() => imageFiles.length < MAX_PHOTOS && fileInputRef.current?.click()}
                  disabled={imageFiles.length >= MAX_PHOTOS}
                  style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: imageFiles.length > 0 ? 'rgba(0,122,255,0.15)' : 'var(--bg)', border: 'none', cursor: imageFiles.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: imageFiles.length >= MAX_PHOTOS ? 0.4 : 1 }}>
                  <Icon name="image" size={16} color="var(--accent)" />
                </button>
                {imageFiles.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600 }}>{imageFiles.length}/{MAX_PHOTOS}</span>
                )}
                <button title="Emoji" style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Icon name="smile" size={16} color="var(--accent)" />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {uploading && <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Uploading…</span>}
                <span style={{ fontSize: '0.78rem', color: text.length > 250 ? 'var(--accent2)' : 'var(--text3)' }}>{280 - text.length}</span>
                <button className="btn-primary" onClick={publish} disabled={submitting || !text.trim()} style={{ padding: '8px 20px' }}>
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── MEDIA PAGE ─────────────────────────────────────────────────────────────

// ── Radio helpers ──────────────────────────────────────────────────────────

// ── Radio Garden API helpers ────────────────────────────────────────────────
// All calls go through our own server-side proxy at /api/radio to bypass CORS

async function rgApiFetch(params: Record<string, string>): Promise<RadioStation[]> {
  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`/api/radio?${qs}`)
    if (!res.ok) throw new Error('Radio API error')
    const data = await res.json()
    return data.stations || []
  } catch {
    return []
  }
}

async function rgSearchFetch(query: string): Promise<RadioStation[]> {
  return rgApiFetch({ action: 'search', q: query })
}

async function rgTrendingFetch(): Promise<RadioStation[]> {
  return rgApiFetch({ action: 'trending' })
}

async function rgPlaceFetch(placeId: string): Promise<RadioStation[]> {
  return rgApiFetch({ action: 'place', placeId })
}

async function rgPlacesList(): Promise<{ id: string; title: string; country: string; size: number }[]> {
  try {
    const res = await fetch('/api/radio?action=places')
    const data = await res.json()
    return data.places || []
  } catch { return [] }
}

const RADIO_REGIONS = [
  { label: 'Trending', placeId: '' },
  { label: 'Nairobi', placeId: 'nairobi' },
  { label: 'Lagos', placeId: 'lagos' },
  { label: 'Johannesburg', placeId: 'johannesburg' },
  { label: 'Accra', placeId: 'accra' },
  { label: 'London', placeId: 'london' },
  { label: 'New York', placeId: 'new-york' },
  { label: 'Paris', placeId: 'paris' },
  { label: 'Tokyo', placeId: 'tokyo' },
  { label: 'Mumbai', placeId: 'mumbai' },
  { label: 'São Paulo', placeId: 'sao-paulo' },
  { label: 'Sydney', placeId: 'sydney' },
]

function StationCard({ s, current, onPlay }: { s: RadioStation; current: RadioStation | null; onPlay: (s: RadioStation) => void }) {
  const isActive = current?.stationuuid === s.stationuuid
  return (
    <div onClick={() => onPlay(s)} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
      background: isActive ? 'rgba(0,122,255,0.08)' : 'var(--surface)',
      borderRadius: 'var(--radius)', marginBottom: 8,
      border: isActive ? '0.5px solid rgba(0,122,255,0.3)' : '0.5px solid var(--border)',
      transition: 'all 0.18s',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg,var(--accent5),var(--accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        {s.favicon
          ? <img src={s.favicon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <Icon name="radio" size={20} color="#fff" />}
        {isActive && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,122,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 3, background: '#fff', borderRadius: 2, height: `${50+i*20}%`,
                  animation: `eq-bar 0.8s ease-in-out ${i*0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: '0.88rem', fontWeight: 700,
          color: isActive ? 'var(--accent)' : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{s.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
          {[s.country, s.language || s.tags?.split(',')?.[0]].filter(Boolean).join(' · ') || 'Radio Garden'}
        </div>
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isActive ? 'var(--accent)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
      }}>
        <Icon name={isActive ? 'pause' : 'play'} size={15} color={isActive ? '#fff' : 'var(--accent)'} />
      </div>
    </div>
  )
}

function RadioTab({ onPlay, currentRadio }: { onPlay: (s: RadioStation) => void; currentRadio: RadioStation | null }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('') // '' = trending/global
  const [stations, setStations] = useState<RadioStation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const RADIO_COUNTRIES = [
    { code: '', flag: 'ALL', name: 'Trending' },
    { code: 'KE', flag: 'KE', name: 'Kenya' },
    { code: 'NG', flag: 'NG', name: 'Nigeria' },
    { code: 'ZA', flag: 'ZA', name: 'S. Africa' },
    { code: 'GH', flag: 'GH', name: 'Ghana' },
    { code: 'ET', flag: 'ET', name: 'Ethiopia' },
    { code: 'TZ', flag: 'TZ', name: 'Tanzania' },
    { code: 'UG', flag: 'UG', name: 'Uganda' },
    { code: 'US', flag: 'US', name: 'USA' },
    { code: 'GB', flag: 'GB', name: 'UK' },
    { code: 'FR', flag: 'FR', name: 'France' },
    { code: 'DE', flag: 'DE', name: 'Germany' },
    { code: 'IN', flag: 'IN', name: 'India' },
    { code: 'BR', flag: 'BR', name: 'Brazil' },
    { code: 'JP', flag: 'JP', name: 'Japan' },
    { code: 'AU', flag: 'AU', name: 'Australia' },
    { code: 'EG', flag: 'EG', name: 'Egypt' },
    { code: 'MA', flag: 'MA', name: 'Morocco' },
    { code: 'SN', flag: 'SN', name: 'Senegal' },
    { code: 'MX', flag: 'MX', name: 'Mexico' },
    { code: 'AR', flag: 'AR', name: 'Argentina' },
    { code: 'RU', flag: 'RU', name: 'Russia' },
    { code: 'CN', flag: 'CN', name: 'China' },
    { code: 'ZW', flag: 'ZW', name: 'Zimbabwe' },
    { code: 'CM', flag: 'CM', name: 'Cameroon' },
  ]

  useEffect(() => { loadByCountry('') }, [])

  async function loadByCountry(cc: string) {
    setCountry(cc); setQuery(''); setError(''); setLoading(true)
    let result: RadioStation[]
    if (cc === '') {
      result = await rgApiFetch({ action: 'trending', limit: '40' })
    } else {
      result = await rgApiFetch({ action: 'bycountry', country: cc, limit: '40' })
    }
    if (result.length === 0) setError('No stations found for this country.')
    setStations(result)
    setLoading(false)
  }

  async function search() {
    const q = query.trim(); if (!q) return
    setCountry('__search__'); setError(''); setLoading(true)
    const result = await rgSearchFetch(q)
    if (result.length === 0) setError('No stations found. Try a different search.')
    setStations(result)
    setLoading(false)
  }

  const selectedCountry = RADIO_COUNTRIES.find(c => c.code === country)

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', alignItems: 'center', margin: '0 16px 14px' }}>
        <Icon name="search" size={16} color="var(--text3)" />
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search stations by name…"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 0', fontSize: '0.88rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        {query && <button onClick={() => { setQuery(''); loadByCountry(country === '__search__' ? '' : country) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} color="var(--text3)" /></button>}
        <button onClick={search} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Go</button>
      </div>

      {/* Country flag pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none', alignItems: 'center' }}>
        {RADIO_COUNTRIES.map(c => (
          <button key={c.code} onClick={() => loadByCountry(c.code)}
            className={`cat-pill${country === c.code && country !== '__search__' ? ' active' : ''}`}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: '1rem' }}>{c.flag}</span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}><Icon name="loader" size={24} color="var(--accent)" /><div style={{ marginTop: 10, fontSize: '0.85rem' }}>Loading stations…</div></div>}
        {error && !loading && <div style={{ background: 'rgba(255,45,85,0.08)', color: 'var(--accent2)', borderRadius: 12, padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
        {!loading && !error && stations.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}><Icon name="wifi" size={32} color="var(--text3)" /><div style={{ marginTop: 12, fontSize: '0.88rem' }}>No stations found</div></div>}
        {!loading && stations.length > 0 && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stations.length} stations{selectedCountry && country !== '' && country !== '__search__' ? ` · ${selectedCountry.flag} ${selectedCountry.name}` : country === '__search__' ? ' · Search results' : ' · Global Trending'}
            </div>
            {stations.map(s => <StationCard key={s.stationuuid} s={s} current={currentRadio} onPlay={onPlay} />)}
          </>
        )}
      </div>
    </div>
  )
}

// ── TV helpers ─────────────────────────────────────────────────────────────

const TV_COUNTRIES = [
  { code: 'KE', name: 'Kenya' }, { code: 'NG', name: 'Nigeria' }, { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' }, { code: 'ET', name: 'Ethiopia' }, { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' }, { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' }, { code: 'JP', name: 'Japan' }, { code: 'AU', name: 'Australia' },
]

const TV_CATEGORIES = [
  { label: 'All', value: '' }, { label: 'News', value: 'news' }, { label: 'Sports', value: 'sports' },
  { label: 'Entertainment', value: 'entertainment' }, { label: 'Music', value: 'music' },
  { label: 'Kids', value: 'kids' }, { label: 'Documentary', value: 'documentary' },
  { label: 'Business', value: 'business' }, { label: 'Religious', value: 'religious' },
]

// Fetch via our server-side proxy route — avoids CORS on M3U playlists
async function fetchTVChannels(countryCode: string, category: string): Promise<TVChannel[]> {
  try {
    const params = new URLSearchParams({ country: countryCode })
    if (category) params.set('category', category)
    const res = await fetch(`/api/tv?${params}`)
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return data.channels || []
  } catch {
    return []
  }
}

function TVChannelCard({ ch, current, onPlay }: { ch: TVChannel; current: TVChannel | null; onPlay: (ch: TVChannel) => void }) {
  const isActive = current?.tvgId === ch.tvgId
  return (
    <div onClick={() => onPlay(ch)} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
      background: isActive ? 'rgba(255,45,85,0.08)' : 'var(--surface)',
      borderRadius: 'var(--radius)', marginBottom: 8,
      border: isActive ? '0.5px solid rgba(255,45,85,0.3)' : '0.5px solid var(--border)',
      transition: 'all 0.18s',
    }}>
      {/* Logo */}
      <div style={{
        width: 56, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        {ch.logo
          ? <img src={ch.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <Icon name="tv" size={18} color="rgba(255,255,255,0.4)" />}
        {isActive && (
          <div style={{
            position: 'absolute', top: 3, left: 4,
            background: 'var(--accent2)', color: '#fff',
            fontSize: '0.45rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.5px',
          }}>LIVE</div>
        )}
      </div>
      {/* Info */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: '0.88rem', fontWeight: 700,
          color: isActive ? 'var(--accent2)' : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{ch.name}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>
          {[ch.country, ch.group].filter(Boolean).join(' · ')}
        </div>
        {ch.languages.length > 0 && (
          <div style={{ fontSize: '0.66rem', color: 'var(--text3)', marginTop: 1 }}>
            {ch.languages.slice(0,2).join(', ')}
          </div>
        )}
      </div>
      {/* Watch button */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isActive ? 'var(--accent2)' : 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s',
      }}>
        <Icon name={isActive ? 'monitor' : 'play'} size={14} color={isActive ? '#fff' : 'var(--accent2)'} />
      </div>
    </div>
  )
}

function TVTab({ onPlay, currentTV }: { onPlay: (ch: TVChannel) => void; currentTV: TVChannel | null }) {
  const [country, setCountry] = useState('KE')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [channels, setChannels] = useState<TVChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load(c: string, cat: string) {
    setError(''); setLoading(true)
    try {
      const result = await fetchTVChannels(c, cat)
      setChannels(result)
      if (result.length === 0) setError('No channels found. Try a different filter.')
    } catch { setError('Could not load channels.') }
    setLoading(false)
  }

  useEffect(() => { load(country, category) }, [country, category])

  const displayed = search
    ? channels.filter(ch => ch.name.toLowerCase().includes(search.toLowerCase()) || ch.group.toLowerCase().includes(search.toLowerCase()))
    : channels

  return (
    <div>
      {/* Country picker */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 10px', scrollbarWidth: 'none' }}>
        {TV_COUNTRIES.map(c => (
          <button key={c.code} onClick={() => { setCountry(c.code); setSearch('') }}
            className={`cat-pill${country === c.code ? ' active' : ''}`}
            style={{ flexShrink: 0 }}>{c.name}</button>
        ))}
      </div>
      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {TV_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={`cat-pill${category === cat.value ? ' active' : ''}`}
            style={{ flexShrink: 0, fontSize: '0.72rem' }}>{cat.label}</button>
        ))}
      </div>
      {/* Search within results */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', alignItems: 'center', margin: '0 16px 12px' }}>
        <Icon name="search" size={16} color="var(--text3)" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter channels…"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px 0', fontSize: '0.85rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} color="var(--text3)" /></button>}
      </div>
      {/* Results */}
      <div style={{ padding: '0 16px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}><Icon name="loader" size={24} color="var(--accent2)" /><div style={{ marginTop: 10, fontSize: '0.85rem' }}>Loading channels…</div></div>}
        {error && !loading && <div style={{ background: 'rgba(255,45,85,0.08)', color: 'var(--accent2)', borderRadius: 12, padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12 }}>{error}</div>}
        {!loading && displayed.length > 0 && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {displayed.length} channels
            </div>
            {displayed.map((ch, i) => <TVChannelCard key={`${ch.tvgId}-${i}`} ch={ch} current={currentTV} onPlay={onPlay} />)}
          </>
        )}
        {!loading && !error && displayed.length === 0 && channels.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: '0.85rem' }}>No channels match your search</div>
        )}
      </div>
    </div>
  )
}

// ── Media Page shell ───────────────────────────────────────────────────────

function MediaPage({ onPlayRadio, onPlayTV, currentRadio, currentTV }: {
  onPlayRadio: (s: RadioStation) => void
  onPlayTV: (ch: TVChannel) => void
  currentRadio: RadioStation | null
  currentTV: TVChannel | null
}) {
  const [tab, setTab] = useState<MediaTab>('radio')

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 0',
        background: tab === 'radio'
          ? 'linear-gradient(180deg,rgba(88,86,214,0.12) 0%,transparent 100%)'
          : 'linear-gradient(180deg,rgba(255,45,85,0.10) 0%,transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: tab === 'radio'
              ? 'linear-gradient(135deg,var(--accent5),var(--accent))'
              : 'linear-gradient(135deg,#ff2d55,#ff6b35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s',
          }}>
            <Icon name={tab === 'radio' ? 'radio' : 'tv'} size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.3px' }}>Media</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
              {tab === 'radio' ? '30,000+ radio stations' : '8,000+ live TV channels'}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'var(--bg3)', borderRadius: 12, padding: 4,
          marginBottom: 16, gap: 4,
        }}>
          {(['radio', 'tv'] as MediaTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === t ? (t === 'radio' ? 'var(--accent5)' : 'var(--accent2)') : 'transparent',
              color: tab === t ? '#fff' : 'var(--text3)',
              fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans',sans-serif",
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name={t === 'radio' ? 'radio' : 'tv'} size={15} color={tab === t ? '#fff' : 'var(--text3)'} />
              {t === 'radio' ? 'Radio' : 'TV'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'radio'
        ? <RadioTab onPlay={onPlayRadio} currentRadio={currentRadio} />
        : <TVTab onPlay={onPlayTV} currentTV={currentTV} />
      }
    </div>
  )
}

// ─── DISCOVER PAGE (TikTok-style) ────────────────────────────────────────────

function DiscoverPage({ user, profile, onAuthRequired }: { user: any; profile: Profile | null; onAuthRequired: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ posts: Post[]; profiles: Profile[] } | null>(null)
  const [searching, setSearching] = useState(false)
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [topAccounts, setTopAccounts] = useState<Profile[]>([])
  const [trendingTopics, setTrendingTopics] = useState<{ tag: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set())
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set())
  const searchTimer = useRef<any>(null)

  useEffect(() => {
    loadDiscover()
    if (user) { loadLikes(); loadSaved(); loadReposts(); loadFollowing() }
  }, [user])
  
  async function loadFollowing() {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    setFollowingSet(new Set(data?.map((f: any) => f.following_id) || []))
  }

  async function toggleFollow(targetId: string) {
    if (!user) { onAuthRequired(); return }
    if (followingSet.has(targetId)) {
      setFollowingSet(prev => { const s = new Set(prev); s.delete(targetId); return s })
      setTopAccounts(prev => prev.map(a => a.id === targetId ? { ...a, followers_count: Math.max(0, (a.followers_count || 0) - 1) } : a))
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
      await supabase.rpc('decrement_followers_count', { target_id: targetId })
    } else {
      setFollowingSet(prev => new Set([...prev, targetId]))
      setTopAccounts(prev => prev.map(a => a.id === targetId ? { ...a, followers_count: (a.followers_count || 0) + 1 } : a))
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      await supabase.rpc('increment_followers_count', { target_id: targetId })
      // Send notification
      await supabase.from('notifications').insert({ user_id: targetId, actor_id: user.id, type: 'follow' })
    }
  }

  async function loadLikes() {
    const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
    setLikedPosts(new Set(data?.map((l: any) => l.post_id)))
  }

  async function loadSaved() {
    const { data } = await supabase.from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'post')
    setSavedPosts(new Set(data?.map((s: any) => s.item_id)))
  }

  async function loadReposts() {
    const { data } = await supabase.from('reposts').select('post_id').eq('user_id', user.id)
    setRepostedPosts(new Set(data?.map((r: any) => r.post_id)))
  }

  async function loadDiscover() {
    setLoading(true)
    // Top posts by likes
    const { data: posts } = await supabase.from('posts').select('*, profiles(*)')
      .order('likes_count', { ascending: false })
      .limit(20)
    setTrendingPosts((posts as Post[]) || [])

    // Top accounts by followers/posts
    const { data: accounts } = await supabase.from('profiles')
      .select('*')
      .order('followers_count', { ascending: false })
      .limit(8)
    setTopAccounts((accounts as Profile[]) || [])

    // Trending topics — words mentioned by multiple different users (from last 10 fetched posts)
    const { data: wordData } = await supabase.from('posts')
      .select('author_id, content')
      .order('created_at', { ascending: false })
      .limit(10)
    if (wordData) {
      // Count word occurrences per unique user
      const wordUsers: Record<string, Set<string>> = {}
      const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','was','are','were','be','been','have','has','had','do','did','will','would','could','should','may','might','this','that','these','those','i','you','he','she','it','we','they','my','your','his','her','our','their','what','when','where','who','how','why','not','no','so','as','if','all','also','just','more','very','can','its','up','about','out','than','then','them','some','there'])
      wordData.forEach((p: any) => {
        if (!p.content) return
        const words = p.content.toLowerCase().replace(/[^a-z0-9\s#]/g, ' ').split(/\s+/).filter((w: string) => w.length > 3 && !stopWords.has(w))
        const uniqueWords = new Set<string>(words)
        uniqueWords.forEach((word) => {
          if (!wordUsers[word]) wordUsers[word] = new Set()
          wordUsers[word].add(p.author_id)
        })
      })
      const sorted = Object.entries(wordUsers)
        .filter(([, users]) => users.size >= 1)
        .map(([tag, users]) => ({ tag: tag.replace(/^#/, ''), count: users.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
      setTrendingTopics(sorted)
    }
    setLoading(false)
  }

  async function doSearch(q: string) {
    if (!q.trim()) { setSearchResults(null); return }
    setSearching(true)
    const [{ data: posts }, { data: profiles }] = await Promise.all([
      supabase.from('posts').select('*, profiles(*)').ilike('content', `%${q}%`).order('likes_count', { ascending: false }).limit(15),
      supabase.from('profiles').select('*').or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(6),
    ])
    setSearchResults({ posts: (posts as Post[]) || [], profiles: (profiles as Profile[]) || [] })
    setSearching(false)
  }

  function handleSearchChange(val: string) {
    setSearchQuery(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(val), 350)
  }

  async function toggleLike(post: Post) {
    if (!user) { onAuthRequired(); return }
    const liked = likedPosts.has(post.id)
    if (liked) {
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s })
      setTrendingPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count - 1 } : p))
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setLikedPosts(prev => new Set([...prev, post.id]))
      setTrendingPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p))
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
    }
  }

  async function toggleSave(postId: string) {
    if (!user) { onAuthRequired(); return }
    if (savedPosts.has(postId)) {
      setSavedPosts(prev => { const s = new Set(prev); s.delete(postId); return s })
      await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_type', 'post').eq('item_id', postId)
    } else {
      setSavedPosts(prev => new Set([...prev, postId]))
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'post', item_id: postId })
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 32 }}>
      {/* Search bar */}
      <div style={{ padding: '16px 16px 12px', position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '10px 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Icon name="search" size={18} color="var(--text3)" />
          <input
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search posts, people, topics…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <Icon name="x" size={15} color="var(--text3)" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {searchQuery && (
        <div style={{ padding: '0 16px' }}>
          {searching && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)' }}>
              <Icon name="loader" size={22} color="var(--accent)" />
              <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Searching…</div>
            </div>
          )}
          {!searching && searchResults && (
            <>
              {/* People results */}
              {searchResults.profiles.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>People</div>
                  <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)', overflow: 'hidden' }}>
                    {searchResults.profiles.map((p, i) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < searchResults.profiles.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                        <Avatar letter={p.avatar_letter || 'U'} color={p.avatar_color || '135deg,var(--accent),var(--accent5)'} size={44} photoUrl={p.avatar_url} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p.display_name} {p.verified && <VerifiedBadge size="sm" />}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>@{p.username} · {p.followers_count} followers</div>
                        </div>
                        <button style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Follow</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Post results */}
              {searchResults.posts.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Posts</div>
                  {searchResults.posts.map(post => (
                    <PostCard key={post.id} post={post} liked={likedPosts.has(post.id)} reposted={repostedPosts.has(post.id)} onLike={() => toggleLike(post)} onRepost={() => toggleRepost(post)} user={user} profile={profile} onAuthRequired={onAuthRequired} />
                  ))}
                </div>
              )}
              {searchResults.posts.length === 0 && searchResults.profiles.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                  <Icon name="search" size={36} color="var(--text3)" />
                  <div style={{ marginTop: 12, fontWeight: 700, color: 'var(--text)' }}>No results for "{searchQuery}"</div>
                  <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Try a different search term</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* DISCOVER CONTENT — shown when no search query */}
      {!searchQuery && (
        <div style={{ padding: '0 16px' }}>
          {/* ── Trending Topics ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trending" size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Trending Topics</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 32, width: 80 + i * 10, borderRadius: 99 }} />)}
              </div>
            ) : trendingTopics.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {trendingTopics.map(({ tag, count }) => (
                  <button key={tag} onClick={() => handleSearchChange(tag)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99,
                    background: 'var(--surface)', border: '0.5px solid var(--border)', cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,74,30,0.07)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>#{tag}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 99, padding: '1px 6px', fontWeight: 600 }}>{count}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text3)', fontSize: '0.83rem' }}>No trending topics yet.</div>
            )}
          </div>

          {/* ── Top Accounts ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#db2777)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="users" size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Top Accounts</span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
              {loading ? Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, textAlign: 'center', width: 76 }}>
                  <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 8px' }} />
                  <div className="skeleton" style={{ height: 10, width: 60, margin: '0 auto 4px' }} />
                  <div className="skeleton" style={{ height: 8, width: 45, margin: '0 auto' }} />
                </div>
              )) : topAccounts.map(acc => (
                <div key={acc.id} style={{ flexShrink: 0, textAlign: 'center', width: 80 }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
                    <Avatar letter={acc.avatar_letter || 'U'} color={acc.avatar_color || '135deg,var(--accent),var(--accent5)'} size={60} photoUrl={acc.avatar_url} />
                    {acc.verified && (
                      <div style={{ position: 'absolute', bottom: 0, right: 0 }}><VerifiedBadge size="sm" /></div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.display_name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>{acc.followers_count} followers</div>
                  <button onClick={() => toggleFollow(acc.id)} style={{ marginTop: 6, padding: '4px 10px', borderRadius: 99, background: followingSet.has(acc.id) ? 'transparent' : 'var(--accent)', color: followingSet.has(acc.id) ? 'var(--text)' : '#fff', border: followingSet.has(acc.id) ? '1px solid var(--border)' : 'none', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.18s' }}>{followingSet.has(acc.id) ? 'Following' : 'Follow'}</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top Posts ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#f472b6,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fire" size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Top Posts</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600, background: 'var(--bg3)', borderRadius: 99, padding: '2px 8px' }}>by likes & interaction</span>
            </div>
            {loading ? Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 5 }} />
                    <div className="skeleton" style={{ height: 11, width: '25%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 12, marginBottom: 5 }} />
                <div className="skeleton" style={{ height: 12, width: '70%' }} />
              </div>
            )) : trendingPosts.map(post => (
              <PostCard key={post.id} post={post} liked={likedPosts.has(post.id)} reposted={repostedPosts.has(post.id)}
                onLike={() => toggleLike(post)} onRepost={() => toggleRepost(post)}
                user={user} profile={profile} onAuthRequired={onAuthRequired} />
            ))}
            {!loading && trendingPosts.length === 0 && (
              <div className="empty-state">
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><Icon name="fire" size={40} color="var(--text3)" /></div>
                <div className="empty-title">No posts yet</div>
                <div className="empty-sub">Be the first to post something!</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

function AuthModal({ mode, onClose, onSwitch }: { mode: 'login' | 'signup'; onClose: () => void; onSwitch: (m: 'login' | 'signup') => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError(''); setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username: username.toLowerCase(), display_name: displayName } }
      })
      if (error) setError(error.message)
      else { onClose(); alert('Check your email to confirm your account.') }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onClose()
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 4 }}>
          {mode === 'login' ? 'Welcome back' : 'Join ChitChat'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text3)', marginBottom: 20 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </div>

        {mode === 'signup' && (
          <>
            <input className="post-input" placeholder="Display name…" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
            <input className="post-input" placeholder="Username (no spaces)…" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} style={{ marginBottom: 10, height: 44 }} />
          </>
        )}
        <input className="post-input" type="email" placeholder="Email…" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <input className="post-input" type="password" placeholder="Password…" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 16, height: 44 }}
          onKeyDown={e => e.key === 'Enter' && submit()} />

        {error && <div style={{ background: 'rgba(255,45,85,0.1)', color: 'var(--accent2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '0.83rem', marginBottom: 12 }}>{error}</div>}

        <button className="btn-primary" style={{ width: '100%', padding: 14, fontSize: '1rem', marginBottom: 12 }} onClick={submit} disabled={loading}>
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.83rem', color: 'var(--text3)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => onSwitch(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: '0.83rem' }}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── NOTIF MODAL ─────────────────────────────────────────────────────────────

interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'save' | 'reply' | 'mention' | 'repost'
  post_id?: string | null
  comment_id?: string | null
  is_read: boolean
  created_at: string
  actor?: {
    display_name: string
    avatar_letter: string
    avatar_color: string
    avatar_url: string | null
    username: string
  }
  post?: { content: string } | null
}

function NotifModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    loadNotifs()

    // Real-time: listen for new notifications for this user
    const channel = supabase.channel(`notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        // Fetch enriched notification with actor info
        supabase.from('notifications')
          .select('*, actor:profiles!notifications_actor_id_fkey(display_name,avatar_letter,avatar_color,avatar_url,username), post:posts(content)')
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setNotifs(prev => [data as Notification, ...prev])
              setUnread(u => u + 1)
            }
          })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function loadNotifs() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(display_name,avatar_letter,avatar_color,avatar_url,username), post:posts(content)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)
    setNotifs((data as Notification[]) || [])
    const u = (data || []).filter((n: any) => !n.is_read).length
    setUnread(u)
    setLoading(false)
  }

  async function markAllRead() {
    if (!user || notifs.every(n => n.is_read)) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  function notifIcon(type: Notification['type']): { icon: string; color: string } {
    switch (type) {
      case 'like':    return { icon: 'heart-filled',     color: '#e03131' }
      case 'comment': return { icon: 'message-circle',   color: 'var(--accent)' }
      case 'reply':   return { icon: 'message-circle',   color: 'var(--accent5)' }
      case 'follow':  return { icon: 'user',             color: '#7950f2' }
      case 'save':    return { icon: 'bookmark-filled',  color: 'var(--accent4)' }
      case 'mention': return { icon: 'zap',              color: 'var(--accent)' }
      case 'repost':  return { icon: 'zap',              color: '#46d160' }
      default:        return { icon: 'bell',             color: 'var(--text3)' }
    }
  }

  function notifText(n: Notification): string {
    const name = n.actor?.display_name || 'Someone'
    const snippet = n.post?.content ? ' "' + n.post.content.slice(0, 40) + (n.post.content.length > 40 ? '…' : '') + '"' : ''
    switch (n.type) {
      case 'like':    return `${name} liked your post${snippet}`
      case 'comment': return `${name} commented on your post${snippet}`
      case 'reply':   return `${name} replied to your comment`
      case 'follow':  return `${name} started following you`
      case 'save':    return `${name} saved your post${snippet}`
      case 'mention': return `${name} mentioned you in a comment`
      case 'repost':  return `${name} reposted your post${snippet}`
      default:        return `${name} interacted with your content`
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="sheet-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Notifications</div>
            {unread > 0 && (
              <div style={{ background: 'var(--accent2)', color: '#fff', borderRadius: 99, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, padding: '0 6px' }}>
                {unread}
              </div>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600 }}>
              Mark all read
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 5 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                </div>
              </div>
            ))
          ) : notifs.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 32 }}>
              <div style={{ marginBottom: 10, display:'flex', justifyContent:'center' }}><Icon name='bell' size={40} color='var(--text3)' /></div>
              <div className="empty-title">No notifications yet</div>
              <div className="empty-sub">When someone likes, comments, or follows you, it'll show here.</div>
            </div>
          ) : notifs.map((n, i) => {
            const { icon, color } = notifIcon(n.type)
            const hasPost = !!n.post_id
            function handleNotifClick() {
              if (hasPost) {
                onClose()
                // Dispatch event to navigate home and scroll to/highlight post
                window.dispatchEvent(new CustomEvent('navigate-to-post', { detail: { postId: n.post_id } }))
              }
            }
            return (
              <div key={n.id}
                onClick={handleNotifClick}
                style={{
                  display: 'flex',
                  gap: 12,
                  borderBottom: i < notifs.length - 1 ? '0.5px solid var(--border)' : 'none',
                  alignItems: 'flex-start',
                  background: n.is_read ? 'transparent' : 'rgba(58,171,58,0.04)',
                  borderRadius: 8,
                  margin: '0 -4px',
                  padding: '11px 4px',
                  cursor: hasPost ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (hasPost) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg3)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.is_read ? 'transparent' : 'rgba(58,171,58,0.04)' }}
              >
                {n.actor?.avatar_url ? (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={n.actor.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--bg)' }}>
                      <Icon name={icon} size={10} color={color} />
                    </div>
                  </div>
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    <Icon name={icon} size={18} color={color} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--text)' }}>{notifText(n)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                  {hasPost && <div style={{ fontSize: '0.68rem', color: 'var(--accent)', marginTop: 3, fontWeight: 600 }}>Tap to view post →</div>}
                </div>
                {!n.is_read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
