import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { apiUrl, trackPublicPageVisit } from "../api"

function resolveMediaUrl(path) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return apiUrl(path)
}

export default function PublicCarousel() {
  const [searchParams] = useSearchParams()
  const tenantSlug = (searchParams.get("tenant") || "").trim()

  const [items, setItems] = useState([])
  const [imageDuration, setImageDuration] = useState(20)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const timerRef = useRef(null)
  const videoRef = useRef(null)

  const currentItem = items.length > 0 ? items[currentIndex % items.length] : null

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (items.length ? (i + 1) % items.length : 0))
  }, [items.length])

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
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!currentItem || currentItem.media_type === "video") return undefined
    timerRef.current = setTimeout(goNext, Math.max(1, imageDuration) * 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentItem, imageDuration, goNext])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentItem || currentItem.media_type !== "video") return undefined
    v.currentTime = 0
    const playPromise = v.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {})
    }
    return undefined
  }, [currentItem])

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

  const mediaSrc = resolveMediaUrl(currentItem.media_url)

  return (
    <div className="carousel-tv-root">
      {currentItem.media_type === "video" ? (
        <video
          key={currentItem.id}
          ref={videoRef}
          className="carousel-tv-media"
          src={mediaSrc}
          autoPlay
          muted
          playsInline
          onEnded={goNext}
        />
      ) : (
        <img
          key={currentItem.id}
          className="carousel-tv-media"
          src={mediaSrc}
          alt=""
        />
      )}
      <style>{`
        .carousel-tv-root {
          position: fixed;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .carousel-tv-media {
          max-width: 100%;
          max-height: 100%;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .carousel-tv-loading,
        .carousel-tv-error,
        .carousel-tv-empty {
          color: #ccc;
          font-family: system-ui, sans-serif;
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  )
}
