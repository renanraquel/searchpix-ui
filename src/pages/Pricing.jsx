import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Building2, Coins, Gift, CheckCircle2 } from "lucide-react"
import { PRICING_PLAN_IDS, WHATSAPP_LINK, WHATSAPP_PHONE_DISPLAY } from "../constants/pricingPublic"
import { trackPublicPageVisit } from "../api"
import "../styles/tailwind-pontos-nota.css"

const PLAN = PRICING_PLAN_IDS.fidelizacaoTrial49
const followupPath = () => `/precos/como-comecar?plano=${encodeURIComponent(PLAN)}`

const howItWorks = [
  {
    icon: Building2,
    t: "1. Cadastre sua loja em minutos",
    d: "Preencha um cadastro simples, confirme o e-mail e entre no painel.",
  },
  {
    icon: Coins,
    t: "2. Lance pontos no atendimento",
    d: "Com poucos cliques, você registra pontos e acompanha o saldo dos clientes.",
  },
  {
    icon: Gift,
    t: "3. Resgate e recompra",
    d: "O cliente troca pontos por benefícios e volta a comprar com mais frequência.",
  },
]

const highlights = [
  "Sem implantação cara e sem projeto complexo",
  "Uso simples para equipe de balcão e caixa",
  "Começa a usar no mesmo dia após o cadastro",
  "Painel web direto ao ponto: clientes, pontos e resgates",
]

const faqItems = [
  {
    q: "O que está incluído no plano de fidelização?",
    a: "Cadastro de clientes e produtos, lançamento de pontos, pesquisa e resgate de benefícios, e acesso ao painel administrativo — tudo por assinatura mensal.",
  },
  {
    q: "Como funciona o módulo de consulta PIX?",
    a: "A consulta de pagamentos por PIX é um recurso opcional, contratado à parte. Para utilizar, entre em contato com o suporte (WhatsApp) e combine condições e integração.",
  },
  {
    q: "Posso usar só o PIX sem o plano de fidelização?",
    a: "O foco do SearchPix Fidelização é o programa de pontos; recursos de PIX, quando disponíveis, são tratados com o suporte em conjunto com a sua assinatura.",
  },
  {
    q: "Como faço para assinar?",
    a: "Use os próximos passos após selecionar o plano, cadastre-se ou fale conosco pelo WhatsApp.",
  },
]

export default function Pricing() {
  useEffect(() => {
    trackPublicPageVisit({
      pageKey: "precos",
      pagePath: "/precos",
      query: typeof window !== "undefined" ? window.location.search : "",
    })
  }, [])

  return (
    <div id="pricing-onboarding-root" className="min-h-screen">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-100">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(148,163,184,0.35),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
          <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
            <Link to="/precos" className="app-brand-text-link text-decoration-none">
              <span className="app-brand-text pricing-header__brand">RR Solutions</span>
            </Link>
            <Link to="/login" className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              Entrar
            </Link>
          </header>

          <section className="mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_0_2px_rgba(79,70,229,0.25)]" aria-hidden />
              SearchPix - Fidelizacao
            </p>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Programa de fidelidade simples para sua loja vender mais
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base font-medium text-slate-800 sm:text-lg">
              Diferente de plataformas caras e complexas, voce faz um cadastro rapido e ja comeca a usar no mesmo dia.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to={followupPath()}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
              >
                Comecar agora
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
              >
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">
              Duvidas e contato:{" "}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-950"
              >
                WhatsApp {WHATSAPP_PHONE_DISPLAY}
              </a>
            </p>
          </section>

          <section id="como-funciona" className="mt-14 lg:mt-16">
            <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Como funciona na pratica</h2>
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {howItWorks.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.t} className="rounded-2xl border-2 border-slate-300 bg-white p-5 shadow-md">
                    <Icon className="mb-3 h-8 w-8 text-indigo-600" strokeWidth={1.8} aria-hidden />
                    <h3 className="text-base font-bold text-slate-900">{item.t}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-700">{item.d}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-10">
            <div className="mx-auto max-w-3xl rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-slate-900">Por que o SearchPix e mais simples</h2>
              <ul className="mt-4 space-y-2">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" strokeWidth={2.4} aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-12">
            <div className="mx-auto max-w-xl rounded-2xl border-2 border-indigo-300 bg-white p-6 shadow-lg sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Promocao</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Fidelizacao</h2>
              <p className="mt-2 text-sm font-medium text-slate-700">
                Programa de pontos, clientes e resgates com inicio rapido.
              </p>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="mb-1 text-sm font-bold text-emerald-900">1 mes gratis</p>
                <p className="text-slate-800">
                  <span className="text-sm">Depois </span>
                  <span className="text-2xl font-bold">R$49,90</span>
                  <span className="text-sm"> / mes</span>
                </p>
              </div>

              <ul className="mt-5 space-y-2 text-sm font-medium text-slate-800">
                <li>Cadastro de clientes e produtos</li>
                <li>Lancamento e acompanhamento de pontos</li>
                <li>Pesquisa e resgate de beneficios</li>
                <li>Painel web para sua equipe</li>
                <li>Atualizacoes do modulo de fidelizacao</li>
              </ul>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Consulta de pagamentos por PIX</p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Para usar esse recurso, fale com o{" "}
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-700 underline">
                    suporte pelo WhatsApp
                  </a>{" "}
                  para alinhar integracao e condicoes.
                </p>
              </div>

              <Link
                to={followupPath()}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
              >
                Plano selecionado
              </Link>
              <p className="mt-3 text-center text-xs font-medium text-slate-600">Condicoes comerciais podem ser confirmadas no contato.</p>
            </div>
          </section>

          <section className="mt-14 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-center text-2xl font-bold text-slate-900">Perguntas frequentes</h2>
            <div className="mx-auto mt-6 max-w-3xl space-y-3">
              {faqItems.map((item) => (
                <div key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-900">{item.q}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-700">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-12 border-t-2 border-slate-300 pt-8 text-center">
            <p className="text-sm font-medium text-slate-800">RR Solutions - SearchPix Fidelizacao</p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Duvidas e contato:{" "}
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-800 underline">
                WhatsApp {WHATSAPP_PHONE_DISPLAY}
              </a>
            </p>
            <Link to="/login" className="mt-3 inline-block text-sm font-bold text-indigo-700 underline">
              Acesso ao painel
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
