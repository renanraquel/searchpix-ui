/**
 * Valida CPF brasileiro (11 dígitos e dígitos verificadores).
 * Rejeita sequências inválidas conhecidas (ex.: 111.111.111-11).
 */
export function isValidCpf(value) {
  const d = String(value ?? "").replace(/\D/g, "")
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(d[i], 10) * (10 - i)
  }
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== parseInt(d[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(d[i], 10) * (11 - i)
  }
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== parseInt(d[10], 10)) return false

  return true
}
