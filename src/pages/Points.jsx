import { useState, useEffect, useRef } from "react"
import { fetchApi } from "../api"

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
      setSearchInput(v)
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
    setSearchInput(c.name)
    setShowSuggestions(false)
    setMessage({ type: "success", text: `Cliente: ${c.name} | ${maskPhone(c.phone)}` })
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
        setMessage({ type: "success", text: `Cliente: ${data.customer.name} | ${maskPhone(data.customer.phone)}` })
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
        <p className="text-muted mb-4">
          <strong>Regra de pontuação:</strong> a cada R$ 5,00 em compras você ganha 1 ponto, sempre arredondando para cima.
          Ex.: R$ 7,00 / 8,00 / 9,00 = 2 pontos. Busque o cliente por <strong>CPF</strong> ou pelo <strong>nome</strong> e informe o valor da compra.
        </p>

        <div className="form-group position-relative mb-4">
          <label htmlFor="points-client">Cliente (CPF ou nome)</label>
          <div className="d-flex flex-wrap align-items-stretch">
            <div className="flex-grow-1 position-relative mr-2 mb-2 mb-sm-0" style={{ minWidth: 200 }}>
              <input
                ref={inputRef}
                id="points-client"
                type="text"
                className="form-control"
                value={searchInput}
                onChange={handleSearchChange}
                onFocus={() => hasLetters && suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Digite o CPF ou o nome do cliente"
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
                      <strong>{c.name}</strong>
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
                    className="form-control form-control-lg"
                    style={{ maxWidth: 280 }}
                    value={valueReais}
                    onChange={(e) => setValueReais(maskCurrencyBR(e.target.value))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <button type="submit" className="btn btn-success" disabled={submitting}>
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
