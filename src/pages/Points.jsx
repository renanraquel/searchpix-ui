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

// Filtra clientes por nome: cada palavra do termo deve aparecer no nome
function filterCustomersByName(customers, term) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return customers.filter((c) => words.every((w) => c.name.toLowerCase().includes(w)))
}

// Máscara R$: apenas dígitos, últimos 2 = centavos
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

  const isOnlyDigits = /^\d*$/.test(searchInput.replace(/\D/g, ""))
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

  return (
    <div style={{ padding: "0 24px", maxWidth: 560 }}>
      <h2 style={{ marginBottom: 24 }}>Lançar pontos</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        R$ 1,00 = 1 ponto. Busque o cliente por <strong>CPF</strong> ou pelo <strong>nome</strong>.
      </p>

      <div style={{ marginBottom: 24, position: "relative" }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Cliente (CPF ou nome)</label>
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              onFocus={() => hasLetters && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Digite o CPF ou o nome do cliente"
              disabled={!!customer}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                ref={dropdownRef}
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  maxHeight: 260,
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {suggestions.slice(0, 10).map((c) => (
                  <li
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    style={{
                      padding: "12px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f0f4ff"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }}
                  >
                    <strong>{c.name}</strong>
                    <span style={{ color: "#666", fontSize: 14, display: "block", marginTop: 2 }}>
                      {maskCPF(c.cpf)} · {maskPhone(c.phone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {!customer && rawCpf.length === 11 && (
            <button
              type="button"
              onClick={verifyCpf}
              disabled={checking}
              style={{
                padding: "12px 20px",
                backgroundColor: "#0052cc",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: checking ? "not-allowed" : "pointer",
              }}
            >
              {checking ? "Verificando..." : "Verificar CPF"}
            </button>
          )}
          {customer && (
            <button
              type="button"
              onClick={clearCustomer}
              style={{
                padding: "12px 16px",
                border: "1px solid #ccc",
                borderRadius: 8,
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Trocar cliente
            </button>
          )}
        </div>
        {hasLetters && searchInput.trim().length > 0 && !customer && (
          <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
            {suggestions.length === 0
              ? "Nenhum cliente encontrado com esse nome."
              : `${suggestions.length} cliente(s) encontrado(s). Clique para selecionar.`}
          </p>
        )}
      </div>

      {message.text && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
            backgroundColor:
              message.type === "error" ? "#f8d7da" : message.type === "warning" ? "#fff3cd" : "#d4edda",
            color: message.type === "error" ? "#721c24" : message.type === "warning" ? "#856404" : "#155724",
          }}
        >
          {message.text}
        </div>
      )}

      {customer && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Valor da compra (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={valueReais}
              onChange={(e) => setValueReais(maskCurrencyBR(e.target.value))}
              placeholder="R$ 0,00"
              style={{
                width: "100%",
                maxWidth: 220,
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 18,
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            {submitting ? "Lançando..." : "Lançar pontos"}
          </button>
        </form>
      )}
    </div>
  )
}
