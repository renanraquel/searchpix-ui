export const PRICING_PLAN_IDS = {
  fidelizacaoTrial49: "fidelizacao-trial-49",
  fidelizacaoPix: "fidelizacao-pix",
}

export const WHATSAPP_PHONE_DISPLAY = "+55 (43) 98404-6364"
export const WHATSAPP_LINK = "https://wa.me/5543984046364"

export function planLabel(planId) {
  switch (planId) {
    case PRICING_PLAN_IDS.fidelizacaoPix:
      return "Fidelização + PIX"
    case PRICING_PLAN_IDS.fidelizacaoTrial49:
      return "Fidelização — promo (1º mês grátis)"
    default:
      return "SearchPix Fidelização"
  }
}

export function whatsappUrlWithPlan(planId) {
  const msg = `Olá! Tenho interesse no plano: ${planLabel(planId)}. Gostaria de seguir com o cadastro e acesso ao painel.`
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(msg)}`
}
