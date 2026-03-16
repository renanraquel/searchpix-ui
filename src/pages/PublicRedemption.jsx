import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { apiUrl } from "../api"

const REDEMPTIONS_PAGE_SIZE = 5

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function formatRedemptionDate(d) {
  if (!d) return ""
  const t = typeof d === "string" ? d : d?.Time ?? d
  try {
    return new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return String(d)
  }
}

export default function PublicRedemption() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tenantSlug = searchParams.get("tenant") || ""
  const cpfParam = searchParams.get("cpf") || ""
  const [cpf, setCpf] = useState(cpfParam)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [redemptionsPage, setRedemptionsPage] = useState(1)
  useEffect(() => {
    if (tenantSlug) {
      setCpf(cpfParam)
      load(tenantSlug, cpfParam || undefined)
    }
  }, [tenantSlug, cpfParam])

  async function load(tenant, cpfValue) {
    if (!tenant) return
    setLoading(true)
    setError("")
    try {
      const url = cpfValue
        ? `${apiUrl("/api/public/redemption")}?tenant=${encodeURIComponent(tenant)}&cpf=${encodeURIComponent(cpfValue.replace(/\D/g, ""))}`
        : `${apiUrl("/api/public/redemption")}?tenant=${encodeURIComponent(tenant)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Não foi possível carregar os dados.")
      const json = await res.json()
      setData(json)
      setRedemptionsPage(1)
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function handleCpfSubmit(e) {
    e.preventDefault()
    const raw = cpf.replace(/\D/g, "")
    if (raw.length < 11) {
      setError("Informe um CPF válido com 11 dígitos.")
      return
    }
    setSearchParams({ tenant: tenantSlug, cpf: raw })
    load(tenantSlug, raw)
  }

  const backgroundUrl = data?.tenant?.background_image_url
    ? apiUrl(data.tenant.background_image_url)
    : null

  if (!tenantSlug) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <p>Acesso por link do estabelecimento. Ex.: /resgatar?tenant=slug-da-padaria</p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: backgroundUrl ? "rgba(0,0,0,0.45)" : "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 24,
          boxSizing: "border-box",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 820,
            marginTop: 24,
            padding: 24,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.96)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <h1 style={{ marginBottom: 8 }}>{data?.tenant?.name || "Carregando..."}</h1>
          <p style={{ color: "#666", marginBottom: 24 }}>Resgate seus pontos</p>

          {!data?.customer && (
            <form onSubmit={handleCpfSubmit} style={{ marginBottom: 32 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                Digite seu CPF para ver seus pontos e resgatar
              </label>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  style={{ padding: 12, borderRadius: 6, border: "1px solid #ccc", fontSize: 16, minWidth: 200 }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#0052cc",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: "bold",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Carregando..." : "Acessar"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div
              style={{
                padding: 12,
                backgroundColor: "#f8d7da",
                color: "#721c24",
                borderRadius: 6,
                marginBottom: 24,
              }}
            >
              {error}
            </div>
          )}

          {loading && !data && <p>Carregando...</p>}

          {data?.customer && (
            <>
              <div
                style={{
                  backgroundColor: "#f0f4ff",
                  border: "1px solid #c5d4f0",
                  borderRadius: 12,
                  padding: "20px 16px",
                  marginBottom: 32,
                  width: "100%",
                  maxWidth: 480,
                  boxSizing: "border-box",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: 14, color: "#555", marginBottom: 6, fontWeight: 600 }}>Cliente</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: 20,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {data.customer.name}
                </div>
                <div style={{ fontSize: 14, color: "#555", marginBottom: 6, fontWeight: 600 }}>Seus pontos</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0052cc" }}>
                  {data.customer.points_balance ?? 0} <span style={{ fontSize: 18, fontWeight: 600 }}>pts</span>
                </div>
              </div>

              <h2 style={{ marginBottom: 16 }}>Itens disponíveis para resgate</h2>
              <div style={{ display: "grid", gap: 16 }}>
                {data.products?.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 16,
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url.startsWith("http") ? p.image_url : apiUrl(p.image_url)}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <strong>{p.description}</strong>
                      <br />
                      <span style={{ color: "#0052cc", fontWeight: "bold" }}>
                        {p.points_required} pontos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {(!data.products || data.products.length === 0) && (
                <p style={{ color: "#666" }}>Nenhum item disponível para resgate no momento.</p>
              )}

              {data.redemptions?.length > 0 && (() => {
                const list = data.redemptions
                const total = list.length
                const totalPages = Math.ceil(total / REDEMPTIONS_PAGE_SIZE) || 1
                const page = Math.min(Math.max(1, redemptionsPage), totalPages)
                const start = (page - 1) * REDEMPTIONS_PAGE_SIZE
                const visible = list.slice(start, start + REDEMPTIONS_PAGE_SIZE)
                return (
                  <>
                    <h2 style={{ marginTop: 32, marginBottom: 16 }}>Seus resgates</h2>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {visible.map((r) => (
                        <li key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                          {r.product_description} — {r.points_used} pts - {formatRedemptionDate(r.created_at)}
                        </li>
                      ))}
                    </ul>
                    {totalPages > 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setRedemptionsPage((p) => Math.max(1, p - 1))}
                          style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            cursor: page <= 1 ? "not-allowed" : "pointer",
                            opacity: page <= 1 ? 0.6 : 1,
                          }}
                        >
                          Anterior
                        </button>
                        <span style={{ fontSize: 14, color: "#555" }}>
                          Página {page} de {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setRedemptionsPage((p) => Math.min(totalPages, p + 1))}
                          style={{
                            padding: "8px 16px",
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            cursor: page >= totalPages ? "not-allowed" : "pointer",
                            opacity: page >= totalPages ? 0.6 : 1,
                          }}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}

          {data && !data.customer && cpfParam && !loading && (
            <p style={{ color: "#856404", backgroundColor: "#fff3cd", padding: 12, borderRadius: 6 }}>
              CPF não encontrado. Verifique o número ou cadastre-se no estabelecimento.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
