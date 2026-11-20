import { useCallback, useEffect, useRef, useState } from 'react'
import type { NormalizedRoom } from '../types'

interface Result { rooms: NormalizedRoom[]; totalPages: number }

export function useInfinite(loader: (page: number) => Promise<Result>, deps: any[]) {
  const [rooms, setRooms] = useState<NormalizedRoom[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const sentinel = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const pageRef = useRef(1)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const run = useCallback(async (p: number, reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError('')
    try {
      const r = await loaderRef.current(p)
      setRooms((prev) => reset ? r.rooms : [...prev, ...r.rooms])
      setTotalPages(r.totalPages)
      pageRef.current = p
      setPage(p)
    } catch (e: any) {
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    setRooms([])
    pageRef.current = 1
    run(1, true)
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = sentinel.current
    if (!el || loading || page >= totalPages || error) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingRef.current && pageRef.current < totalPages) {
        const next = pageRef.current + 1
        run(next, false)
      }
    }, { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loading, page, totalPages, error, run])

  return { rooms, loading, error, sentinel, totalPages }
}
