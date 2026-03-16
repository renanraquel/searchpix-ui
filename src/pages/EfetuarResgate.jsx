import { useState, useEffect, useRef } from "react"
import { fetchApi, apiUrl } from "../api"

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function maskPhone(v) {
  const n = String(v || "").replace(/\D/g, "").slice(0, 11)
  if (n.length <= 2) return n ? `(${n}` : ""
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`)
}

function filterCustomersByName(customers, term) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return customers.filter((c) => words.every((w) => c.name.toLowerCase().includes(w)))
}

export default function EfetuarResgate() {
  const [customersList, setCustomersList] = useState([])
  const [productsList, setProductsList] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [customer, setCustomer] = useState(null)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submitting, setSubmitting] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const rawCpf = searchInput.replace(/\D/g, "")
  const hasLetters = /[a-zA-ZÀ-ÿ]/.test(searchInput)
  const suggestions = hasLetters ? filterCustomersByName(customersList, searchInput) : []

  useEffect(() => {
    async function load() {
      try {
        const [custRes, prodRes] = await Promise.all([
          fetchApi("/api/customers"),
          fetchApi("/api/products"),
        ])
        if (custRes.ok) {
          const data = await custRes.json()
          setCustomersList(Array.isArray(data) ? data : [])
        }
        if (prodRes.ok) {
          const data = await prodRes.json()
          const list = Array.isArray(data) ? data : []
          list.sort((a, b) => (a.points_required || 0) - (b.points_required || 0))
          setProductsList(list)
        }
      } catch {
        setCustomersList([])
        setProductsList([])
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

  async function selectCustomer(c) {
    // Sempre busca o cliente atualizado no backend (saldo após resgates anteriores)
    try {
      const res = await fetchApi(`/api/points/customer?cpf=${encodeURIComponent(c.cpf)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.found && data.customer) {
          setCustomer(data.customer)
        } else {
          setCustomer(c)
        }
      } else {
        setCustomer(c)
      }
    } catch {
      setCustomer(c)
    }
    setSearchInput(c.name)
    setShowSuggestions(false)
    setMessage({ type: "", text: "" })
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
        setMessage({ type: "", text: "" })
      } else {
        setMessage({
          type: "warning",
          text: "Cliente não cadastrado. Cadastre na aba Clientes.",
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
    setMessage({ type: "", text: "" })
    inputRef.current?.focus()
  }

  async function handleRedeem(product) {
    if (!customer) return
    const balance = customer.points_balance ?? 0
    if (balance < (product.points_required ?? 0)) {
      setMessage({ type: "error", text: "Pontos insuficientes para este item." })
      return
    }
    setSubmitting(product.id)
    setMessage({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/redemptions/redeem", {
        method: "POST",
        body: JSON.stringify({ cpf: customer.cpf, product_id: product.id }),
      })
      if (!res.ok) throw new Error(await res.text())
      await res.json()
      setMessage({
        type: "success",
        text: "Resgate efetuado com sucesso!",
      })
      setCustomer((prev) =>
        prev
          ? { ...prev, points_balance: balance - (product.points_required ?? 0) }
          : null
      )
    } catch (e) {
      setMessage({ type: "error", text: e.message })
    } finally {
      setSubmitting(null)
    }
  }

  const balance = customer?.points_balance ?? 0

  return (
    <div style={{ padding: "0 24px", maxWidth: 720 }}>
      <h2 style={{ marginBottom: 24 }}>Efetuar resgate</h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Busque o cliente por <strong>CPF</strong> ou <strong>nome</strong>. Depois escolha o item e confirme o resgate no caixa.
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
                      {maskCPF(c.cpf)} · {maskPhone(c.phone)} · {c.points_balance ?? 0} pts
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
              : `${suggestions.length} cliente(s). Clique para selecionar.`}
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
        <>
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              backgroundColor: "#f0f4ff",
              borderRadius: 8,
              border: "1px solid #c5d4f0",
            }}
          >
            <strong>{customer.name}</strong>
            <span style={{ color: "#666", marginLeft: 8 }}>
              {maskCPF(customer.cpf)} · {maskPhone(customer.phone)}
            </span>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: "bold", color: "#0052cc" }}>
              Saldo: {balance} pts
            </div>
          </div>

          <h3 style={{ marginBottom: 12 }}>Itens para resgate</h3>
          {productsList.length === 0 ? (
            <p style={{ color: "#666" }}>Nenhum produto cadastrado. Cadastre na aba Produtos.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(productsList || []).map((product) => {
                const pts = product.points_required ?? 0
                const canRedeem = balance >= pts
                const loading = submitting === product.id
                return (
                  <li
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      padding: "14px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 180 }}>
                      {product.image_url ? (
                        <img
                          src={product.image_url.startsWith("http") ? product.image_url : apiUrl(product.image_url)}
                          alt=""
                          style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, backgroundColor: "#eee", borderRadius: 8 }} />
                      )}
                      <div>
                        <strong>{product.description}</strong>
                        <span style={{ color: "#666", marginLeft: 8 }}>{pts} pts</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRedeem(product)}
                      disabled={!canRedeem || loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: canRedeem ? "#28a745" : "#ccc",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: "bold",
                        cursor: canRedeem && !loading ? "pointer" : "not-allowed",
                      }}
                    >
                      {loading ? "Efetuando..." : canRedeem ? "Efetuar resgate" : "Pontos insuficientes"}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {!customer && (
        <p style={{ color: "#888", marginTop: 16 }}>Selecione um cliente para ver os itens disponíveis e efetuar o resgate.</p>
      )}
    </div>
  )
}
