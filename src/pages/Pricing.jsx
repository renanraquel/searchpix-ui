import { useState } from "react"
import { Link } from "react-router-dom"

const PLANS = {
  fidelizacao: "fidelizacao",
  fidelizacaoPix: "fidelizacao-pix",
}

const faqItems = [
  {
    q: "O que está incluído no plano de fidelização?",
    a: "Cadastro de clientes e produtos, lançamento de pontos, pesquisa e resgate de benefícios, e acesso ao painel administrativo — tudo por assinatura mensal.",
  },
  {
    q: "Como funciona o módulo de consulta PIX?",
    a: "É um complemento opcional. Após a taxa única de integração (R$ 500), o módulo é liberado na sua conta para uso junto com a assinatura mensal de fidelização.",
  },
  {
    q: "Posso usar só o PIX sem o plano de fidelização?",
    a: "Não. O módulo PIX é oferecido como extensão do sistema de fidelização, que permanece com assinatura mensal.",
  },
  {
    q: "Como faço para assinar?",
    a: "Entre em contato ou utilize o fluxo de cadastro quando estiver disponível. Os botões abaixo podem ser ligados ao seu gateway de pagamento ou WhatsApp.",
  },
]

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(PLANS.fidelizacaoPix)

  function planKeyDown(e, plan) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setSelectedPlan(plan)
    }
  }

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
              Planos pensados para o varejo: fidelize clientes com pontos e resgates. Amplie com consulta e fluxo PIX
              quando precisar.
            </p>
          </div>
        </section>

        <section className="container pb-5">
          <p className="text-center text-muted small mb-4">
            Clique em um plano para selecionar. O botão destaca o plano ativo.
          </p>
          <div className="row justify-content-center" role="radiogroup" aria-label="Escolha um plano">
            <div className="col-lg-5 mb-4 mb-lg-0">
              <div
                className={`card pricing-card pricing-card--selectable h-100 shadow-sm ${
                  selectedPlan === PLANS.fidelizacao ? "pricing-card--selected" : ""
                }`}
                role="radio"
                aria-checked={selectedPlan === PLANS.fidelizacao}
                tabIndex={0}
                onClick={() => setSelectedPlan(PLANS.fidelizacao)}
                onKeyDown={(e) => planKeyDown(e, PLANS.fidelizacao)}
              >
                <div className="card-body p-4 p-md-5 d-flex flex-column">
                  <p className="text-muted small font-weight-bold text-uppercase mb-2">Plano essencial</p>
                  <h2 className="h3 font-weight-bold mb-1">Fidelização</h2>
                  <p className="text-muted mb-4">Programa de pontos, clientes e resgates — sem módulo PIX.</p>
                  <div className="mb-4">
                    <span className="pricing-card__currency">R$</span>
                    <span className="pricing-card__amount">29,90</span>
                    <span className="text-muted"> / mês</span>
                  </div>
                  <ul className="list-unstyled flex-grow-1 mb-4 pricing-card__list">
                    <li>Cadastro de clientes e produtos</li>
                    <li>Lançamento e acompanhamento de pontos</li>
                    <li>Pesquisa e resgate de benefícios</li>
                    <li>Painel web para sua equipe</li>
                    <li>Atualizações do módulo de fidelização</li>
                  </ul>
                  <span
                    className={`btn btn-lg btn-block mt-auto ${
                      selectedPlan === PLANS.fidelizacao ? "btn-primary" : "btn-outline-primary"
                    }`}
                  >
                    {selectedPlan === PLANS.fidelizacao ? "Plano selecionado" : "Selecionar este plano"}
                  </span>
                  <p className="text-muted small text-center mt-3 mb-0">
                    Integração com pagamento será configurada em seguida.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div
                className={`card pricing-card pricing-card--pix pricing-card--selectable h-100 shadow-sm ${
                  selectedPlan === PLANS.fidelizacaoPix ? "pricing-card--selected" : ""
                }`}
                role="radio"
                aria-checked={selectedPlan === PLANS.fidelizacaoPix}
                tabIndex={0}
                onClick={() => setSelectedPlan(PLANS.fidelizacaoPix)}
                onKeyDown={(e) => planKeyDown(e, PLANS.fidelizacaoPix)}
              >
                <div className="pricing-card__ribbon">Inclui PIX</div>
                <div className="card-body p-4 p-md-5 d-flex flex-column">
                  <p className="text-muted small font-weight-bold text-uppercase mb-2">Plano completo</p>
                  <h2 className="h3 font-weight-bold mb-1">Fidelização + PIX</h2>
                  <p className="text-muted mb-4">
                    Tudo do plano Fidelização, mais consulta e recursos PIX após a integração.
                  </p>
                  <div className="mb-3">
                    <span className="pricing-card__currency">R$</span>
                    <span className="pricing-card__amount">29,90</span>
                    <span className="text-muted"> / mês</span>
                  </div>
                  <div className="pricing-card__once mb-4">
                    <span className="badge badge-pill pricing-card__badge">Taxa única de integração</span>
                    <div className="mt-2">
                      <span className="pricing-card__currency pricing-card__currency--sm">R$</span>
                      <span className="pricing-card__amount pricing-card__amount--sm">500</span>
                      <span className="text-muted"> pagamento único para liberar o módulo PIX</span>
                    </div>
                  </div>
                  <ul className="list-unstyled flex-grow-1 mb-4 pricing-card__list">
                    <li>
                      <strong>Tudo</strong> do plano Fidelização
                    </li>
                    <li>Integração e liberação do módulo de consulta PIX</li>
                    <li>Suporte na configuração inicial da integração</li>
                    <li>Mesma assinatura mensal após a taxa de setup</li>
                  </ul>
                  <span
                    className={`btn btn-lg btn-block mt-auto ${
                      selectedPlan === PLANS.fidelizacaoPix ? "btn-primary" : "btn-outline-primary"
                    }`}
                  >
                    {selectedPlan === PLANS.fidelizacaoPix ? "Plano selecionado" : "Selecionar este plano"}
                  </span>
                  <p className="text-muted small text-center mt-3 mb-0">
                    Os valores podem ser ajustados antes do go-live.
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
          <Link to="/login" className="text-primary">
            Acesso ao painel
          </Link>
        </div>
      </footer>
    </div>
  )
}
