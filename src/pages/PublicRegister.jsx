import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { apiUrl, mediaSrc } from "../api"
import { PublicProgramFooterBootstrap } from "../components/public/PublicProgramFooter"
import { isValidCpf } from "../utils/cpf"

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

function nameToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
}

export default function PublicRegister() {
  const [searchParams] = useSearchParams()
  const tenantSlug = searchParams.get("tenant") || ""

  const [tenantName, setTenantName] = useState("")
  const [backgroundUrl, setBackgroundUrl] = useState(null)

  const [name, setName] = useState("")
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")

  const [loadingTenant, setLoadingTenant] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [alreadyMessage, setAlreadyMessage] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!tenantSlug) return
    let cancelled = false
    async function load() {
      setLoadingTenant(true)
      setError("")
      try {
        const res = await fetch(
          `${apiUrl("/api/public/redemption")}?tenant=${encodeURIComponent(tenantSlug)}`
        )
        if (!res.ok) throw new Error("Estabelecimento não encontrado.")
        const json = await res.json()
        if (cancelled) return
        setTenantName(json.tenant?.name || "")
        const bg = json.tenant?.background_image_url
        setBackgroundUrl(bg ? mediaSrc(bg) : null)
      } catch (e) {
        if (!cancelled) setError(e.message || "Não foi possível carregar.")
      } finally {
        if (!cancelled) setLoadingTenant(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tenantSlug])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setAlreadyMessage("")
    const cpfDigits = cpf.replace(/\D/g, "")
    const phoneDigits = phone.replace(/\D/g, "")
    const nameNorm = nameToUpper(name).trim()
    if (!nameNorm) {
      setError("Preencha o nome completo.")
      return
    }
    if (!isValidCpf(cpfDigits)) {
      setError("Informe um CPF válido.")
      return
    }
    if (phoneDigits.length < 10) {
      setError("Informe o telefone com DDD (10 ou 11 dígitos).")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl("/api/public/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          name: nameNorm,
          cpf: cpfDigits,
          phone: phoneDigits,
        }),
      })
      if (res.status === 201) {
        setSuccess(true)
        return
      }
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}))
        setAlreadyMessage(
          data.message ||
            "Este CPF já está cadastrado no programa de fidelidade deste estabelecimento."
        )
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

  if (!tenantSlug) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted mb-0">
          Use o link do estabelecimento para se cadastrar. Ex.:{" "}
          <code>/cadastro?tenant=slug-da-loja</code>
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="d-flex justify-content-center align-items-start py-4 px-3"
        style={{
          minHeight: "100vh",
          backgroundColor: backgroundUrl ? "rgba(0,0,0,0.45)" : "transparent",
          boxSizing: "border-box",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          className="card shadow border-0 my-3"
          style={{
            width: "100%",
            maxWidth: 520,
            backgroundColor: "rgba(255,255,255,0.96)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <div className="card-body p-3 p-md-4">
            <h1 className="h3 mb-2">{tenantName || (loadingTenant ? "Carregando…" : "Programa de fidelidade")}</h1>
            <p className="text-muted mb-4">Cadastro no programa de fidelidade</p>

            {error && !success && (
              <div className="cp-alert cp-alert-danger mb-3" role="alert">
                {error}
              </div>
            )}

            {alreadyMessage && (
              <div className="cp-alert cp-alert-warning mb-3" role="alert">
                {alreadyMessage}
              </div>
            )}

            {success && (
              <div className="cp-alert cp-alert-success mb-4" role="status">
                <strong>Cadastro realizado com sucesso!</strong>
                <p className="mb-0 mt-2 small">
                  Você já pode participar do programa. Na próxima compra, informe seu NOME ou CPF no caixa para
                  acumular pontos.
                </p>
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reg-name">Nome completo</label>
                  <input
                    id="reg-name"
                    type="text"
                    className="form-control text-uppercase"
                    value={name}
                    onChange={(e) => setName(nameToUpper(e.target.value))}
                    placeholder="SEU NOME COMPLETO"
                    autoComplete="name"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                    disabled={loadingTenant}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-cpf">CPF</label>
                  <input
                    id="reg-cpf"
                    type="text"
                    className="form-control"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    disabled={loadingTenant}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-phone">Telefone (com DDD)</label>
                  <input
                    id="reg-phone"
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={16}
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    disabled={loadingTenant}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={submitting || loadingTenant}
                >
                  {submitting ? "Enviando…" : "Cadastrar"}
                </button>
              </form>
            )}

            <PublicProgramFooterBootstrap tenantSlug={tenantSlug} />
          </div>
        </div>
      </div>
    </div>
  )
}
