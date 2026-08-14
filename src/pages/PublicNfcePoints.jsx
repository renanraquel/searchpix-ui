import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { User, Receipt, Gift, Sparkles } from "lucide-react"
import { apiUrl, trackPublicPageVisit, mediaSrc } from "../api"
import LoyaltyStepCard from "../components/pontos-nota/LoyaltyStepCard"
import "../styles/tailwind-pontos-nota.css"

const BENEFITS = [
  { emoji: "💰", text: "A cada real gasto, você ganha pontos" },
  { emoji: "🎯", text: "Quanto mais comprar, mais acumula" },
  { emoji: "🔥", text: "Sem custo para participar" },
]

/** Ex.: ibimassas → Ibimassas; padaria-do-ze → Padaria Do Ze */
function titleCaseFromSlug(slug) {
  if (!slug) return ""
  return slug
    .split(/[-_]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ")
}

export default function PublicNfcePoints() {
  const [searchParams] = useSearchParams()
  const tenantSlug = searchParams.get("tenant") || ""
  const [tenantBranding, setTenantBranding] = useState({ slug: null, name: "", backgroundUrl: null })

  const cadastroPath = tenantSlug ? `/cadastro?tenant=${encodeURIComponent(tenantSlug)}` : "/cadastro"
  const resgatarPath = tenantSlug ? `/resgatar?tenant=${encodeURIComponent(tenantSlug)}` : "/resgatar"
  const enviarNotaPath = tenantSlug ? `/pontos-nota/enviar?tenant=${encodeURIComponent(tenantSlug)}` : "/pontos-nota/enviar"

  useEffect(() => {
    trackPublicPageVisit({
      pageKey: "pontos-nota",
      pagePath: "/pontos-nota",
      query: typeof window !== "undefined" ? window.location.search : "",
      tenantSlug,
    })
  }, [tenantSlug])

  useEffect(() => {
    if (!tenantSlug) return
    let cancelled = false
    async function loadTenantBranding() {
      try {
        const res = await fetch(`${apiUrl("/api/public/redemption")}?tenant=${encodeURIComponent(tenantSlug)}`)
        if (!res.ok) {
          if (!cancelled) setTenantBranding({ slug: tenantSlug, name: "", backgroundUrl: null })
          return
        }
        const data = await res.json()
        if (cancelled) return
        const bg = data?.tenant?.background_image_url
        const name = (data?.tenant?.name || "").trim()
        setTenantBranding({
          slug: tenantSlug,
          name,
          backgroundUrl: bg ? mediaSrc(bg) : null,
        })
      } catch {
        if (!cancelled) setTenantBranding({ slug: tenantSlug, name: "", backgroundUrl: null })
      }
    }
    loadTenantBranding()
    return () => {
      cancelled = true
    }
  }, [tenantSlug])

  const brandingForSlug = tenantBranding.slug === tenantSlug ? tenantBranding : null
  const displayBackgroundUrl = tenantSlug && brandingForSlug ? brandingForSlug.backgroundUrl : null
  const loyaltyTenantLabel = (brandingForSlug?.name && brandingForSlug.name) || titleCaseFromSlug(tenantSlug)
  const loyaltyBadgeText = loyaltyTenantLabel ? `Fidelidade ${loyaltyTenantLabel}` : "Fidelidade"

  const shellStyle =
    displayBackgroundUrl && tenantSlug
      ? {
          backgroundImage: `url(${displayBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : undefined

  if (!tenantSlug) {
    return (
      <div id="pontos-nota-root" className="min-h-screen">
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-100/60">
          {displayBackgroundUrl ? <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" aria-hidden /> : null}
          <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
            <div className="rounded-2xl border border-white/60 bg-white/90 p-8 shadow-soft-lg backdrop-blur-md motion-safe:animate-fade-in-up">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-indigo-600" strokeWidth={1.5} aria-hidden />
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Programa de fidelidade</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Use o link do estabelecimento. Ex.:{" "}
                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">/pontos-nota?tenant=slug-da-loja</code>
              </p>
              <Link
                to="/cadastro"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 hover:shadow-lg"
              >
                Ir para cadastro
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="pontos-nota-root" className="min-h-screen">
      <div
        className={`relative min-h-screen overflow-x-hidden ${
          displayBackgroundUrl
            ? "bg-slate-900"
            : "bg-slate-200 bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100/90"
        }`}
        style={shellStyle}
      >
        {displayBackgroundUrl ? (
          <>
            {/* Camadas fixas: leitura estável mesmo com foto clara ou branca */}
            <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/25 to-slate-950/55 backdrop-blur-[0.5px]"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]"
            aria-hidden
          />
        )}

        <div
          className={`relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14 ${
            displayBackgroundUrl ? "text-white" : "text-slate-900"
          }`}
        >
          <header className="mx-auto max-w-3xl text-center motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100">
            <p
              className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${
                displayBackgroundUrl
                  ? "border border-white/35 bg-black/35 text-white shadow-sm backdrop-blur-md"
                  : "border-2 border-slate-300 bg-white text-slate-800 shadow-md backdrop-blur-sm"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden />
              <span>{loyaltyBadgeText}</span>
            </p>
            <h1
              className={`text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] ${
                displayBackgroundUrl ? "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]" : "text-slate-900"
              }`}
            >
              Ganhe pontos e troque por prêmios 🎁
            </h1>
            <p
              className={`mx-auto mt-4 max-w-xl text-pretty text-base font-medium sm:text-lg ${
                displayBackgroundUrl ? "text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]" : "text-slate-700"
              }`}
            >
              É simples, rápido e gratuito
            </p>
          </header>

          <section className="mt-16 lg:mt-20" aria-labelledby="passos-titulo">
            <h2 id="passos-titulo" className="sr-only">
              Como funciona em três passos
            </h2>
            <div
              className={`grid gap-6 md:grid-cols-3 md:gap-8 ${
                displayBackgroundUrl
                  ? "[&>article]:shadow-2xl [&>article]:shadow-black/50 [&>article]:ring-1 [&>article]:ring-white/25"
                  : "[&>article]:shadow-xl [&>article]:ring-2 [&>article]:ring-slate-400/90 [&>article]:border-slate-400"
              }`}
            >
              <LoyaltyStepCard
                icon={User}
                title="Cadastre-se"
                description="Crie sua conta em menos de 1 minuto"
                to={cadastroPath}
                label="Criar conta"
                buttonVariant="slate"
                className="[animation-delay:0.05s]"
              />
              <LoyaltyStepCard
                icon={Receipt}
                title="Envie sua nota fiscal"
                description="Ganhe pontos a cada compra realizada"
                to={enviarNotaPath}
                label="Cadastrar nota"
                buttonVariant="indigo"
                className="[animation-delay:0.15s]"
              />
              <LoyaltyStepCard
                icon={Gift}
                title="Resgate prêmios"
                description="Troque seus pontos por produtos incríveis"
                to={resgatarPath}
                label="Ver prêmios"
                buttonVariant="emerald"
                className="[animation-delay:0.25s]"
              />
            </div>
          </section>

          <section className="mt-16 lg:mt-20" aria-label="Vantagens do programa">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.text}
                  className={`flex items-start gap-3 rounded-2xl p-5 shadow-soft backdrop-blur-md transition duration-300 hover:shadow-soft-lg motion-safe:opacity-0 motion-safe:animate-fade-in-up motion-reduce:opacity-100 ${
                    i === 0 ? "[animation-delay:0.1s]" : i === 1 ? "[animation-delay:0.2s]" : "[animation-delay:0.3s]"
                  } ${
                    displayBackgroundUrl
                      ? "border border-white/30 bg-black/30 text-white shadow-lg shadow-black/20 backdrop-blur-sm hover:border-white/45 hover:bg-black/35"
                      : "border-2 border-slate-300 bg-white text-slate-900 shadow-md hover:border-indigo-300/90 hover:shadow-lg"
                  }`}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {b.emoji}
                  </span>
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      displayBackgroundUrl ? "text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]" : "text-slate-800"
                    }`}
                  >
                    {b.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <footer
            className={`mt-16 border-t pt-10 text-center lg:mt-20 ${
              displayBackgroundUrl ? "border-white/25" : "border-slate-400/60"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                displayBackgroundUrl ? "text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.35)]" : "text-slate-600"
              }`}
            >
              Dúvidas? Fale com a loja
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
