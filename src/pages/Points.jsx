import { useState, useEffect, useRef } from "react"
import { fetchApi, getTenant } from "../api"

function onlyDigits(s) {
  return String(s).replace(/\D/g, "")
}

function maskCNPJInput(v) {
  const n = onlyDigits(v).slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function maskPhone(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  if (n.length <= 2) return n ? `(${n}` : ""
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`)
}

function nameToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
}

function filterCustomersByName(customers, term) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return customers.filter((c) => words.every((w) => c.name.toLowerCase().includes(w)))
}

function maskCurrencyBR(value) {
  const digits = value.replace(/\D/g, "").slice(0, 12)
  if (digits.length === 0) return ""
  const cents = parseInt(digits, 10)
  const reais = (cents / 100).toFixed(2)
  const formatted = Number(reais).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `R$ ${formatted}`
}

function parseCurrencyBR(masked) {
  if (!masked || typeof masked !== "string") return 0
  const s = masked.replace(/\s/g, "").replace("R$", "").trim().replace(/\./g, "").replace(",", ".")
  const n = parseFloat(s)
  return Number.isNaN(n) ? 0 : n
}

export default function Points() {
  const [customersList, setCustomersList] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [customer, setCustomer] = useState(null)
  const [checking, setChecking] = useState(false)
  const [valueReais, setValueReais] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const [nfceCnpjInput, setNfceCnpjInput] = useState("")
  const [nfceEmitters, setNfceEmitters] = useState([])
  const [nfceSaving, setNfceSaving] = useState(false)
  const [nfceMsg, setNfceMsg] = useState({ type: "", text: "" })

  useEffect(() => {
    const t = getTenant()
    const raw = t?.nfce_emitter_cnpj || t?.NfceEmitterCNPJ || ""
    if (raw) setNfceEmitters([raw])
  }, [])

  useEffect(() => {
    async function loadEmitters() {
      try {
        const res = await fetchApi("/api/tenants/nfce-emitters")
        if (!res.ok) return
        const data = await res.json()
        setNfceEmitters(Array.isArray(data.emitters) ? data.emitters : [])
      } catch {
        // ignore
      }
    }
    loadEmitters()
  }, [])

  const rawCpf = searchInput.replace(/\D/g, "")
  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(searchInput)
  const suggestions = hasLetters ? filterCustomersByName(customersList, searchInput) : []

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi("/api/customers")
        if (res.ok) {
          const data = await res.json()
          setCustomersList(Array.isArray(data) ? data : [])
        }
      } catch {
        setCustomersList([])
      }
    }
    load()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSearchChange(e) {
    const v = e.target.value
    if (/[a-zA-ZÀ-ÿ]/.test(v)) {
      setSearchInput(nameToUpper(v))
      setShowSuggestions(true)
      setMessage({ type: "", text: "" })
    } else {
      const digits = v.replace(/\D/g, "").slice(0, 11)
      setSearchInput(maskCPF(digits))
      setShowSuggestions(false)
      setMessage({ type: "", text: "" })
    }
  }

  function selectCustomer(c) {
    setCustomer(c)
    setSearchInput(nameToUpper(c.name || ""))
    setShowSuggestions(false)
    setMessage({ type: "success", text: `Cliente: ${nameToUpper(c.name || "")} | ${maskPhone(c.phone)}` })
  }

  async function verifyCpf() {
    if (rawCpf.length !== 11) {
      setMessage({ type: "error", text: "Informe um CPF válido (11 dígitos)." })
      return
    }
    setChecking(true)
    setMessage({ type: "", text: "" })
    setCustomer(null)
    try {
      const res = await fetchApi(`/api/points/customer?cpf=${encodeURIComponent(rawCpf)}`)
      const data = await res.json()
      if (data.found) {
        setCustomer(data.customer)
        setSearchInput(nameToUpper(data.customer.name || ""))
        setMessage({
          type: "success",
          text: `Cliente: ${nameToUpper(data.customer.name || "")} | ${maskPhone(data.customer.phone)}`,
        })
      } else {
        setMessage({
          type: "warning",
          text: "Cliente não cadastrado. Cadastre na aba Clientes antes de lançar pontos.",
        })
      }
    } catch (e) {
      setMessage({ type: "error", text: e.message })
    } finally {
      setChecking(false)
    }
  }

  function clearCustomer() {
    setCustomer(null)
    setSearchInput("")
    setValueReais("")
    setMessage({ type: "", text: "" })
    inputRef.current?.focus()
  }

  async function saveNfceEmitterCNPJ(e) {
    e.preventDefault()
    const d = onlyDigits(nfceCnpjInput)
    if (d.length !== 14) {
      setNfceMsg({ type: "error", text: "Informe o CNPJ completo (14 dígitos) que aparece como emitente na NFC-e." })
      return
    }
    setNfceSaving(true)
    setNfceMsg({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/tenants/nfce-emitters", {
        method: "POST",
        body: JSON.stringify({ nfce_emitter_cnpj: d }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || res.statusText)
      const data = JSON.parse(text)
      const emitters = Array.isArray(data.emitters) ? data.emitters : []
      setNfceEmitters(emitters)
      setNfceCnpjInput("")
      setNfceMsg({
        type: "success",
        text: data.message || "CNPJ adicionado. Só notas emitidas por CNPJs cadastrados pontuarão pelo link público.",
      })
    } catch (err) {
      setNfceMsg({ type: "error", text: err.message || "Erro ao salvar." })
    } finally {
      setNfceSaving(false)
    }
  }

  async function removeNfceEmitter(cnpj) {
    setNfceSaving(true)
    setNfceMsg({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/tenants/nfce-emitters", {
        method: "DELETE",
        body: JSON.stringify({ nfce_emitter_cnpj: cnpj }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || res.statusText)
      const data = JSON.parse(text)
      setNfceEmitters(Array.isArray(data.emitters) ? data.emitters : [])
      setNfceMsg({ type: "success", text: data.message || "CNPJ removido." })
    } catch (err) {
      setNfceMsg({ type: "error", text: err.message || "Erro ao remover." })
    } finally {
      setNfceSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customer) {
      setMessage({ type: "error", text: "Selecione ou verifique um cliente." })
      return
    }
    const value = parseCurrencyBR(valueReais)
    if (!value || value <= 0) {
      setMessage({ type: "error", text: "Informe o valor da compra em R$ (maior que zero)." })
      return
    }
    setSubmitting(true)
    setMessage({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/points/earn", {
        method: "POST",
        body: JSON.stringify({ cpf: customer.cpf, value_reais: value }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setMessage({
        type: "success",
        text: `${data.points_added} pontos lançados. Novo saldo: ${(customer.points_balance || 0) + data.points_added} pts.`,
      })
      setValueReais("")
      setCustomer(null)
      setSearchInput("")
    } catch (e) {
      setMessage({ type: "error", text: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const msgClass =
    message.type === "error" ? "cp-alert-danger" : message.type === "warning" ? "cp-alert-warning" : "cp-alert-success"

  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="page-header">
          <h3 className="page-title">Lançar pontos</h3>
        </div>

        <div className="card border-primary mb-4">
          <div className="card-body">
            <h5 className="card-title">Pontos pela NFC-e (link público)</h5>
            <p className="text-dark mb-3" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
              Cadastre <strong>um ou mais CNPJs emitentes</strong> das suas notas (os mesmos que aparecem na chave de acesso).
              Assim, só notas emitidas por CNPJs desta lista geram pontos; notas de outros CNPJs são recusadas.
            </p>
            <form onSubmit={saveNfceEmitterCNPJ} className="mb-0">
              <div className="form-group mb-2">
                <label htmlFor="nfce-emitter-cnpj">CNPJ emissor da NFC-e</label>
                <input
                  id="nfce-emitter-cnpj"
                  type="text"
                  className="form-control"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="00.000.000/0001-00"
                  value={nfceCnpjInput}
                  onChange={(e) => setNfceCnpjInput(maskCNPJInput(e.target.value))}
                  maxLength={18}
                />
              </div>
              {nfceMsg.text && (
                <div
                  className={`cp-alert mb-2 ${nfceMsg.type === "error" ? "cp-alert-danger" : "cp-alert-success"}`}
                  role="alert"
                >
                  {nfceMsg.text}
                </div>
              )}
              {nfceEmitters.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted d-block mb-1">CNPJs cadastrados:</small>
                  <div className="d-flex flex-wrap">
                    {nfceEmitters.map((cnpj) => (
                      <span key={cnpj} className="badge badge-primary mr-2 mb-2 px-2 py-1" style={{ fontSize: "0.82rem" }}>
                        {maskCNPJInput(cnpj)}
                        <button
                          type="button"
                          className="btn btn-link text-white p-0 ml-2"
                          style={{ lineHeight: 1, fontSize: "0.85rem", verticalAlign: "baseline" }}
                          onClick={() => removeNfceEmitter(cnpj)}
                          disabled={nfceSaving}
                          aria-label={`Remover CNPJ ${maskCNPJInput(cnpj)}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-outline-primary" disabled={nfceSaving}>
                {nfceSaving ? "Salvando…" : "Adicionar CNPJ"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-muted mb-4">
          <strong>Regra de pontuação:</strong> a cada R$ 5,00 em compras você ganha 1 ponto, sempre arredondando para cima.
          Ex.: R$ 7,00 / 8,00 / 9,00 = 2 pontos. Busque o cliente por <strong>CPF</strong> ou pelo <strong>nome</strong> e informe o valor da compra.
        </p>

        <div className="form-group position-relative mb-4">
          <label htmlFor="points-client">Cliente (CPF ou nome)</label>
          <div className="d-flex flex-wrap align-items-stretch cp-client-search-row">
            <div className="flex-grow-1 position-relative mr-2 mb-2 mb-sm-0 cp-flex-input-min">
              <input
                ref={inputRef}
                id="points-client"
                type="text"
                className={`form-control${hasLetters ? " text-uppercase" : ""}`}
                value={searchInput}
                onChange={handleSearchChange}
                onFocus={() => hasLetters && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="CPF ou NOME DO CLIENTE"
                autoCapitalize={hasLetters ? "characters" : undefined}
                spellCheck={false}
                disabled={!!customer}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  className="list-group position-absolute w-100 shadow-sm mt-1"
                  style={{ zIndex: 20, maxHeight: 260, overflowY: "auto" }}
                >
                  {suggestions.slice(0, 10).map((c) => (
                    <li
                      key={c.id}
                      className="list-group-item list-group-item-action py-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => selectCustomer(c)}
                    >
                      <strong className="text-uppercase">{nameToUpper(c.name || "")}</strong>
                      <small className="d-block text-muted">
                        {maskCPF(c.cpf)} · {maskPhone(c.phone)}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!customer && rawCpf.length === 11 && (
              <button type="button" className="btn btn-primary mr-2" onClick={verifyCpf} disabled={checking}>
                {checking ? "Verificando..." : "Verificar CPF"}
              </button>
            )}
            {customer && (
              <button type="button" className="btn btn-outline-secondary" onClick={clearCustomer}>
                Trocar cliente
              </button>
            )}
          </div>
          {hasLetters && searchInput.trim().length > 0 && !customer && (
            <small className="form-text text-muted">
              {suggestions.length === 0
                ? "Nenhum cliente encontrado com esse nome."
                : `${suggestions.length} cliente(s) encontrado(s). Clique para selecionar.`}
            </small>
          )}
        </div>

        {message.text && (
          <div className={`cp-alert ${msgClass}`} role="alert">
            {message.text}
          </div>
        )}

        {customer && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Valor da compra</h5>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="points-value">Valor (R$)</label>
                  <input
                    id="points-value"
                    type="text"
                    inputMode="decimal"
                    className="form-control form-control-lg cp-input-currency-max"
                    value={valueReais}
                    onChange={(e) => setValueReais(maskCurrencyBR(e.target.value))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success btn-block d-md-inline-block"
                  disabled={submitting}
                >
                  {submitting ? "Lançando..." : "Lançar pontos"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
