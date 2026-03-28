import { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { apiUrl } from "../api"
import { PublicProgramFooterBootstrap } from "../components/public/PublicProgramFooter"

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
  const [activePoints, setActivePoints] = useState(null)
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

  const backgroundUrl = data?.tenant?.background_image_url ? apiUrl(data.tenant.background_image_url) : null

  const groupedProducts = useMemo(() => {
    const products = data?.products || []
    const groups = new Map()
    for (const p of products) {
      const pts = Number(p.points_required ?? 0)
      const key = Number.isFinite(pts) ? pts : 0
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(p)
    }
    const pointKeys = Array.from(groups.keys()).sort((a, b) => a - b)
    return { pointKeys, groups }
  }, [data?.products])

  const activePtsSafe = activePoints ?? groupedProducts.pointKeys[0] ?? null

  /** Próximo degrau de pontos entre produtos; barra = saldo / próximo alvo. */
  const redemptionProgress = useMemo(() => {
    const keys = groupedProducts.pointKeys
    const balance = Number(data?.customer?.points_balance ?? 0)
    if (!data?.customer || keys.length === 0) return null
    const nextTarget = keys.find((k) => balance < k)
    if (nextTarget == null) {
      return {
        percent: 100,
        nextTarget: null,
        remaining: 0,
        caption: "Você já pode resgatar em todos os níveis de pontos disponíveis.",
      }
    }
    const pct = Math.min(100, Math.max(0, (balance / nextTarget) * 100))
    const remaining = Math.max(0, nextTarget - balance)
    return {
      percent: pct,
      nextTarget,
      remaining,
      caption:
        remaining === 0
          ? `Você atingiu ${nextTarget} pts — confira os prêmios deste nível.`
          : `Faltam ${remaining} pts para o nível de ${nextTarget} pontos`,
    }
  }, [data?.customer, groupedProducts.pointKeys])

  useEffect(() => {
    if (!data?.customer) return
    if (groupedProducts.pointKeys.length === 0) {
      setActivePoints(null)
      return
    }
    if (activePoints == null || !groupedProducts.pointKeys.includes(activePoints)) {
      setActivePoints(groupedProducts.pointKeys[0])
    }
  }, [data?.customer, groupedProducts.pointKeys.join(","), activePoints])

  if (!tenantSlug) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted mb-2">Acesso por link do estabelecimento. Ex.: /resgatar?tenant=slug-da-padaria</p>
        <p className="text-muted small mb-0">
          Primeiro acesso?{" "}
          <Link to="/cadastro" className="text-primary">
            Cadastro no programa de fidelidade
          </Link>{" "}
          (use o mesmo <code>tenant</code> no link).
        </p>
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
        className="d-flex justify-content-center align-items-start py-4 px-3"
        style={{
          minHeight: "100vh",
          backgroundColor: backgroundUrl ? "rgba(0,0,0,0.45)" : "transparent",
          boxSizing: "border-box",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          className="card shadow border-0 my-3"
          style={{
            width: "100%",
            maxWidth: 820,
            backgroundColor: "rgba(255,255,255,0.96)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-3 p-md-4">
            <h1 className="h3 mb-2">{data?.tenant?.name || "Carregando..."}</h1>
            <p className="text-muted mb-4">Resgate seus pontos</p>

            {!data?.customer && (
              <form onSubmit={handleCpfSubmit} className="mb-4">
                <div className="form-group">
                  <label htmlFor="public-cpf">Digite seu CPF para ver seus pontos e resgatar</label>
                  <div className="d-flex flex-wrap align-items-center">
                    <input
                      id="public-cpf"
                      type="text"
                      className="form-control mr-2 mb-2 mb-sm-0"
                      style={{ maxWidth: 220 }}
                      value={cpf}
                      onChange={(e) => setCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Carregando..." : "Acessar"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {error && (
              <div className="cp-alert cp-alert-danger" role="alert">
                {error}
              </div>
            )}

            {loading && !data && <p className="text-muted">Carregando...</p>}

            {data?.customer && (
              <>
                <div
                  className="card border-primary mb-4"
                  style={{ maxWidth: 480, boxSizing: "border-box", minWidth: 0, overflow: "hidden" }}
                >
                  <div className="card-body">
                    <div className="text-muted small font-weight-bold mb-1">Cliente</div>
                    <div
                      className="h5 font-weight-bold text-dark mb-3"
                      style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                    >
                      {data.customer.name}
                    </div>
                    <div className="text-muted small font-weight-bold mb-1">Seus pontos</div>
                    <div className="h3 font-weight-bold text-primary mb-3">
                      {data.customer.points_balance ?? 0}{" "}
                      <span className="h5 font-weight-bold">pts</span>
                    </div>
                    {redemptionProgress ? (
                      <div className="pt-1">
                        <div
                          className="progress rounded-pill"
                          style={{ height: "0.65rem" }}
                          role="progressbar"
                          aria-valuenow={Math.round(redemptionProgress.percent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Progresso até o próximo nível de resgate"
                        >
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${redemptionProgress.percent}%` }}
                          />
                        </div>
                        <p className="text-muted small mb-0 mt-2" style={{ lineHeight: 1.35 }}>
                          {redemptionProgress.caption}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <h2 className="h4 mb-3">Itens disponíveis para resgate</h2>
                {(!data.products || data.products.length === 0) ? (
                  <p className="text-muted">Nenhum item disponível para resgate no momento.</p>
                ) : (
                  <>
                    <ul className="nav nav-pills nav-fill mb-3" role="tablist">
                      {groupedProducts.pointKeys.map((pts) => (
                        <li key={pts} className="nav-item">
                          <button
                            type="button"
                            className={`nav-link${activePtsSafe === pts ? " active" : ""}`}
                            onClick={() => setActivePoints(pts)}
                          >
                            {pts} pontos
                          </button>
                        </li>
                      ))}
                    </ul>

                    <div className="d-flex flex-column">
                      {(groupedProducts.groups.get(activePtsSafe) || []).map((p) => (
                        <div key={p.id} className="card mb-2">
                          <div className="card-body d-flex flex-wrap align-items-center">
                            {p.image_url && (
                              <img
                                loading="lazy"
                                src={p.image_url.startsWith("http") ? p.image_url : apiUrl(p.image_url)}
                                alt=""
                                className="rounded mr-3 mb-2 mb-md-0"
                                style={{ width: 80, height: 80, objectFit: "cover" }}
                              />
                            )}
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <strong>{p.description}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {data.redemptions?.length > 0 &&
                  (() => {
                    const list = data.redemptions
                    const total = list.length
                    const totalPages = Math.ceil(total / REDEMPTIONS_PAGE_SIZE) || 1
                    const page = Math.min(Math.max(1, redemptionsPage), totalPages)
                    const start = (page - 1) * REDEMPTIONS_PAGE_SIZE
                    const visible = list.slice(start, start + REDEMPTIONS_PAGE_SIZE)
                    return (
                      <>
                        <h2 className="h4 mt-4 mb-3">Seus resgates</h2>
                        <ul className="list-group list-group-flush mb-3">
                          {visible.map((r) => (
                            <li key={r.id} className="list-group-item px-0">
                              {r.product_description} — {r.points_used} pts — {formatRedemptionDate(r.created_at)}
                            </li>
                          ))}
                        </ul>
                        {totalPages > 1 && (
                          <div className="d-flex align-items-center flex-wrap">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm mr-2"
                              disabled={page <= 1}
                              onClick={() => setRedemptionsPage((p) => Math.max(1, p - 1))}
                            >
                              Anterior
                            </button>
                            <span className="text-muted small mr-2">
                              Página {page} de {totalPages}
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              disabled={page >= totalPages}
                              onClick={() => setRedemptionsPage((p) => Math.min(totalPages, p + 1))}
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
              <div className="cp-alert cp-alert-warning mb-0">
                <span className="d-block mb-2">
                  CPF não encontrado. Verifique o número ou cadastre-se no programa de fidelidade.
                </span>
                <Link
                  to={`/cadastro?tenant=${encodeURIComponent(tenantSlug)}`}
                  className="btn btn-sm btn-outline-primary font-weight-bold"
                >
                  Quero me cadastrar
                </Link>
              </div>
            )}

            <PublicProgramFooterBootstrap tenantSlug={tenantSlug} />
          </div>
        </div>
      </div>
    </div>
  )
}
