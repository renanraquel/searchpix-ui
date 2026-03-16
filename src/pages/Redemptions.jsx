import { useState } from "react"
import { fetchApi, apiUrl, getToken } from "../api"

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

const PAGE_SIZE = 8

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

  return (
    <div style={{ padding: "0 24px" }}>
      <h2 style={{ marginBottom: 24 }}>Consulta de resgates</h2>

      <section
        style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          backgroundColor: "#f8f9ff",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>Imagem de fundo da tela pública</h3>
        <p style={{ margin: 0, marginBottom: 8, fontSize: 13, color: "#555" }}>
          Essa imagem aparece na tela externa de consulta de pontos ({window.location.origin}/resgatar?tenant=seu-tenant).
        </p>
        <input
          type="file"
          accept="image/*"
          disabled={bgUploading}
          onChange={handleBackgroundChange}
          style={{ marginTop: 4 }}
        />
        {bgMessage && (
          <p style={{ marginTop: 8, fontSize: 13, color: bgMessage.includes("sucesso") ? "#155724" : "#721c24" }}>
            {bgMessage}
          </p>
        )}
      </section>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div style={{ minWidth: 140 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Data início</label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            style={{ width: "100%", minWidth: 140, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Data fim</label>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            style={{ width: "100%", minWidth: 140, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Nome ou CPF</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por nome ou CPF"
            style={{ width: "100%", minWidth: 200, padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ paddingBottom: 2 }}>
          <label style={{ display: "block", marginBottom: 6, opacity: 0 }}>Ação</label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              backgroundColor: "#0052cc",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: "#721c24", backgroundColor: "#f8d7da", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {data && (
        <>
          <p style={{ color: "#666", marginBottom: 12 }}>
            {total} resgate(s) encontrado(s). Ordenação: data mais antiga primeiro.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #eee" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ textAlign: "left", padding: 12 }}>Data</th>
                  <th style={{ textAlign: "left", padding: 12 }}>Nome</th>
                  <th style={{ textAlign: "left", padding: 12 }}>CPF</th>
                  <th style={{ textAlign: "left", padding: 12 }}>Telefone</th>
                  <th style={{ textAlign: "right", padding: 12 }}>Pontos resgatados</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>{formatDate(row.created_at)}</td>
                    <td style={{ padding: 12 }}>{row.customer_name}</td>
                    <td style={{ padding: 12 }}>{maskCPF(row.cpf)}</td>
                    <td style={{ padding: 12 }}>{maskPhone(row.phone)}</td>
                    <td style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>{row.points_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <p style={{ padding: 24, color: "#666", textAlign: "center" }}>Nenhum resgate encontrado com os filtros informados.</p>
          )}

          {totalPages > 1 && (
            <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#666" }}>
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => search(page - 1)}
                disabled={page <= 1}
                style={{ padding: "8px 16px", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => search(page + 1)}
                disabled={page >= totalPages}
                style={{ padding: "8px 16px", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <p style={{ color: "#666" }}>Use os filtros acima e clique em Pesquisar para listar os resgates.</p>
      )}
    </div>
  )
}
