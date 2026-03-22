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

function nameToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
}

/** Painel principal do layout (Connect Plus) costuma rolar aqui, não na window. */
function scrollToTopOfPage() {
  requestAnimationFrame(() => {
    const panel = document.querySelector(".main-panel")
    if (panel) panel.scrollTo({ top: 0, behavior: "smooth" })
    window.scrollTo({ top: 0, behavior: "smooth" })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  })
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
    setSearchInput(nameToUpper(c.name || ""))
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
        setSearchInput(nameToUpper(data.customer.name || ""))
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
      // Após o próximo paint, leva o scroll ao topo para a mensagem ficar visível (lista longa).
      requestAnimationFrame(() => {
        setTimeout(scrollToTopOfPage, 0)
      })
    } catch (e) {
      setMessage({ type: "error", text: e.message })
    } finally {
      setSubmitting(null)
    }
  }

  const balance = customer?.points_balance ?? 0

  const msgClass =
    message.type === "error" ? "cp-alert-danger" : message.type === "warning" ? "cp-alert-warning" : "cp-alert-success"

  return (
    <div className="row">
      <div className="col-lg-10">
        <div className="page-header">
          <h3 className="page-title">Efetuar resgate</h3>
        </div>
        <p className="text-muted mb-4">
          Busque o cliente por <strong>CPF</strong> ou <strong>nome</strong>, confira o saldo de pontos e escolha o item para resgate no caixa.
        </p>

        <div className="form-group position-relative mb-4">
          <label htmlFor="resgate-client">Cliente (CPF ou nome)</label>
          <div className="d-flex flex-wrap align-items-stretch cp-client-search-row">
            <div className="flex-grow-1 position-relative mr-2 mb-2 mb-sm-0 cp-flex-input-min">
              <input
                ref={inputRef}
                id="resgate-client"
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
                        {maskCPF(c.cpf)} · {maskPhone(c.phone)} · {c.points_balance ?? 0} pts
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
                : `${suggestions.length} cliente(s). Clique para selecionar.`}
            </small>
          )}
        </div>

        {message.text && (
          <div className={`cp-alert ${msgClass}`} role="alert">
            {message.text}
          </div>
        )}

        {customer && (
          <>
            <div className="card border-primary mb-4">
              <div className="card-body">
                <h5 className="card-title mb-1 text-uppercase">{nameToUpper(customer.name || "")}</h5>
                <p className="card-text text-muted mb-2 small">
                  {maskCPF(customer.cpf)} · {maskPhone(customer.phone)}
                </p>
                <p className="mb-0 h5 text-primary">Saldo: {balance} pts</p>
              </div>
            </div>

            <h4 className="mb-3">Itens para resgate</h4>
            {productsList.length === 0 ? (
              <p className="text-muted">Nenhum produto cadastrado. Cadastre na aba Produtos.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {(productsList || []).map((product) => {
                  const pts = product.points_required ?? 0
                  const canRedeem = balance >= pts
                  const loading = submitting === product.id
                  return (
                    <li
                      key={product.id}
                      className="list-group-item d-flex flex-wrap align-items-center justify-content-between cp-redeem-product-row"
                    >
                      <div className="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url.startsWith("http") ? product.image_url : apiUrl(product.image_url)}
                            alt=""
                            className="rounded mr-3"
                            style={{ width: 56, height: 56, objectFit: "cover" }}
                          />
                        ) : (
                          <div className="rounded mr-3 bg-light" style={{ width: 56, height: 56 }} />
                        )}
                        <div>
                          <strong>{product.description}</strong>
                          <span className="text-muted ml-2">{pts} pts</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn cp-redeem-product-btn ${canRedeem ? "btn-success" : "btn-secondary"}`}
                        onClick={() => handleRedeem(product)}
                        disabled={!canRedeem || loading}
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

        {!customer && <p className="text-muted mt-3">Selecione um cliente para ver os itens disponíveis e efetuar o resgate.</p>}
      </div>
    </div>
  )
}
