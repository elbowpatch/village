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
    'bookmark-filled': <svg style={{...s, fill: 'var(--accent4)', stroke: 'var(--accent4)'}} viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
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

type Page = 'home' | 'chatrooms' | 'messages' | 'news' | 'art' | 'media' | 'profile'

export default function VillageApp() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null)
  const [createPostModal, setCreatePostModal] = useState(false)
  const [notifModal, setNotifModal] = useState(false)
  const [profilePopup, setProfilePopup] = useState(false)
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
    const stored = localStorage.getItem('village-dark')
    if (stored === 'true') { setDark(true); document.documentElement.classList.add('dark') }
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

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('village-dark', String(next))
  }

  function navigate(p: Page) {
    if ((p === 'messages' || p === 'profile') && !user) { setAuthModal('login'); return }
    setPage(p)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* TOP BAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: dark ? 'rgba(0,0,0,0.92)' : 'rgba(242,242,247,0.92)',
        backdropFilter: 'blur(30px) saturate(1.8)',
        borderBottom: `0.5px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,67,0.2)'}`,
        padding: '0 20px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.3px' }}>
          Village<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setNotifModal(true)}>
            <Icon name="bell" size={17} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--accent2)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
          </button>
          <button className="icon-btn" onClick={toggleDark}>
            <Icon name={dark ? 'sun' : 'moon'} size={17} />
          </button>
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
              {profilePopup && <ProfilePopup user={user} profile={profile} onClose={() => setProfilePopup(false)} onSignOut={async () => { await supabase.auth.signOut(); setProfilePopup(false) }} />}
            </div>
          ) : (
            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }} onClick={() => setAuthModal('login')}>Sign In</button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: (radioStation || tvChannel) ? 'calc(83px + 64px + 20px)' : 'calc(83px + 20px)' }}>
        {page === 'home' && <HomeFeed user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} onPlayRadio={playStation} onPlayTV={playTVChannel} currentRadio={radioStation} currentTV={tvChannel} />}
        {page === 'news' && <NewsPage />}
        {page === 'messages' && <MessagesPage user={user} profile={profile} />}
        {page === 'chatrooms' && <ChatroomsPage user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} />}
        {page === 'art' && <ArtPage user={user} profile={profile} onAuthRequired={() => setAuthModal('login')} />}
        {page === 'media' && <MediaPage onPlayRadio={playStation} onPlayTV={playTVChannel} currentRadio={radioStation} currentTV={tvChannel} />}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: dark ? 'rgba(28,28,30,0.95)' : 'rgba(248,248,248,0.95)',
        borderTop: `0.5px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(60,60,67,0.22)'}`,
        display: 'flex', padding: '8px 0 env(safe-area-inset-bottom, 8px)',
        backdropFilter: 'blur(30px) saturate(2)',
      }}>
        {([
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'chatrooms', icon: 'chat', label: 'Rooms' },
          { id: 'create', icon: 'plus', label: 'Create' },
          { id: 'news', icon: 'news', label: 'News' },
          { id: 'media', icon: 'tv', label: 'Media' },
        ] as const).map(item => (
          <button key={item.id}
            onClick={() => item.id === 'create' ? (user ? setCreatePostModal(true) : setAuthModal('login')) : navigate(item.id as Page)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, padding: '4px 0', border: 'none', background: 'transparent', cursor: 'pointer',
              color: (item.id !== 'create' && page === item.id) ? 'var(--accent)' : item.id === 'create' ? 'var(--accent)' : 'var(--text3)',
              fontSize: '0.6rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, flex: 1,
              transition: 'all 0.2s',
            }}>
            {item.id === 'create' ? (
              <div style={{
                background: 'var(--accent)', borderRadius: 8, padding: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28,
              }}>
                <Icon name="plus" size={16} color="#fff" />
              </div>
            ) : (
              <Icon name={item.icon} size={22} color={(page === item.id) ? 'var(--accent)' : 'var(--text3)'} />
            )}
            {item.label}
          </button>
        ))}
      </nav>

      {/* MEDIA MINI PLAYER */}
      {(radioStation || tvChannel) && (
        <div style={{
          position: 'fixed', bottom: 'calc(var(--nav-h))', left: 0, right: 0, zIndex: 190,
          background: dark ? 'rgba(12,12,14,0.98)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          borderTop: '0.5px solid var(--border)',
          padding: '0 16px',
          height: 64,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 -6px 24px rgba(0,0,0,0.14)',
        }}>
          {radioStation && (
            <>
              {/* Radio favicon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                background: 'linear-gradient(135deg,var(--accent5),var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                {radioStation.favicon
                  ? <img src={radioStation.favicon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <Icon name="radio" size={18} color="#fff" />}
                {radioPlaying && (
                  <div style={{
                    position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent3)', boxShadow: '0 0 6px var(--accent3)',
                    animation: 'pulse-dot 1.4s ease-in-out infinite',
                  }} />
                )}
              </div>
              {/* Radio info */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 1, letterSpacing: '0.3px' }}>RADIO</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{radioStation.name}</div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[radioStation.country, radioStation.bitrate ? `${radioStation.bitrate}kbps` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              {/* Radio controls */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                <button className="icon-btn" onClick={() => setRadioMuted(m => !m)}>
                  <Icon name={radioMuted ? 'volume-x' : 'volume-2'} size={15} />
                </button>
                <button className="icon-btn" onClick={toggleRadioPlay}
                  style={{ background: 'var(--accent)', width: 36, height: 36 }}>
                  <Icon name={radioPlaying ? 'pause' : 'play'} size={15} color="#fff" />
                </button>
                <button className="icon-btn" onClick={stopRadio}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            </>
          )}

          {tvChannel && (
            <>
              {/* TV thumbnail + live video */}
              <div style={{
                width: 60, height: 40, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                background: '#000', position: 'relative',
              }}>
                <video
                  ref={tvVideoRef}
                  autoPlay playsInline muted={tvMuted}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', top: 3, left: 4,
                  background: 'var(--accent2)', color: '#fff',
                  fontSize: '0.5rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3, letterSpacing: '0.5px',
                }}>LIVE</div>
              </div>
              {/* TV info */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent2)', fontWeight: 700, marginBottom: 1, letterSpacing: '0.3px' }}>TV</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tvChannel.name}</div>
                <div style={{ fontSize: '0.69rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[tvChannel.country, tvChannel.group].filter(Boolean).join(' · ')}
                </div>
              </div>
              {/* TV controls */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                <button className="icon-btn" onClick={() => setTVMuted(m => !m)}>
                  <Icon name={tvMuted ? 'volume-x' : 'volume-2'} size={15} />
                </button>
                <button className="icon-btn" onClick={() => setTVFullscreen(f => !f)}
                  style={{ background: 'var(--accent2)', width: 36, height: 36 }}>
                  <Icon name="maximize" size={15} color="#fff" />
                </button>
                <button className="icon-btn" onClick={stopTV}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            </>
          )}
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
      {notifModal && <NotifModal onClose={() => setNotifModal(false)} />}
    </div>
  )
}

// ─── HOME FEED ───────────────────────────────────────────────────────────────

type FeedTab = 'top' | 'following'

function HomeFeed({ user, profile, onAuthRequired, onPlayRadio, onPlayTV, currentRadio, currentTV }: {
  user: any; profile: Profile | null; onAuthRequired: () => void
  onPlayRadio: (s: RadioStation) => void; onPlayTV: (ch: TVChannel) => void
  currentRadio: RadioStation | null; currentTV: TVChannel | null
}) {
  const [feedTab, setFeedTab] = useState<FeedTab>('top')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [followingIds, setFollowingIds] = useState<string[]>([])
  

  useEffect(() => { loadPosts() }, [feedTab, followingIds])
  useEffect(() => {
    if (user) { loadLikes(); loadSaved(); loadFollowing() }
  }, [user])

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
      if (feedTab === 'top' || (feedTab === 'following' && followingIds.includes(post.author_id))) {
        setPosts(prev => [post, ...prev])
      }
    }
  }

  async function loadFollowing() {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    setFollowingIds(data?.map(f => f.following_id) || [])
  }

  async function loadPosts() {
    setLoading(true)
    if (feedTab === 'following') {
      if (!user) { setLoading(false); return }
      if (followingIds.length === 0) { setPosts([]); setLoading(false); return }
      const { data } = await supabase.from('posts').select('*, profiles(*)')
        .in('author_id', followingIds)
        .order('created_at', { ascending: false }).limit(30)
      setPosts((data as Post[]) || [])
    } else {
      // Top posts = ordered by likes in last 7 days, fallback to recent
      const { data } = await supabase.from('posts').select('*, profiles(*)')
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30)
      setPosts((data as Post[]) || [])
    }
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

  async function toggleLike(post: Post) {
    if (!user) { onAuthRequired(); return }
    const liked = likedPosts.has(post.id)
    if (liked) {
      setLikedPosts(prev => { const s = new Set(prev); s.delete(post.id); return s })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count - 1 } : p))
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setLikedPosts(prev => new Set([...prev, post.id]))
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p))
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
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 0 0 0' }}>
      {/* ── Feed column ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
      {/* ── Feed Tab Switch ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg)', borderBottom: '0.5px solid var(--border)',
        display: 'flex', padding: '0 16px',
      }}>
        {(['top','following'] as FeedTab[]).map(tab => (
          <button key={tab} onClick={() => { if (tab === 'following' && !user) { onAuthRequired(); return } setFeedTab(tab) }} style={{
            flex: 1, padding: '14px 0', border: 'none', background: 'transparent', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '0.9rem',
            color: feedTab === tab ? 'var(--text)' : 'var(--text3)',
            borderBottom: feedTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {tab === 'top' ? ' Top Posts' : ' Following'}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Trending strip */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0 12px', scrollbarWidth: 'none' }}>
          {trends.map(t => (
            <button key={t} className={`cat-pill${activeFilter === t ? ' active' : ''}`} onClick={() => setActiveFilter(t === activeFilter ? 'All' : t)}>
              {t}
            </button>
          ))}
        </div>

        {/* Following empty state */}
        {feedTab === 'following' && !loading && posts.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
            <div className="empty-title">No posts from people you follow</div>
            <div className="empty-sub">Follow people to see their posts here, or switch to Top Posts.</div>
          </div>
        )}

        {/* Top empty state */}
        {feedTab === 'top' && !loading && posts.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}></div>
            <div className="empty-title">No posts yet</div>
            <div className="empty-sub">Be the first to share something with the community.</div>
          </div>
        )}

        {/* Skeleton */}
        {loading && Array(3).fill(0).map((_, i) => (
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

        {/* Posts */}
        {!loading && posts.map(post => (
          <PostCard key={post.id} post={post}
            liked={likedPosts.has(post.id)}
            saved={savedPosts.has(post.id)}
            onLike={() => toggleLike(post)}
            onSave={() => toggleSave(post.id)}
            user={user}
            profile={profile}
            onAuthRequired={onAuthRequired}
          />
        ))}
      </div>
      </div>{/* end feed column */}

      {/* ── Sidebar (desktop only) ── */}
      <aside className="home-sidebar">
        <HomeRadioCard onPlay={onPlayRadio} current={currentRadio} />
        <HomeTVCard onPlay={onPlayTV} current={currentTV} />
        <HomeNewsCard />
      </aside>
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
    Technology: { icon: '💻', bg: 'linear-gradient(135deg,#1a0e3a,#302b63)' },
    Politics:   { icon: '🏛️', bg: 'linear-gradient(135deg,#3a1f00,#6b3a00)' },
    Business:   { icon: '📈', bg: 'linear-gradient(135deg,#0f2027,#203a43)' },
    Sports:     { icon: '⚽', bg: 'linear-gradient(135deg,#001f4d,#003580)' },
    Entertainment: { icon: '🎬', bg: 'linear-gradient(135deg,#3a0020,#7a0040)' },
    Health:     { icon: '❤️', bg: 'linear-gradient(135deg,#3a0010,#7a1030)' },
    Science:    { icon: '🔬', bg: 'linear-gradient(135deg,#003a38,#006b66)' },
    World:      { icon: '🌍', bg: 'linear-gradient(135deg,#003a5c,#006b9e)' },
    Africa:     { icon: '🌍', bg: 'linear-gradient(135deg,#3a2000,#7a4a00)' },
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
            const ci = catIcons[a.category] || { icon: '📰', bg: 'linear-gradient(135deg,#1a1a2e,#2a2a4e)' }
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
                fontSize: '1.4rem',
                boxShadow: `0 0 0 1.5px ${catColor}44`,
              }}>
                {ci.icon}
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

// ─── POST CARD ───────────────────────────────────────────────────────────────

function PostCard({ post, liked, saved, onLike, onSave, user, profile, onAuthRequired }: {
  post: Post; liked: boolean; saved: boolean
  onLike: () => void; onSave: () => void
  user: any; profile: Profile | null; onAuthRequired: () => void
}) {
  const p = post.profiles
  const grad = p?.avatar_color || '135deg,#007aff,#5856d6'
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentCount, setCommentCount] = useState(post.comments_count)
  const [postMenu, setPostMenu] = useState(false)
  const [editPostModal, setEditPostModal] = useState(false)
  const [localContent, setLocalContent] = useState(post.content)
  const [deleted, setDeleted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPostMenu(false)
    }
    if (postMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [postMenu])

  async function toggleExpand() {
    const next = !expanded
    setExpanded(next)
    if (next && comments.length === 0) {
      setCommentsLoading(true)
      const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', post.id).order('created_at')
      setComments(data || [])
      setCommentsLoading(false)
    }
  }

  async function submitComment() {
    if (!user) { onAuthRequired(); return }
    if (!commentText.trim()) return
    const text = commentText.trim()
    setCommentText('')
    const { data } = await supabase.from('comments').insert({ post_id: post.id, author_id: user.id, content: text }).select('*, profiles(*)').single()
    if (data) { setComments(prev => [...prev, data]); setCommentCount(c => c + 1) }
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
    setCommentCount(c => c - 1)
  }

  async function deletePost() {
    await supabase.from('posts').delete().eq('id', post.id)
    setDeleted(true)
    setPostMenu(false)
  }

  async function saveEditPost(newContent: string) {
    await supabase.from('posts').update({ content: newContent }).eq('id', post.id)
    setLocalContent(newContent)
    setEditPostModal(false)
  }

  if (deleted) return null

  return (
    <div className="card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
      {/* Post header + body */}
      <div style={{ padding: 16, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar letter={p?.avatar_letter || 'U'} color={grad} size={40} photoUrl={p?.avatar_url} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p?.display_name || 'Unknown'}</div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{p?.username ? `@${p.username}` : ''}</span>
              {p?.username && <span>·</span>}
              <span>{timeAgo(post.created_at)}</span>
              {post.chatroom_tag && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,122,255,0.10)', color: 'var(--accent)', borderRadius: 99, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600 }}>#{post.chatroom_tag}</span>
              )}
            </div>
          </div>
          {/* Post actions menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setPostMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <Icon name="more-h" size={18} color="var(--text3)" />
            </button>
            {postMenu && (
              <div style={{ position: 'absolute', right: 0, top: 28, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 99, minWidth: 160, overflow: 'hidden' }}>
                {user?.id === post.author_id && (
                  <>
                    <button onClick={() => { setEditPostModal(true); setPostMenu(false) }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <Icon name="edit" size={15} color="var(--accent)" /> Edit post
                    </button>
                    <div style={{ height: '0.5px', background: 'var(--border)' }} />
                    <button onClick={deletePost} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent2)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <Icon name="x" size={15} color="var(--accent2)" /> Delete post
                    </button>
                  </>
                )}
                <button onClick={() => { navigator.clipboard?.writeText(localContent); setPostMenu(false) }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <Icon name="share" size={15} color="var(--text3)" /> Copy text
                </button>
              </div>
            )}
          </div>
        </div>

        <div onClick={toggleExpand} style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text)', marginBottom: (post.media_url || post.media_emoji) ? 12 : 0 }}>{localContent}</p>
          {post.media_url && (
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginTop: 8, marginBottom: 4 }}>
              <img src={post.media_url} alt="Post image" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block', borderRadius: 'var(--radius)' }} />
            </div>
          )}
          {!post.media_url && post.media_emoji && (
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 12, marginTop: 8, background: 'var(--bg)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>🎨</div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 0, padding: '10px 16px', borderTop: '0.5px solid var(--border)', marginTop: 10 }}>
        {[
          { icon: liked ? 'heart-filled' : 'heart', label: post.likes_count || '', action: onLike, active: liked, activeColor: 'var(--accent2)' },
          { icon: 'message-circle', label: commentCount || '', action: toggleExpand, active: expanded, activeColor: 'var(--accent)' },
          { icon: 'share', label: post.reposts_count || '', action: () => navigator.share?.({ text: localContent }).catch(() => {}), active: false, activeColor: 'var(--accent)' },
          { icon: saved ? 'bookmark-filled' : 'bookmark', label: '', action: onSave, active: saved, activeColor: 'var(--accent4)' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action as any} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', cursor: 'pointer', color: btn.active ? btn.activeColor : 'var(--text3)', fontSize: '0.78rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, flex: 1, justifyContent: 'center', transition: 'all 0.2s' }}>
            <Icon name={btn.icon} size={16} color={btn.active ? btn.activeColor : 'var(--text3)'} />
            {btn.label ? <span>{btn.label}</span> : null}
          </button>
        ))}
      </div>

      {/* Inline expanded comments — Facebook style */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg)', padding: '12px 16px' }}>
          {commentsLoading && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '8px 0', fontSize: '0.83rem' }}>Loading…</div>}
          {!commentsLoading && comments.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '8px 0', fontSize: '0.83rem' }}>No comments yet — be first!</div>
          )}
          {comments.map(c => (
            <CommentRow key={c.id} comment={c} currentUserId={user?.id} onDelete={() => deleteComment(c.id)} onQuote={(text, author) => { setCommentText(`> ${author}: "${text}"\n`); }} />
          ))}
          {/* Comment input */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 10 }}>
            {profile && <Avatar letter={profile.avatar_letter || 'U'} color={profile.avatar_color || '135deg,#007aff,#5856d6'} size={30} photoUrl={profile.avatar_url} />}
            <div style={{ flex: 1, background: 'var(--surface)', borderRadius: 18, border: '0.5px solid var(--border)', padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                rows={1}
                placeholder={user ? 'Write a comment…' : 'Sign in to comment…'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.87rem', color: 'var(--text)', outline: 'none', maxHeight: 100 }}
              />
              <button onClick={submitComment} style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="send" size={12} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit post modal */}
      {editPostModal && (
        <EditTextModal
          title="Edit post"
          initialText={localContent}
          onSave={saveEditPost}
          onClose={() => setEditPostModal(false)}
        />
      )}
    </div>
  )
}

// ─── COMMENT ROW ─────────────────────────────────────────────────────────────

function CommentRow({ comment: c, currentUserId, onDelete, onQuote }: {
  comment: any; currentUserId?: string
  onDelete: () => void; onQuote: (text: string, author: string) => void
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
          <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>{c.profiles?.display_name}</div>
          {hasQuote && (
            <div style={{ background: 'var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 6, padding: '4px 8px', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
              {quotedLines.map((l: string) => l.replace(/^> /, '')).join(' ')}
            </div>
          )}
          <div style={{ fontSize: '0.87rem', lineHeight: 1.5 }}>{bodyLines.join('\n')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, paddingLeft: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{timeAgo(c.created_at)}</span>
          <button onClick={() => onQuote(localContent, c.profiles?.display_name || 'User')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--accent)', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, padding: 0 }}>Quote</button>
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
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📰</div>
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

function MessagesPage({ user, profile }: { user: any; profile: Profile | null }) {
  const [convos, setConvos] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openConvo, setOpenConvo] = useState<Conversation | null>(null)
  const [newDMModal, setNewDMModal] = useState(false)

  useEffect(() => {
    if (!user) return
    loadConvos()
  }, [user])

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
    // Find or create conversation, then open it directly
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

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 16 }} className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.3px' }}>Messages</div>
        <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setNewDMModal(true)}>+ New</button>
      </div>
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} color="var(--text3)" />
        <input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="section-label">Recent</div>
      <div className="card">
        {loading ? Array(3).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: '50%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '75%' }} />
            </div>
          </div>
        )) : filtered.length === 0 ? (
          <div className="empty-state"><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div><div className="empty-title">No conversations yet</div><div className="empty-sub">Start a new message to connect with someone.</div></div>
        ) : filtered.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none' }}
            onClick={() => setOpenConvo(c)}>
            <Avatar letter={c.other_user?.avatar_letter || 'U'} color={c.other_user?.avatar_color || '135deg,#007aff,#5856d6'} size={48} online />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.other_user?.display_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{c.last_message || 'Start a conversation'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{timeAgo(c.last_message_at)}</div>
              {(c as any).unread > 0 && (
                <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 99, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, padding: '0 6px' }}>
                  {(c as any).unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {openConvo && <ChatScreen convo={openConvo} user={user} profile={profile} onClose={() => { setOpenConvo(null); loadConvos() }} />}
      {newDMModal && <NewDMModal user={user} profile={profile} onClose={() => setNewDMModal(false)} onOpenConvo={openConvoWithUser} />}
    </div>
  )
}

// ─── CHAT SCREEN ─────────────────────────────────────────────────────────────

function ChatScreen({ convo, user, profile, onClose }: { convo: Conversation; user: any; profile: Profile | null; onClose: () => void }) {
  const [msgs, setMsgs] = useState<DirectMessage[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
    await supabase.from('direct_messages').insert({ conversation_id: convo.id, sender_id: user.id, content })
    await supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', convo.id)
  }

  const other = convo.other_user!

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease' }}>
      <div style={{
        background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(30px)',
        borderBottom: '0.5px solid rgba(60,60,67,0.2)',
        padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={onClose}>
          <Icon name="back" size={22} color="var(--accent)" />
        </button>
        <Avatar letter={other.avatar_letter} color={other.avatar_color} size={36} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{other.display_name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>@{other.username}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {msgs.map(m => {
          const isMine = m.sender_id === user.id
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, maxWidth: '78%', alignSelf: isMine ? 'flex-end' : 'flex-start', flexDirection: isMine ? 'row-reverse' : 'row' }}>
              {!isMine && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{other.avatar_letter}</div>}
              <div>
                <div style={{
                  padding: '9px 13px', borderRadius: 18, fontSize: '0.88rem', lineHeight: 1.45,
                  background: isMine ? 'var(--accent)' : 'var(--bg2)',
                  color: isMine ? '#fff' : 'var(--text)',
                  borderBottomRightRadius: isMine ? 4 : 18,
                  borderBottomLeftRadius: isMine ? 18 : 4,
                }}>{m.content}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: 2, textAlign: isMine ? 'right' : 'left' }}>{timeAgo(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{
        background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(60,60,67,0.2)',
        padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end',
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      }}>
        <textarea
          rows={1} placeholder="Message…" value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          style={{
            flex: 1, background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 20,
            padding: '8px 14px', resize: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.9rem', color: 'var(--text)', outline: 'none', maxHeight: 120,
          }}
        />
        <button onClick={send} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="send" size={14} color="#fff" />
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
          <div key={u.id} style={{ display: 'flex', gap: 12, padding: '12px 0', cursor: 'pointer', alignItems: 'center', borderBottom: '0.5px solid var(--border)', borderRadius: 0 }}
            onClick={() => onOpenConvo(u)}>
            <Avatar letter={u.avatar_letter} color={u.avatar_color} size={44} photoUrl={u.avatar_url} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{u.display_name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>@{u.username}</div>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: '0.78rem', fontWeight: 600 }}>
              Message
            </div>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>Searching…</div>}
        {!loading && search && results.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 16 }}>No users found</div>}
        {!search && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
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

  const emojiMap: Record<string, string> = { nebula:'🌌', crystal:'💎', wave:'🌊', star:'⭐', city:'🌆', flower:'🌸', palette:'🎨', rocket:'🚀' }

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
        <div className="empty-state"><div style={{ fontSize: '3rem', marginBottom: 12 }}>🎨</div><div className="empty-title">No artworks yet</div><div className="empty-sub">Be the first to list your art.</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {artworks.map(art => (
            <div key={art.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedArt(art)}>
              <div style={{ background: `linear-gradient(${art.gradient})`, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', position: 'relative' }}>
                {emojiMap[art.emoji] || '🎨'}
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
  const emojiMap: Record<string, string> = { nebula:'🌌', crystal:'💎', wave:'🌊', star:'⭐', city:'🌆', flower:'🌸', palette:'🎨', rocket:'🚀' }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ background: `linear-gradient(${art.gradient})`, borderRadius: 'var(--radius-lg)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: 16 }}>
          {emojiMap[art.emoji] || '🎨'}
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

function ChatroomsPage({ user, profile, onAuthRequired }: { user: any; profile: Profile | null; onAuthRequired: () => void }) {
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
      await supabase.from('chatrooms').update({ members_count: (rooms.find(r => r.id === roomId)?.members_count ?? 1) - 1 }).eq('id', roomId)
    } else {
      await supabase.from('chatroom_members').insert({ room_id: roomId, user_id: user.id })
      setJoinedRooms(prev => new Set([...prev, roomId]))
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, members_count: r.members_count + 1 } : r))
      await supabase.from('chatrooms').update({ members_count: (rooms.find(r => r.id === roomId)?.members_count ?? 0) + 1 }).eq('id', roomId)
    }
  }

  const filtered = rooms.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
  const iconMap: Record<string, string> = { rocket:'🚀', palette:'🎨', globe:'🌍', briefcase:'💼', music:'🎵', trophy:'🏆', chat:'💬' }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 32px' }} className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.4px' }}>Rooms</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>Join the conversation</div>
        </div>
        <button className="btn-primary" onClick={() => user ? setCreateModal(true) : onAuthRequired()}>+ New Room</button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <Icon name="search" size={16} color="var(--text3)" />
        <input placeholder="Find a room…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Icon name="x" size={14} color="var(--text3)" /></button>}
      </div>

      {/* Skeletons */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 16, border: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: '65%', marginBottom: 5 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 10, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: '75%', marginBottom: 14 }} />
              <div className="skeleton" style={{ height: 30, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="empty-state" style={{ paddingTop: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div>
          <div className="empty-title">{search ? 'No rooms match your search' : 'No rooms yet'}</div>
          <div className="empty-sub">{search ? 'Try a different keyword' : 'Be the first to create a room!'}</div>
          {!search && <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => user ? setCreateModal(true) : onAuthRequired()}>Create Room</button>}
        </div>
      )}

      {/* Room cards grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map(r => {
            const joined = joinedRooms.has(r.id)
            return (
              <div key={r.id} onClick={() => setOpenRoom(r)} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                border: `0.5px solid ${joined ? 'rgba(0,122,255,0.3)' : 'var(--border)'}`,
                padding: 16, cursor: 'pointer', transition: 'all 0.18s',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>

                {/* Room avatar + name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                    background: r.photo_url ? undefined : `linear-gradient(${r.color})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                  }}>
                    {r.photo_url ? <img src={r.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (iconMap[r.icon] || '💬')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>👥 {r.members_count}</span>
                      {r.is_live && <div className="live-badge" style={{ fontSize: '0.6rem', padding: '1px 6px' }}><div className="live-dot" />LIVE</div>}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '0.78rem', color: 'var(--text3)', lineHeight: 1.45,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  flex: 1,
                }}>{r.description || 'No description'}</div>

                {/* Join button */}
                <button onClick={e => toggleJoin(e, r.id)} style={{
                  width: '100%', padding: '7px 0', borderRadius: 20,
                  border: joined ? '1.5px solid var(--border)' : 'none',
                  background: joined ? 'transparent' : 'var(--accent)',
                  color: joined ? 'var(--text3)' : '#fff',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.15s',
                }}>
                  {joined ? '✓ Joined' : 'Join Room'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {openRoom && (
        <ChatroomScreen
          room={rooms.find(r => r.id === openRoom.id) || openRoom}
          user={user} profile={profile}
          joined={joinedRooms.has(openRoom.id)}
          onJoin={e => toggleJoin(e as any, openRoom.id)}
          onClose={() => { setOpenRoom(null); loadRooms() }}
          onAuthRequired={onAuthRequired}
        />
      )}
      {createModal && <CreateRoomModal user={user} onClose={() => { setCreateModal(false); loadRooms() }} />}
    </div>
  )
}

// ─── CHATROOM SCREEN ──────────────────────────────────────────────────────────

function ChatroomScreen({ room, user, profile, joined, onJoin, onClose, onAuthRequired }: {
  room: Chatroom; user: any; profile: Profile | null
  joined: boolean; onJoin: (e: React.MouseEvent) => void
  onClose: () => void; onAuthRequired: () => void
}) {
  const [msgs, setMsgs] = useState<ChatroomMessage[]>([])
  const [text, setText] = useState('')
  const [membersCount, setMembersCount] = useState(room.members_count)
  const [infoModal, setInfoModal] = useState(false)
  const [editRoomModal, setEditRoomModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const iconMap: Record<string, string> = { rocket:'🚀', palette:'🎨', globe:'🌍', briefcase:'💼', music:'🎵', trophy:'🏆', chat:'💬' }

  useEffect(() => {
    loadMessages()
    // Realtime messages
    const msgChannel = supabase.channel(`chatroom-${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chatroom_messages', filter: `room_id=eq.${room.id}` }, payload => {
        fetchSingleMsg(payload.new.id)
      }).subscribe()
    // Realtime members count
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
    const content = text.trim()
    setText('')
    await supabase.from('chatroom_messages').insert({ room_id: room.id, author_id: user.id, content })
  }

  const isAdmin = user?.id === room.created_by

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease' }}>
      {/* Top bar — clickable for info */}
      <div style={{ background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(30px)', borderBottom: '0.5px solid rgba(60,60,67,0.2)', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={onClose}>
          <Icon name="back" size={22} color="var(--accent)" />
        </button>
        {/* Clickable room info area */}
        <button onClick={() => setInfoModal(true)} style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: room.photo_url ? undefined : `linear-gradient(${room.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0, overflow: 'hidden' }}>
            {room.photo_url ? <img src={room.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (iconMap[room.icon] || '💬')}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>{room.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>👥 {membersCount} {membersCount === 1 ? 'member' : 'members'}{room.is_live ? ' · 🔴 Live' : ''}</div>
          </div>
        </button>
        {/* Join/Leave button in header */}
        <button onClick={onJoin} style={{ padding: '6px 14px', borderRadius: 20, border: joined ? '1.5px solid var(--border)' : 'none', background: joined ? 'transparent' : 'var(--accent)', color: joined ? 'var(--text3)' : '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", flexShrink: 0 }}>
          {joined ? 'Joined' : 'Join'}
        </button>
        {isAdmin && (
          <button onClick={() => setEditRoomModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="edit" size={18} color="var(--accent)" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 && (
          <div className="empty-state"><div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div><div className="empty-title">No messages yet</div><div className="empty-sub">Be the first to say something!</div></div>
        )}
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 8, maxWidth: '85%', alignSelf: m.author_id === user?.id ? 'flex-end' : 'flex-start', flexDirection: m.author_id === user?.id ? 'row-reverse' : 'row' }}>
            {m.author_id !== user?.id && (
              <Avatar letter={m.profiles?.avatar_letter || 'U'} color={m.profiles?.avatar_color || '135deg,#007aff,#5856d6'} size={28} photoUrl={m.profiles?.avatar_url} />
            )}
            <div>
              {m.author_id !== user?.id && <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 2, fontWeight: 600 }}>@{m.profiles?.username}</div>}
              <div style={{ padding: '9px 13px', borderRadius: 18, fontSize: '0.88rem', lineHeight: 1.45, background: m.author_id === user?.id ? 'var(--accent)' : 'var(--bg2)', color: m.author_id === user?.id ? '#fff' : 'var(--text)', borderBottomRightRadius: m.author_id === user?.id ? 4 : 18, borderBottomLeftRadius: m.author_id === user?.id ? 18 : 4 }}>
                {m.content}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: 2, textAlign: m.author_id === user?.id ? 'right' : 'left' }}>{timeAgo(m.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ background: 'rgba(242,242,247,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(60,60,67,0.2)', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <textarea rows={1} placeholder={user ? 'Message the room…' : 'Sign in to chat…'} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          style={{ flex: 1, background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '8px 14px', resize: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem', color: 'var(--text)', outline: 'none', maxHeight: 120 }}
        />
        <button onClick={send} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="send" size={14} color="#fff" />
        </button>
      </div>

      {/* Room info popup */}
      {infoModal && <RoomInfoModal room={room} membersCount={membersCount} onClose={() => setInfoModal(false)} />}
      {/* Admin edit room modal */}
      {editRoomModal && <EditRoomModal room={room} user={user} onClose={() => setEditRoomModal(false)} />}
    </div>
  )
}

// ─── ROOM INFO MODAL ─────────────────────────────────────────────────────────

function RoomInfoModal({ room, membersCount, onClose }: { room: Chatroom; membersCount: number; onClose: () => void }) {
  const [members, setMembers] = useState<Profile[]>([])
  const [creator, setCreator] = useState<Profile | null>(null)
  const iconMap: Record<string, string> = { rocket:'🚀', palette:'🎨', globe:'🌍', briefcase:'💼', music:'🎵', trophy:'🏆', chat:'💬' }

  useEffect(() => {
    supabase.from('chatroom_members').select('profiles(*)').eq('room_id', room.id).limit(20)
      .then(({ data }) => setMembers((data || []).map((d: any) => d.profiles).filter(Boolean)))
    if (room.created_by) {
      supabase.from('profiles').select('*').eq('id', room.created_by).single()
        .then(({ data }) => setCreator(data))
    }
  }, [room.id])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="sheet-handle" />
        {/* Room header */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: room.photo_url ? undefined : `linear-gradient(${room.color})`, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
            {room.photo_url ? <img src={room.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (iconMap[room.icon] || '💬')}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{room.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>#{room.topic}</div>
          </div>
        </div>
        {room.description && (
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.87rem', lineHeight: 1.6, color: 'var(--text2)' }}>
            {room.description}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{membersCount}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Members</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{new Date(room.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Created</div>
          </div>
        </div>
        {creator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10 }}>
            <Avatar letter={creator.avatar_letter || 'U'} color={creator.avatar_color || '135deg,#007aff,#5856d6'} size={32} photoUrl={creator.avatar_url} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Created by</div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{creator.display_name}</div>
            </div>
          </div>
        )}
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text2)' }}>Members</div>
        {members.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.83rem', padding: '12px 0' }}>No members yet</div>
        ) : members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar letter={m.avatar_letter || 'U'} color={m.avatar_color || '135deg,#007aff,#5856d6'} size={34} photoUrl={m.avatar_url} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{m.display_name}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text3)' }}>@{m.username}</div>
            </div>
            {m.id === room.created_by && (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(0,122,255,0.1)', color: 'var(--accent)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>Admin</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── EDIT ROOM MODAL (admin only) ────────────────────────────────────────────

function EditRoomModal({ room, user, onClose }: { room: Chatroom; user: any; onClose: () => void }) {
  const [name, setName] = useState(room.name)
  const [desc, setDesc] = useState(room.description)
  const [photoUrl, setPhotoUrl] = useState(room.photo_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const iconMap: Record<string, string> = { rocket:'🚀', palette:'🎨', globe:'🌍', briefcase:'💼', music:'🎵', trophy:'🏆', chat:'💬' }

  async function uploadPhoto(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `rooms/${room.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('post-images').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
      setPhotoUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('chatrooms').update({ name: name.trim(), description: desc.trim(), photo_url: photoUrl || null }).eq('id', room.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 400 }}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>Edit Room</div>
        {/* Photo picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 14, background: photoUrl ? undefined : `linear-gradient(${room.color})`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', cursor: 'pointer', flexShrink: 0, position: 'relative', border: '2px dashed var(--border)' }}>
            {photoUrl ? <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (iconMap[room.icon] || '💬')}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="image" size={20} color="#fff" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 3 }}>Room photo</div>
            <div style={{ fontSize: '0.77rem', color: 'var(--text3)' }}>{uploading ? 'Uploading…' : 'Tap to change'}</div>
            {photoUrl && <button onClick={() => setPhotoUrl('')} style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Remove photo</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
        </div>
        <input className="post-input" placeholder="Room name…" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <textarea className="post-input" rows={3} placeholder="Description…" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '0.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '0.9rem', color: 'var(--text)' }}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving || uploading} style={{ flex: 1, padding: 11 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
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
      // Auto-join creator
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
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Create a Room</div>
        <input className="post-input" placeholder="Room name…" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 10, height: 44 }} />
        <textarea className="post-input" rows={2} placeholder="Description…" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ marginBottom: 6, fontSize: '0.8rem', color: 'var(--text3)' }}>Topic</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {topics.map(t => <button key={t} className={`cat-pill${topic === t ? ' active' : ''}`} onClick={() => setTopic(t)}>{t}</button>)}
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: 12 }} onClick={create} disabled={submitting || !name}>
          {submitting ? 'Creating…' : 'Create Room'}
        </button>
      </div>
    </div>
  )
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

// ─── PROFILE POPUP ───────────────────────────────────────────────────────────

function ProfilePopup({ user, profile, onClose, onSignOut }: { user: any; profile: Profile | null; onClose: () => void; onSignOut: () => void }) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [editModal, setEditModal] = useState(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  if (!profile) return null

  return (
    <>
      <div ref={popupRef} style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 600,
        width: 280, background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        animation: 'fadeUp 0.18s ease both',
      }}>
        {/* Banner + avatar */}
        <div style={{ height: 72, background: 'linear-gradient(135deg,#6c47ff,#ff5c8d,#ff8c42)', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', bottom: -22, left: 16 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg)', display: 'block' }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.3rem', border: '3px solid var(--bg)' }}>
                {profile.avatar_letter}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '28px 16px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{profile.display_name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 1, marginBottom: 6 }}>
            @{profile.username}
            {profile.verified && <span style={{ color: 'var(--accent3)', marginLeft: 6 }}>✓</span>}
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

        {/* Actions */}
        <div style={{ borderTop: '0.5px solid var(--border)' }}>
          <button onClick={() => { setEditModal(true) }} style={{
            width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="user" size={16} color="var(--text3)" /> Edit Profile
          </button>
          <button onClick={onSignOut} style={{
            width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent2)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif",
            transition: 'background 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,45,85,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <Icon name="log-out" size={16} color="var(--accent2)" /> Sign Out
          </button>
        </div>
      </div>
      {editModal && <EditProfileModal profile={profile} onClose={() => { setEditModal(false); onClose() }} />}
    </>
  )
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────

function ProfilePage({ user, profile, onSignOut }: { user: any; profile: Profile | null; onSignOut: () => void }) {
  const [tab, setTab] = useState<'posts' | 'media' | 'artworks' | 'saved'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [editModal, setEditModal] = useState(false)

  useEffect(() => { if (user) loadTab() }, [tab, user])

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
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>👋</div>
      <div className="empty-title">You're not signed in</div>
      <div className="empty-sub">Sign in to view your profile, posts, and saved content.</div>
    </div>
  )

  return (
    <div className="page-enter">
      {/* Banner */}
      <div style={{ height: 120, background: 'linear-gradient(135deg,#6c47ff,#ff5c8d,#ff8c42)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: -30, left: 20 }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg)', display: 'block' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(${profile.avatar_color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.8rem', border: '4px solid var(--bg)' }}>
              {profile.avatar_letter}
            </div>
          )}
        </div>
        <button className="btn-secondary" style={{ position: 'absolute', bottom: -20, right: 16, padding: '6px 16px', fontSize: '0.82rem' }} onClick={() => setEditModal(true)}>
          Edit Profile
        </button>
      </div>

      <div style={{ padding: '40px 20px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{profile.display_name}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 8 }}>
          @{profile.username}
          {profile.verified && <span style={{ color: 'var(--accent3)', marginLeft: 6 }}>✓ Verified</span>}
        </div>
        {profile.bio && <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text2)', marginBottom: 12 }}>{profile.bio}</p>}

        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[['Posts', profile.posts_count], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, n]) => (
            <div key={l}>
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
            posts.length === 0 ? <div className="empty-state"><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✍️</div><div className="empty-title">No posts yet</div><div className="empty-sub">Start sharing your thoughts with the community.</div></div>
              : posts.map(p => <PostCard key={p.id} post={p} liked={false} saved={false} onLike={() => {}} onSave={() => {}} user={user} profile={profile} onAuthRequired={() => {}} />)
          ) : tab === 'media' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
              {Array(9).fill(0).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', background: `linear-gradient(${['135deg,#6c47ff,#ff5c8d','135deg,#00c8a0,#6c47ff','135deg,#ff8c42,#ff5c8d'][i % 3]})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {['🎨','🚀','🌊','⭐','🌌','💎','🌸','🔥','🎵'][i]}
                </div>
              ))}
            </div>
          ) : tab === 'artworks' ? (
            artworks.length === 0 ? <div className="empty-state"><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎨</div><div className="empty-title">No artworks listed</div><div className="empty-sub">List your art on the marketplace.</div></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {artworks.map(a => (
                  <div key={a.id} className="card">
                    <div style={{ background: `linear-gradient(${a.gradient})`, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎨</div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>${a.price_usd}</div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            savedPosts.length === 0 ? <div className="empty-state"><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔖</div><div className="empty-title">Nothing saved yet</div><div className="empty-sub">Save posts, artworks, and articles to view them here.</div></div>
              : savedPosts.map(p => <PostCard key={p.id} post={p} liked={false} saved={true} onLike={() => {}} onSave={() => {}} user={user} profile={profile} onAuthRequired={() => {}} />)
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

function CreatePostModal({ user, profile, onClose }: { user: any; profile: Profile | null; onClose: () => void }) {
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  async function publish() {
    if (!text.trim() || !user) return
    setSubmitting(true)

    let mediaUrl: string | null = null

    if (imageFile) {
      setUploading(true)
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(path, imageFile, { cacheControl: '3600', upsert: false })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
        mediaUrl = urlData.publicUrl
      }
      setUploading(false)
    }

    await supabase.from('posts').insert({ author_id: user.id, content: text.trim(), media_url: mediaUrl })
    setSubmitting(false)
    onClose()
  }

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

            {/* Image preview */}
            {imagePreview && (
              <div style={{ position: 'relative', marginTop: 10, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 'var(--radius)', display: 'block' }} />
                <button onClick={removeImage} style={{
                  position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="x" size={14} color="#fff" />
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleFileSelect} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button title="Add image" onClick={() => fileInputRef.current?.click()} style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: imageFile ? 'rgba(0,122,255,0.15)' : 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Icon name="image" size={16} color="var(--accent)" />
                </button>
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
  const [region, setRegion] = useState('')
  const [stations, setStations] = useState<RadioStation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [places, setPlaces] = useState<{ id: string; title: string; country: string; size: number }[]>([])
  const [showPlaces, setShowPlaces] = useState(false)
  const [placeSearch, setPlaceSearch] = useState('')

  useEffect(() => { loadRegion('') }, [])

  async function loadRegion(placeId: string) {
    setRegion(placeId); setQuery(''); setError(''); setLoading(true)
    const result = placeId ? await rgPlaceFetch(placeId) : await rgTrendingFetch()
    if (result.length === 0) setError('No stations found for this location.')
    setStations(result)
    setLoading(false)
  }

  async function search() {
    const q = query.trim(); if (!q) return
    setRegion(''); setError(''); setLoading(true)
    const result = await rgSearchFetch(q)
    if (result.length === 0) setError('No stations found. Try a different search.')
    setStations(result)
    setLoading(false)
  }

  async function openPlacePicker() {
    setShowPlaces(true)
    if (places.length === 0) {
      const list = await rgPlacesList()
      setPlaces(list.sort((a, b) => b.size - a.size))
    }
  }

  const filteredPlaces = places.filter(p =>
    !placeSearch || p.title.toLowerCase().includes(placeSearch.toLowerCase()) || p.country.toLowerCase().includes(placeSearch.toLowerCase())
  ).slice(0, 60)

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', alignItems: 'center', margin: '0 16px 12px' }}>
        <Icon name="search" size={16} color="var(--text3)" />
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search stations by name or city…"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 0', fontSize: '0.88rem', color: 'var(--text)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
        {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={14} color="var(--text3)" /></button>}
        <button onClick={search} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Go</button>
      </div>

      {/* Region pills + browse all places */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 14px', scrollbarWidth: 'none', alignItems: 'center' }}>
        {RADIO_REGIONS.map(r => (
          <button key={r.label} onClick={() => loadRegion(r.placeId)}
            className={`cat-pill${region === r.placeId && !query ? ' active' : ''}`}
            style={{ flexShrink: 0 }}>{r.label}</button>
        ))}
        <button onClick={openPlacePicker}
          className="cat-pill" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="globe" size={12} color="var(--text3)" /> All Cities
        </button>
      </div>

      {/* Results */}
      <div style={{ padding: '0 16px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}><Icon name="loader" size={24} color="var(--accent)" /><div style={{ marginTop: 10, fontSize: '0.85rem' }}>Loading stations…</div></div>}
        {error && !loading && <div style={{ background: 'rgba(255,45,85,0.08)', color: 'var(--accent2)', borderRadius: 12, padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
        {!loading && !error && stations.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}><Icon name="wifi" size={32} color="var(--text3)" /><div style={{ marginTop: 12, fontSize: '0.88rem' }}>No stations found</div></div>}
        {!loading && stations.length > 0 && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stations.length} stations · Radio Garden</div>
            {stations.map(s => <StationCard key={s.stationuuid} s={s} current={currentRadio} onPlay={onPlay} />)}
          </>
        )}
      </div>

      {/* All Places modal */}
      {showPlaces && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPlaces(false)}>
          <div className="modal-sheet" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sheet-handle" />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌍 Browse Cities</span>
              <button onClick={() => setShowPlaces(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={18} color="var(--text3)" /></button>
            </div>
            <div className="search-bar" style={{ marginBottom: 12 }}>
              <Icon name="search" size={14} color="var(--text3)" />
              <input placeholder="Search cities or countries…" value={placeSearch} onChange={e => setPlaceSearch(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: 'var(--text)', fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredPlaces.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: '0.85rem' }}>No cities found</div>}
              {filteredPlaces.map(p => (
                <div key={p.id} onClick={() => { loadRegion(p.id); setShowPlaces(false) }} style={{
                  padding: '11px 4px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{p.country}</div>
                  </div>
                  <Icon name="chevron-right" size={14} color="var(--text3)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
          {mode === 'login' ? 'Welcome back' : 'Join Village'}
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

function NotifModal({ onClose }: { onClose: () => void }) {
  const notifs = [
    { icon: 'heart-filled', color: 'var(--accent2)', text: 'Kai Nakamura liked your post', time: '2m' },
    { icon: 'message-circle', color: 'var(--accent)', text: 'Luna Vasquez commented: "This is amazing!"', time: '15m' },
    { icon: 'user', color: 'var(--accent5)', text: 'Neo Park started following you', time: '1h' },
    { icon: 'bookmark-filled', color: 'var(--accent4)', text: 'Your artwork "Digital Dreams" was saved', time: '3h' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>Notifications</div>
        {notifs.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < notifs.length - 1 ? '0.5px solid var(--border)' : 'none', alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={n.icon} size={18} color={n.color} />
            </div>
            <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.4 }}>{n.text}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', flexShrink: 0 }}>{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
