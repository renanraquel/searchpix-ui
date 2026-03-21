import { useState } from "react"
import { fetchApi, apiUrl, getToken, getTenant } from "../api"

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

function formatDate(d) {
  if (!d) return "—"
  const t = typeof d === "string" ? d : d?.Time ? d.Time : d
  try {
    return new Date(t).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(t)
  }
}

export default function Redemptions() {
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgUploading, setBgUploading] = useState(false)
  const [bgMessage, setBgMessage] = useState("")
  const tenant = getTenant()

  const tenantSlug = tenant?.slug || tenant?.Slug || "seu-tenant"
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/resgatar?tenant=${tenantSlug}`
      : `https://searchpix-ui.onrender.com/resgatar?tenant=${tenantSlug}`

  async function search(goToPage = 1) {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (inicio) params.set("inicio", inicio)
      if (fim) params.set("fim", fim)
      if (q.trim()) params.set("q", q.trim())
      params.set("page", String(goToPage))
      const res = await fetchApi(`/api/redemptions?${params.toString()}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
      setPage(goToPage)
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    search(1)
  }

  async function handleBackgroundChange(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setBgMessage("Selecione um arquivo de imagem.")
      return
    }
    setBgMessage("")
    setBgUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const token = getToken()
      const url = apiUrl("/api/tenants/background")
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      setBgMessage("Imagem de fundo atualizada com sucesso. Atualize a tela pública para ver o resultado.")
    } catch (err) {
      setBgMessage(err.message)
    } finally {
      setBgUploading(false)
      e.target.value = ""
    }
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const qHasLetters = /[a-zA-ZÀ-ÿ]/.test(q)

  function handleQChange(e) {
    const v = e.target.value
    if (/[a-zA-ZÀ-ÿ]/.test(v)) {
      setQ(nameToUpper(v))
    } else {
      setQ(v)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Consulta de resgates</h3>
      </div>

      <div className="card mb-4 border-primary">
        <div className="card-body">
          <h5 className="card-title">Imagem de fundo da tela pública</h5>
          <p className="card-text text-muted small mb-2">
            Essa imagem aparece na tela externa de consulta de pontos:{" "}
            <code className="text-break">{publicUrl}</code>
          </p>
          <input type="file" accept="image/*" disabled={bgUploading} className="form-control-file" onChange={handleBackgroundChange} />
          {bgMessage && (
            <p className={`small mt-2 mb-0 ${bgMessage.includes("sucesso") ? "text-success" : "text-danger"}`}>{bgMessage}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row align-items-end">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="form-group mb-0">
              <label htmlFor="red-inicio">Data início</label>
              <input
                id="red-inicio"
                type="date"
                className="form-control"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="form-group mb-0">
              <label htmlFor="red-fim">Data fim</label>
              <input id="red-fim" type="date" className="form-control" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <div className="col-md-4 col-sm-6 mb-3">
            <div className="form-group mb-0">
              <label htmlFor="red-q">Nome ou CPF</label>
              <input
                id="red-q"
                type="text"
                className={`form-control${qHasLetters ? " text-uppercase" : ""}`}
                value={q}
                onChange={handleQChange}
                placeholder="NOME OU CPF"
                autoCapitalize={qHasLetters ? "characters" : undefined}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="col-md-auto mb-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Buscando..." : "Pesquisar"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="cp-alert cp-alert-danger" role="alert">
          {error}
        </div>
      )}

      {data && (
        <>
          <p className="text-muted mb-3">
            {total} resgate(s) encontrado(s). Ordenação: data mais antiga primeiro.
          </p>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th className="text-right">Pontos resgatados</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.created_at)}</td>
                    <td className="text-uppercase">{nameToUpper(row.customer_name || "")}</td>
                    <td>{maskCPF(row.cpf)}</td>
                    <td>{maskPhone(row.phone)}</td>
                    <td className="text-right font-weight-bold">{row.points_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p className="text-center text-muted p-4">Nenhum resgate encontrado com os filtros informados.</p>
          )}

          {totalPages > 1 && (
            <div className="d-flex align-items-center flex-wrap mt-3">
              <span className="text-muted mr-3 mb-2 mb-sm-0">
                Página {page} de {totalPages}
              </span>
              <button type="button" className="btn btn-outline-secondary btn-sm mr-2" onClick={() => search(page - 1)} disabled={page <= 1}>
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => search(page + 1)}
                disabled={page >= totalPages}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {!data && !loading && <p className="text-muted">Use os filtros acima e clique em Pesquisar para listar os resgates.</p>}
    </div>
  )
}
