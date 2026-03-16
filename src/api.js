// Base URL da API: use variável de ambiente ou fallback para desenvolvimento
const getApiUrl = () => import.meta.env.VITE_API_URL || "http://localhost:8080"

export function apiUrl(path = "") {
  const base = getApiUrl().replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
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
