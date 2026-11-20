import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Favorite, NormalizedRoom } from '../types'

export interface Sample { t: number; total: number; top: number }
interface Settings { notify: boolean; keywords: string[]; danmakuSpeed: number }

interface StoreValue {
  favorites: Favorite[]
  toggleFavorite: (room: NormalizedRoom) => void
  removeFavorite: (id: number) => void
  isFavorite: (id: number) => boolean
  markLive: (id: number, live: boolean) => void
  samples: Sample[]
  addSample: (s: Sample) => void
  settings: Settings
  setSettings: (s: Partial<Settings>) => void
  notify: (title: string, body: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>(() => load('dy_favorites', []))
  const [samples, setSamples] = useState<Sample[]>(() => load('dy_samples', []))
  const [settings, setSettingsState] = useState<Settings>(() => load('dy_settings', { notify: false, keywords: [], danmakuSpeed: 1 }))

  useEffect(() => { localStorage.setItem('dy_favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('dy_samples', JSON.stringify(samples.slice(-500))) }, [samples])
  useEffect(() => { localStorage.setItem('dy_settings', JSON.stringify(settings)) }, [settings])

  const toggleFavorite = useCallback((room: NormalizedRoom) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === room.id)) return prev.filter((f) => f.id !== room.id)
      return [{
        id: room.id, title: room.title, anchor: room.anchor, avatar: room.avatar,
        cover: room.cover, cate: room.cate, addedAt: Date.now(), liveNow: true,
      }, ...prev]
    })
  }, [])

  const removeFavorite = useCallback((id: number) => setFavorites((p) => p.filter((f) => f.id !== id)), [])
  const isFavorite = useCallback((id: number) => favorites.some((f) => f.id === id), [favorites])
  const markLive = useCallback((id: number, live: boolean) => {
    setFavorites((prev) => prev.map((f) => f.id === id ? { ...f, liveNow: live, lastLiveAt: live ? Date.now() : f.lastLiveAt } : f))
  }, [])

  const addSample = useCallback((s: Sample) => setSamples((p) => [...p, s].slice(-500)), [])
  const setSettings = useCallback((s: Partial<Settings>) => setSettingsState((p) => ({ ...p, ...s })), [])

  const notify = useCallback((title: string, body: string) => {
    if (!settings.notify || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    try { new Notification(title, { body, icon: '/icon-192.png', tag: 'douyuhub' }) } catch { /* ignore */ }
  }, [settings.notify])

  useEffect(() => {
    if (settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [settings.notify])

  const value = useMemo(() => ({
    favorites, toggleFavorite, removeFavorite, isFavorite, markLive,
    samples, addSample, settings, setSettings, notify,
  }), [favorites, toggleFavorite, removeFavorite, isFavorite, markLive, samples, addSample, settings, setSettings, notify])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}
