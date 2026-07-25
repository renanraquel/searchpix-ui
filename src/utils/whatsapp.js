/**
 * Monta o link do WhatsApp com a mensagem já preenchida.
 * Sem telefone, abre o seletor de contatos do WhatsApp.
 */
export function buildWhatsAppUrl(phone, message) {
  const text = encodeURIComponent(message || "")
  const digits = String(phone || "").replace(/\D/g, "")
  if (!digits) return `https://wa.me/?text=${text}`
  // Números brasileiros são gravados sem DDI; wa.me exige o código do país.
  const withCountry = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${withCountry}?text=${text}`
}

export function openWhatsApp(phone, message) {
  window.open(buildWhatsAppUrl(phone, message), "_blank", "noopener,noreferrer")
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
