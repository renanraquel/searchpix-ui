/** Slugs com módulo PIX no painel quando VITE_PIX_MODULE_TENANT_SLUGS não está definida. Alinhar com PIX_MODULE_TENANT_SLUGS no backend. */
const DEFAULT_SLUGS = ["ibimassas"]

export function pixModuleTenantSlugs() {
  const raw = (import.meta.env.VITE_PIX_MODULE_TENANT_SLUGS || "").trim()
  if (!raw) return [...DEFAULT_SLUGS]
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts : [...DEFAULT_SLUGS]
}

export function isPixModuleEnabledForTenantSlug(slug) {
  if (!slug) return false
  return pixModuleTenantSlugs().includes(slug)
}
