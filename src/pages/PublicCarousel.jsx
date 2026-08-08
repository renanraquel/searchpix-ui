import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { apiUrl, trackPublicPageVisit } from "../api"

function resolveMediaUrl(path) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return apiUrl(path)
}

function clearMediaCache(cache) {
  for (const url of cache.values()) {
    if (typeof url === "string" && url.startsWith("blob:")) {
      URL.revokeObjectURL(url)
    }
  }
  cache.clear()
}

export default function PublicCarousel() {
  const [searchParams] = useSearchParams()
  const tenantSlug = (searchParams.get("tenant") || "").trim()

  const [items, setItems] = useState([])
  const [imageDuration, setImageDuration] = useState(20)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [needsTap, setNeedsTap] = useState(false)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaSrc, setMediaSrc] = useState("")
  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const watchdogRef = useRef(null)
  const mediaCacheRef = useRef(new Map())

  const currentItem = items.length > 0 ? items[currentIndex % items.length] : null

  const goNext = useCallback(() => {
    setNeedsTap(false)
    setMediaLoading(false)
    setCurrentIndex((i) => (items.length ? (i + 1) % items.length : 0))
  }, [items.length])

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const cacheMediaBlob = useCallback(async (item) => {
    const cached = mediaCacheRef.current.get(item.id)
    if (cached) return cached

    const url = resolveMediaUrl(item.media_url)
    // URLs absolutas (R2/CDN): usa direto — sem baixar pelo app e sem blob em memória.
    if (url.startsWith("http://") || url.startsWith("https://")) {
      mediaCacheRef.current.set(item.id, url)
      return url
    }
    const res = await fetch(url)
    if (!res.ok) throw new Error("Falha ao carregar mídia")
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    mediaCacheRef.current.set(item.id, blobUrl)
    return blobUrl
  }, [])

  const startVideoWatchdog = useCallback(() => {
    clearWatchdog()
    watchdogRef.current = setTimeout(() => {
      const v = videoRef.current
      if (!v || v.ended) return
      if (v.paused || v.readyState < 2) {
        goNext()
      }
    }, 15000)
  }, [clearWatchdog, goNext])

  const tryPlayVideo = useCallback(async () => {
    const v = videoRef.current
    if (!v) return
    try {
      await v.play()
      setNeedsTap(false)
      setMediaLoading(false)
      startVideoWatchdog()
    } catch {
      setNeedsTap(true)
      setMediaLoading(false)
    }
  }, [startVideoWatchdog])

  const handleStart = useCallback(() => {
    if (currentItem?.media_type === "video") {
      tryPlayVideo()
      return
    }
    setNeedsTap(false)
  }, [currentItem, tryPlayVideo])

  useEffect(() => {
    if (!tenantSlug) {
      setError("Informe o parâmetro ?tenant= na URL.")
      setLoading(false)
      return
    }
    trackPublicPageVisit({
      pageKey: "carousel_tv",
      pagePath: "/carrossel-tv",
      query: `tenant=${tenantSlug}`,
      tenantSlug,
    })
    async function load() {
      setLoading(true)
      setError("")
      clearMediaCache(mediaCacheRef.current)
      setMediaSrc("")
      try {
        const res = await fetch(apiUrl(`/api/public/carousel?tenant=${encodeURIComponent(tenantSlug)}`))
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        const list = Array.isArray(data.items) ? data.items : []
        setItems(list)
        setImageDuration(Number(data.settings?.image_duration_seconds) || 20)
        setCurrentIndex(0)
      } catch (e) {
        setError(e.message || "Erro ao carregar carrossel.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantSlug])

  useEffect(() => {
    if (!currentItem) {
      setMediaSrc("")
      return undefined
    }

    let cancelled = false

    async function loadCurrent() {
      const cached = mediaCacheRef.current.get(currentItem.id)
      if (cached) {
        setMediaSrc(cached)
        setMediaLoading(currentItem.media_type === "video")
        return
      }

      setMediaLoading(true)
      try {
        const blobUrl = await cacheMediaBlob(currentItem)
        if (!cancelled) setMediaSrc(blobUrl)
      } catch {
        if (!cancelled) goNext()
      }
    }

    loadCurrent()
    return () => {
      cancelled = true
    }
  }, [currentItem, cacheMediaBlob, goNext])

  useEffect(() => {
    if (items.length < 2 || !currentItem) return undefined
    const nextItem = items[(currentIndex + 1) % items.length]
    if (!nextItem || mediaCacheRef.current.has(nextItem.id)) return undefined

    cacheMediaBlob(nextItem).catch(() => {})
    return undefined
  }, [currentIndex, items, currentItem, cacheMediaBlob])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    clearWatchdog()
    setNeedsTap(false)
    if (!currentItem || currentItem.media_type === "video") return undefined
    if (!mediaSrc) return undefined
    setMediaLoading(false)
    timerRef.current = setTimeout(goNext, Math.max(1, imageDuration) * 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentItem, imageDuration, goNext, clearWatchdog, mediaSrc])

  useEffect(() => () => {
    clearWatchdog()
    clearMediaCache(mediaCacheRef.current)
  }, [clearWatchdog])

  if (loading) {
    return (
      <div className="carousel-tv-root carousel-tv-loading">
        <p>Carregando carrossel…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="carousel-tv-root carousel-tv-error">
        <p>{error}</p>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="carousel-tv-root carousel-tv-empty">
        <p>Nenhuma mídia cadastrada para este estabelecimento.</p>
      </div>
    )
  }

  return (
    <div className="carousel-tv-root" onClick={needsTap ? handleStart : undefined}>
      {mediaSrc && currentItem.media_type === "video" ? (
        <video
          key={currentItem.id}
          ref={videoRef}
          className="carousel-tv-media"
          src={mediaSrc}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => tryPlayVideo()}
          onPlaying={() => {
            setMediaLoading(false)
            clearWatchdog()
          }}
          onWaiting={() => setMediaLoading(true)}
          onEnded={goNext}
          onError={goNext}
        />
      ) : mediaSrc ? (
        <img
          key={currentItem.id}
          className="carousel-tv-media"
          src={mediaSrc}
          alt=""
          onLoad={() => setMediaLoading(false)}
          onError={goNext}
        />
      ) : null}
      {mediaLoading && !needsTap && (
        <div className="carousel-tv-overlay" aria-hidden="true">
          <p>Carregando…</p>
        </div>
      )}
      {needsTap && (
        <div className="carousel-tv-overlay carousel-tv-tap">
          <p>Toque para iniciar</p>
        </div>
      )}
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }
        .carousel-tv-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          width: 100%;
          height: 100%;
          height: 100dvh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .carousel-tv-media {
          max-width: 100%;
          max-height: 100%;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }
        .carousel-tv-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
          color: #fff;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 1.1rem;
          pointer-events: none;
        }
        .carousel-tv-tap {
          background: rgba(0, 0, 0, 0.65);
          pointer-events: auto;
          cursor: pointer;
        }
        .carousel-tv-loading,
        .carousel-tv-error,
        .carousel-tv-empty {
          color: #ccc;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  )
}
