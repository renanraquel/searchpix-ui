import { Link } from "react-router-dom"
import { PRICING_PLAN_IDS, WHATSAPP_LINK, WHATSAPP_PHONE_DISPLAY } from "../constants/pricingPublic"

const PLAN = PRICING_PLAN_IDS.fidelizacaoTrial49
const followupPath = () => `/precos/como-comecar?plano=${encodeURIComponent(PLAN)}`

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
  return (
    <div className="pricing-page">
      <header className="pricing-header border-bottom">
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/precos" className="app-brand-text-link text-decoration-none">
            <span className="app-brand-text pricing-header__brand">RR Solutions</span>
          </Link>
          <nav className="d-flex align-items-center pricing-header__nav">
            <Link to="/precos" className="text-muted small font-weight-medium">
              Preços
            </Link>
            <Link to="/login" className="btn btn-sm btn-primary ml-3">
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="pricing-hero text-center py-5">
          <div className="container">
            <p className="text-uppercase text-muted small font-weight-bold mb-2 letter-spacing-1">
              SearchPix — Fidelização
            </p>
            <h1 className="display-4 font-weight-bold mb-3 pricing-hero__title">Preços</h1>
            <p className="lead text-muted mx-auto pricing-hero__lead">
              Fidelize clientes com pontos e resgates. Painel completo para sua equipe no varejo.
            </p>
            <p className="text-muted small mb-0 mt-4">
              Dúvidas e contato:{" "}
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="font-weight-bold text-primary"
              >
                WhatsApp {WHATSAPP_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </section>

        <section className="container pb-5">
          <p className="text-center text-muted small mb-4">
            Use <strong>Plano selecionado</strong> para seguir com o cadastro e os próximos passos.
          </p>
          <div className="row justify-content-center">
            <div className="col-lg-6 col-xl-5 mb-4">
              <div className="card pricing-card pricing-card--trial pricing-card--selectable pricing-card--selected h-100 shadow-sm">
                <div className="pricing-card__ribbon pricing-card__ribbon--trial">1 mês grátis</div>
                <div className="card-body p-4 p-md-5 d-flex flex-column">
                  <p className="text-muted small font-weight-bold text-uppercase mb-2">Promoção</p>
                  <h2 className="h3 font-weight-bold mb-1">Fidelização</h2>
                  <p className="text-muted mb-4">
                    Programa de pontos, clientes e resgates. O 1º mês é gratuito; em seguida, assinatura mensal.
                  </p>
                  <div className="mb-4">
                    <p className="mb-2 font-weight-bold text-success">1º mês free</p>
                    <p className="mb-0">
                      <span className="text-muted">Depois </span>
                      <span className="pricing-card__currency">R$</span>
                      <span className="pricing-card__amount">49,90</span>
                      <span className="text-muted"> / mês</span>
                    </p>
                  </div>
                  <ul className="list-unstyled flex-grow-1 mb-4 pricing-card__list">
                    <li>Cadastro de clientes e produtos</li>
                    <li>Lançamento e acompanhamento de pontos</li>
                    <li>Pesquisa e resgate de benefícios</li>
                    <li>Painel web para sua equipe</li>
                    <li>Atualizações do módulo de fidelização</li>
                  </ul>
                  <div className="pricing-card__once mb-4 p-3 rounded">
                    <p className="small text-muted font-weight-bold mb-2">Consulta de pagamentos por PIX</p>
                    <p className="text-muted small mb-0">
                      Para utilizar esse recurso, entre em contato com o{" "}
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-weight-bold">
                        suporte pelo WhatsApp
                      </a>{" "}
                      e alinhe condições e integração.
                    </p>
                  </div>
                  <Link to={followupPath()} className="btn btn-lg btn-block mt-auto btn-primary">
                    Plano selecionado
                  </Link>
                  <p className="text-muted small text-center mt-3 mb-0">
                    Condições comerciais podem ser confirmadas no contato.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pricing-faq py-5 bg-light">
          <div className="container">
            <h2 className="h3 font-weight-bold text-center mb-5">Perguntas frequentes</h2>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                {faqItems.map((item) => (
                  <div key={item.q} className="card border-0 shadow-sm mb-3">
                    <div className="card-body p-4">
                      <h3 className="h6 font-weight-bold mb-2">{item.q}</h3>
                      <p className="text-muted mb-0 small">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pricing-footer border-top py-4 mt-auto">
        <div className="container text-center text-muted small">
          <p className="mb-1">RR Solutions — SearchPix Fidelização</p>
          <p className="mb-2">
            Dúvidas e contato:{" "}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-primary">
              WhatsApp {WHATSAPP_PHONE_DISPLAY}
            </a>
          </p>
          <Link to="/login" className="text-primary">
            Acesso ao painel
          </Link>
        </div>
      </footer>
    </div>
  )
}
