import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { apiUrl } from "../api"
import { isValidCpf } from "../utils/cpf"
import { PRICING_PLAN_IDS, WHATSAPP_LINK, WHATSAPP_PHONE_DISPLAY, planLabel } from "../constants/pricingPublic"
import "../styles/tailwind-pontos-nota.css"
import { ArrowLeft } from "lucide-react"

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function maskPhone(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  if (n.length === 0) return ""
  if (n.length <= 2) return `(${n}`
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

function slugifyHint(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

export default function MerchantSignup() {
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get("plano") || ""
  const planId = Object.values(PRICING_PLAN_IDS).includes(planParam)
    ? planParam
    : PRICING_PLAN_IDS.fidelizacaoPix
  const planQuery = `plano=${encodeURIComponent(planId)}`

  const [tenantName, setTenantName] = useState("")
  const [tenantSlug, setTenantSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [fullName, setFullName] = useState("")
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function onTenantNameChange(v) {
    setTenantName(v)
    if (!slugTouched) {
      setTenantSlug(slugifyHint(v))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    const cpfDigits = cpf.replace(/\D/g, "")
    const phoneDigits = phone.replace(/\D/g, "")
    if (!tenantName.trim() || !tenantSlug.trim() || !fullName.trim() || !email.trim() || !username.trim() || !password) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido.")
      return
    }
    if (!isValidCpf(cpfDigits)) {
      setError("Informe um CPF válido.")
      return
    }
    if (phoneDigits.length < 10) {
      setError("Informe o celular com DDD (10 ou 11 dígitos).")
      return
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl("/api/public/merchant-signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_name: tenantName.trim(),
          tenant_slug: tenantSlug.trim().toLowerCase(),
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          cpf: cpfDigits,
          phone: phoneDigits,
          email: email.trim().toLowerCase(),
        }),
      })
      if (res.status === 201) {
        setSuccess(true)
        return
      }
      const text = await res.text()
      setError(text || "Não foi possível concluir o cadastro.")
    } catch {
      setError("Erro de rede. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="pricing-onboarding-root" className="min-h-screen">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-100 py-10 px-4 sm:px-6">
        <div className="relative z-10 mx-auto max-w-lg">
          <nav className="mb-6">
            <Link
              to={`/precos/como-comecar?${planQuery}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              Voltar aos passos
            </Link>
          </nav>

          <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-lg sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Plano: {planLabel(planId)}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Criar usuário e loja</h1>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Preencha os dados do responsável e da sua loja. Depois, use o mesmo login e senha na tela de entrada.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
                {error}
              </div>
            )}

            {success ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950">
                  Cadastro concluído. Enviamos um link para confirmar seu e-mail. Após confirmar, você poderá entrar no painel.
                </div>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
                >
                  Ir para o login
                </Link>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="ms-fullname" className="mb-1 block text-sm font-semibold text-slate-800">
                    Nome completo
                  </label>
                  <input
                    id="ms-fullname"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-cpf" className="mb-1 block text-sm font-semibold text-slate-800">
                    CPF
                  </label>
                  <input
                    id="ms-cpf"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    inputMode="numeric"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-phone" className="mb-1 block text-sm font-semibold text-slate-800">
                    Celular (com DDD)
                  </label>
                  <input
                    id="ms-phone"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={16}
                    inputMode="tel"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-email" className="mb-1 block text-sm font-semibold text-slate-800">
                    E-mail
                  </label>
                  <input
                    id="ms-email"
                    type="email"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-user" className="mb-1 block text-sm font-semibold text-slate-800">
                    Login
                  </label>
                  <input
                    id="ms-user"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                    autoComplete="username"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-600">Sem espaços. Ex.: joao.padaria</p>
                </div>
                <div>
                  <label htmlFor="ms-pass" className="mb-1 block text-sm font-semibold text-slate-800">
                    Senha
                  </label>
                  <input
                    id="ms-pass"
                    type="password"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-store" className="mb-1 block text-sm font-semibold text-slate-800">
                    Nome da loja
                  </label>
                  <input
                    id="ms-store"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={tenantName}
                    onChange={(e) => onTenantNameChange(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ms-slug" className="mb-1 block text-sm font-semibold text-slate-800">
                    Identificador da loja (URL)
                  </label>
                  <input
                    id="ms-slug"
                    type="text"
                    className="w-full rounded-xl border-2 border-slate-300 px-3 py-2.5 font-mono text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={tenantSlug}
                    onChange={(e) => {
                      setSlugTouched(true)
                      setTenantSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "")
                          .slice(0, 48)
                      )
                    }}
                    placeholder="minha-padaria"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-600">
                    Usado nos links públicos: letras minúsculas, números e hífens. Sugestão preenchida a partir do nome
                    da loja; você pode editar.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submitting ? "Enviando…" : "Cadastrar"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-xs font-medium text-slate-600">
              Precisa de ajuda?{" "}
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-indigo-700 font-semibold underline">
                {WHATSAPP_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
