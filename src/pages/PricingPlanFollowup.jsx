import { Link, useSearchParams } from "react-router-dom"
import { UserPlus, LogIn, Megaphone, Sparkles, ArrowLeft } from "lucide-react"
import LoyaltyStepCard from "../components/pontos-nota/LoyaltyStepCard"
import "../styles/tailwind-pontos-nota.css"
import { PRICING_PLAN_IDS, WHATSAPP_LINK, WHATSAPP_PHONE_DISPLAY, planLabel } from "../constants/pricingPublic"

export default function PricingPlanFollowup() {
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get("plano") || ""
  const planId = Object.values(PRICING_PLAN_IDS).includes(planParam)
    ? planParam
    : PRICING_PLAN_IDS.fidelizacaoPix

  const planQuery = `plano=${encodeURIComponent(planId)}`
  const cadastroLojistaPath = `/precos/cadastro-lojista?${planQuery}`

  return (
    <div id="pricing-onboarding-root" className="min-h-screen">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-100">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(148,163,184,0.35),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
          <nav className="mb-8 motion-safe:animate-fade-in-up">
            <Link
              to={`/precos?${planQuery}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4 text-slate-900" strokeWidth={2.5} aria-hidden />
              Voltar aos preços
            </Link>
          </nav>

          <header className="mx-auto max-w-3xl text-center motion-safe:animate-fade-in-up">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm sm:text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_0_2px_rgba(79,70,229,0.25)]" aria-hidden />
              <span>Plano: {planLabel(planId)}</span>
            </p>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Comece a usar o SearchPix
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base font-medium text-slate-800 sm:text-lg">
              Três passos: criar seu usuário e loja, entrar no painel e divulgar o programa para seus clientes.
            </p>
          </header>

          {planId === PRICING_PLAN_IDS.fidelizacaoPix && (
            <div
              className="mx-auto mt-10 max-w-3xl rounded-2xl border-2 border-emerald-300 bg-emerald-100 p-5 text-center text-sm font-medium text-emerald-950 shadow-sm"
              role="status"
            >
              <strong className="font-semibold">Plano com PIX:</strong> após o fechamento, há taxa única de{" "}
              <strong>R$ 499</strong> para liberação do módulo, além da mensalidade.
            </div>
          )}

          <section className="mt-14 lg:mt-16" aria-labelledby="tres-passos">
            <h2 id="tres-passos" className="sr-only">
              Três passos
            </h2>
            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              <LoyaltyStepCard
                icon={UserPlus}
                title="Criar usuário"
                description="Cadastre sua loja no sistema: nome, CPF, login, senha, identificador da loja e celular. Em poucos minutos você recebe acesso ao painel."
                to={cadastroLojistaPath}
                label="Ir para o cadastro"
                buttonVariant="indigo"
                className="[animation-delay:0.06s]"
              />
              <LoyaltyStepCard
                icon={LogIn}
                title="Logar no sistema"
                description="Use o login e a senha que você definiu no cadastro para acessar o painel da fidelização."
                to="/login"
                label="Abrir tela de login"
                buttonVariant="slate"
                className="[animation-delay:0.14s]"
              />
              <LoyaltyStepCard
                icon={Megaphone}
                title="Divulgar meu programa de fidelização"
                description="Em breve: orientações e materiais para compartilhar com seus clientes (links, QR Code e boas práticas)."
                href="#divulgar-programa"
                label="Ver mais (em breve)"
                buttonVariant="emerald"
                className="[animation-delay:0.22s]"
              />
            </div>
          </section>

          <section
            id="divulgar-programa"
            className="mt-16 scroll-mt-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center shadow-md lg:mt-20"
          >
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-indigo-600" strokeWidth={1.5} aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Divulgação do programa</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-slate-700">
              Estamos preparando esta área com exemplos de mensagens, links públicos e sugestões de divulgação. Volte em
              breve ou fale conosco pelo WhatsApp.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-500"
            >
              WhatsApp {WHATSAPP_PHONE_DISPLAY}
            </a>
          </section>

          <footer className="mt-16 border-t-2 border-slate-300 pt-10 text-center lg:mt-20">
            <p className="text-sm font-medium text-slate-800">
              Dúvidas?{" "}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-950"
              >
                WhatsApp {WHATSAPP_PHONE_DISPLAY}
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
