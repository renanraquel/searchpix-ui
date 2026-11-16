import { useState, useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Gift, Lock, Sparkles, Star, ChevronLeft, ChevronRight, Coins } from "lucide-react"
import { apiUrl, mediaSrc } from "../api"
import "../styles/tailwind-pontos-nota.css"

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

function titleCaseFromSlug(slug) {
  if (!slug) return ""
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ")
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

  const backgroundUrl = data?.tenant?.background_image_url ? mediaSrc(data.tenant.background_image_url) : null
  const storeName = (data?.tenant?.name || "").trim() || titleCaseFromSlug(tenantSlug) || "Programa de fidelidade"

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
  const balance = Number(data?.customer?.points_balance ?? 0)

  const redemptionProgress = useMemo(() => {
    const keys = groupedProducts.pointKeys
    if (!data?.customer || keys.length === 0) return null
    const nextTarget = keys.find((k) => balance < k)
    if (nextTarget == null) {
      return {
        percent: 100,
        nextTarget: null,
        remaining: 0,
        caption: "Você já pode resgatar em todos os níveis disponíveis.",
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
  }, [data?.customer, groupedProducts.pointKeys, balance])

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

  const shellStyle = backgroundUrl
    ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : undefined

  if (!tenantSlug) {
    return (
      <div id="resgatar-root" className="min-h-screen">
        <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 text-center shadow-soft-lg backdrop-blur-md motion-safe:animate-fade-in-up">
            <Gift className="mx-auto mb-4 h-10 w-10 text-emerald-600" strokeWidth={1.5} aria-hidden />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Resgate de prêmios</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Use o link do estabelecimento. Ex.:{" "}
              <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">/resgatar?tenant=slug-da-loja</code>
            </p>
            <Link
              to="/cadastro"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
            >
              Ir para cadastro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeProducts = groupedProducts.groups.get(activePtsSafe) || []
  const hubPath = `/pontos-nota?tenant=${encodeURIComponent(tenantSlug)}`

  return (
    <div id="resgatar-root" className="min-h-screen">
      <div
        className={`relative min-h-screen overflow-x-hidden ${
          backgroundUrl ? "bg-slate-950" : "bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
        }`}
        style={shellStyle}
      >
        {backgroundUrl ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/70" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-slate-950/50 to-slate-950/90"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(16,185,129,0.28),transparent)]"
            aria-hidden
          />
        )}

        <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-4 pb-10 pt-6 sm:px-5">
          <header className="mb-6 text-center motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Clube de prêmios
            </p>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.45)] sm:text-3xl">
              {storeName}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80">Troque seus pontos por recompensas</p>
          </header>

          {!data?.customer && (
            <form
              onSubmit={handleCpfSubmit}
              className="mb-5 rounded-3xl border border-white/15 bg-white/95 p-5 shadow-soft-lg backdrop-blur-md motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 [animation-delay:0.05s]"
            >
              <label htmlFor="public-cpf" className="mb-2 block text-sm font-semibold text-slate-800">
                Digite seu CPF para ver seus pontos
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="public-cpf"
                  type="text"
                  inputMode="numeric"
                  className="w-full flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Carregando..." : "Acessar"}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </div>
          )}

          {loading && !data && (
            <p className="py-10 text-center text-sm font-medium text-white/80">Carregando seus prêmios...</p>
          )}

          {data?.customer && (
            <>
              {/* Carteira de pontos — estilo app de fidelidade */}
              <section
                className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-soft-lg motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 [animation-delay:0.05s]"
                aria-label="Saldo de pontos"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/90">Olá</p>
                    <p className="mt-0.5 truncate text-lg font-bold leading-snug">{data.customer.name}</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Coins className="h-6 w-6 text-amber-300" aria-hidden />
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-extrabold leading-none tracking-tight tabular-nums sm:text-6xl">
                    {balance}
                  </span>
                  <span className="mb-1.5 text-base font-semibold text-emerald-100">pontos</span>
                </div>

                {redemptionProgress ? (
                  <div className="mt-5">
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-black/25"
                      role="progressbar"
                      aria-valuenow={Math.round(redemptionProgress.percent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Progresso até o próximo nível de resgate"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-[width] duration-500 ease-out"
                        style={{ width: `${redemptionProgress.percent}%` }}
                      />
                    </div>
                    <p className="mt-2.5 text-sm font-medium leading-snug text-emerald-50/95">
                      {redemptionProgress.caption}
                    </p>
                  </div>
                ) : null}
              </section>

              {/* Catálogo de recompensas */}
              <section
                className="mb-5 motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 [animation-delay:0.12s]"
                aria-labelledby="premios-titulo"
              >
                <div className="mb-3 flex items-center gap-2 px-0.5">
                  <Gift className="h-5 w-5 text-emerald-300" aria-hidden />
                  <h2 id="premios-titulo" className="text-lg font-bold text-white">
                    Recompensas
                  </h2>
                </div>

                {!data.products || data.products.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/95 px-5 py-8 text-center shadow-soft backdrop-blur-md">
                    <p className="text-sm font-medium text-slate-600">Nenhum prêmio disponível no momento.</p>
                  </div>
                ) : (
                  <>
                    <div
                      className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      role="tablist"
                      aria-label="Níveis de pontos"
                    >
                      {groupedProducts.pointKeys.map((pts) => {
                        const active = activePtsSafe === pts
                        const affordable = balance >= pts
                        return (
                          <button
                            key={pts}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setActivePoints(pts)}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                              active
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-900/40"
                                : "border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20"
                            }`}
                          >
                            {affordable ? <Star className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5 opacity-70" aria-hidden />}
                            {pts} pts
                          </button>
                        )
                      })}
                    </div>

                    <div className="flex flex-col gap-3">
                      {activeProducts.map((p) => {
                        const need = Number(p.points_required ?? 0)
                        const canRedeem = balance >= need
                        const missing = Math.max(0, need - balance)
                        return (
                          <article
                            key={p.id}
                            className={`overflow-hidden rounded-3xl border bg-white shadow-soft transition ${
                              canRedeem
                                ? "border-emerald-200/80 ring-1 ring-emerald-500/20"
                                : "border-white/40 opacity-95"
                            }`}
                          >
                            <div className="flex gap-0">
                              <div className="relative h-28 w-28 shrink-0 bg-slate-100 sm:h-32 sm:w-32">
                                {p.image_url ? (
                                  <img
                                    loading="lazy"
                                    src={mediaSrc(p.image_url)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                                    <Gift className="h-10 w-10 text-emerald-400" aria-hidden />
                                  </div>
                                )}
                                {!canRedeem && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/45">
                                    <Lock className="h-7 w-7 text-white" aria-hidden />
                                  </div>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
                                <p className="text-sm font-bold leading-snug text-slate-900 sm:text-base">
                                  {p.description}
                                </p>
                                <p className="mt-1.5 inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                  {need} pontos
                                </p>
                                <p
                                  className={`mt-2 text-xs font-semibold ${
                                    canRedeem ? "text-emerald-700" : "text-slate-500"
                                  }`}
                                >
                                  {canRedeem ? "Disponível para resgate na loja" : `Faltam ${missing} pts`}
                                </p>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </>
                )}
              </section>

              {/* Histórico */}
              {data.redemptions?.length > 0 &&
                (() => {
                  const list = data.redemptions
                  const total = list.length
                  const totalPages = Math.ceil(total / REDEMPTIONS_PAGE_SIZE) || 1
                  const page = Math.min(Math.max(1, redemptionsPage), totalPages)
                  const start = (page - 1) * REDEMPTIONS_PAGE_SIZE
                  const visible = list.slice(start, start + REDEMPTIONS_PAGE_SIZE)
                  return (
                    <section
                      className="mb-5 rounded-3xl border border-white/10 bg-white/95 p-4 shadow-soft backdrop-blur-md motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 [animation-delay:0.18s]"
                      aria-labelledby="historico-titulo"
                    >
                      <h2 id="historico-titulo" className="mb-3 text-base font-bold text-slate-900">
                        Seus resgates
                      </h2>
                      <ul className="divide-y divide-slate-100">
                        {visible.map((r) => (
                          <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{r.product_description}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{formatRedemptionDate(r.created_at)}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              −{r.points_used} pts
                            </span>
                          </li>
                        ))}
                      </ul>
                      {totalPages > 1 && (
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                            disabled={page <= 1}
                            onClick={() => setRedemptionsPage((p) => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                            Anterior
                          </button>
                          <span className="text-xs font-medium text-slate-500">
                            {page} / {totalPages}
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                            disabled={page >= totalPages}
                            onClick={() => setRedemptionsPage((p) => Math.min(totalPages, p + 1))}
                          >
                            Próxima
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      )}
                    </section>
                  )
                })()}
            </>
          )}

          {data && !data.customer && cpfParam && !loading && (
            <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-center shadow-soft">
              <p className="text-sm font-medium text-amber-950">
                CPF não encontrado. Verifique o número ou cadastre-se no programa.
              </p>
              <Link
                to={`/cadastro?tenant=${encodeURIComponent(tenantSlug)}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border-2 border-emerald-600 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                Quero me cadastrar
              </Link>
            </div>
          )}

          <footer className="mt-auto pt-2">
            <Link
              to={hubPath}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500"
            >
              Voltar
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
