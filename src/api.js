// Base URL da API: use variável de ambiente ou fallback para desenvolvimento
const getApiUrl = () => import.meta.env.VITE_API_URL || "http://localhost:8080"

export function apiUrl(path = "") {
  const base = getApiUrl().replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}

/** Origem do front (links públicos para clientes). Override: VITE_PUBLIC_UI_ORIGIN. */
export function getPublicUiOrigin() {
  const fromEnv = (import.meta.env.VITE_PUBLIC_UI_ORIGIN || "").trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv
  if (typeof window !== "undefined") return window.location.origin
  return ""
}

/** URL da tela “pontos-nota” para divulgação (slug da loja). */
export function getPontosNotaPublicUrl(tenantSlug) {
  if (!tenantSlug) return ""
  const o = getPublicUiOrigin()
  if (!o) return ""
  return `${o}/pontos-nota?tenant=${encodeURIComponent(tenantSlug)}`
}

export function getToken() {
  return localStorage.getItem("token")
}

export function getTenant() {
  try {
    const t = localStorage.getItem("tenant")
    return t ? JSON.parse(t) : null
  } catch {
    return null
  }
}

export function setAuth(token, tenant) {
  if (token) localStorage.setItem("token", token)
  else localStorage.removeItem("token")
  if (tenant) localStorage.setItem("tenant", JSON.stringify(tenant))
  else localStorage.removeItem("tenant")
}

export async function fetchApi(path, options = {}) {
  const token = getToken()
  const url = apiUrl(path)
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { ...options, headers })
  return res
}

export function trackPublicPageVisit({ pageKey, pagePath, query = "", tenantSlug = "" }) {
  if (!pageKey || !pagePath) return
  const payloadObj = {
    page_key: pageKey,
    page_path: pagePath,
    query,
    tenant_slug: tenantSlug || "",
  }
  const payload = JSON.stringify(payloadObj)

  const endpoint = apiUrl("/api/public/page-visit")
  const qs = new URLSearchParams(payloadObj).toString()
  const pixelEndpoint = `${endpoint}?${qs}`

  if (typeof window !== "undefined" && typeof Image !== "undefined") {
    const img = new Image()
    img.decoding = "async"
    img.src = pixelEndpoint
  }

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" })
    const queued = navigator.sendBeacon(endpoint, blob)
    if (queued) return
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}
