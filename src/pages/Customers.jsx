import { useState, useEffect } from "react"
import { fetchApi } from "../api"

function maskCPF(v) {
  const n = v.replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function maskPhone(v) {
  const n = v.replace(/\D/g, "").slice(0, 11)
  if (n.length <= 2) return n.replace(/(\d{0,2})/, "($1")
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`)
}

export default function Customers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ cpf: "", name: "", phone: "" })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await fetchApi("/api/customers")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setList(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cpf.replace(/\D/g, "") || !form.name.trim() || !form.phone.replace(/\D/g, "")) {
      setError("CPF, nome e celular são obrigatórios.")
      return
    }
    setError("")
    try {
      if (editing) {
        const res = await fetchApi(`/api/customers/update?id=${editing.id}`, {
          method: "POST",
          body: JSON.stringify({
            cpf: form.cpf.replace(/\D/g, ""),
            name: form.name.trim(),
            phone: form.phone.replace(/\D/g, ""),
          }),
        })
        if (!res.ok) throw new Error(await res.text())
      } else {
        const res = await fetchApi("/api/customers/create", {
          method: "POST",
          body: JSON.stringify({
            cpf: form.cpf.replace(/\D/g, ""),
            name: form.name.trim(),
            phone: form.phone.replace(/\D/g, ""),
          }),
        })
        if (!res.ok) throw new Error(await res.text())
      }
      setForm({ cpf: "", name: "", phone: "" })
      setEditing(null)
      setSuccess("Cliente cadastrado com sucesso!")
      setError("")
      load()
    } catch (e) {
      setError(e.message)
      setSuccess("")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este cliente?")) return
    try {
      const res = await fetchApi(`/api/customers/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      await load()
      // Garante que a página atual ainda exista após exclusão
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
      if (page > totalPages) {
        setPage(totalPages)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const visible = (list || []).slice(startIndex, startIndex + PAGE_SIZE)

  function startEdit(c) {
    setError("")
    setSuccess("")
    setEditing(c)
    setForm({
      cpf: maskCPF(c.cpf),
      name: c.name,
      phone: maskPhone(c.phone),
    })
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 600, color: "#111827" }}>Clientes</h2>
      <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
        Cadastre e gerencie os clientes que poderão acumular e resgatar pontos no programa de fidelidade.
      </p>
      {error && (
        <p style={{ color: "#721c24", backgroundColor: "#f8d7da", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "#155724", backgroundColor: "#d4edda", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {success}
        </p>
      )}
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
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>CPF *</label>
          <input
            type="text"
            value={form.cpf}
            onChange={(e) => setForm((f) => ({ ...f, cpf: maskCPF(e.target.value) }))}
            placeholder="000.000.000-00"
            maxLength={14}
            style={{ width: "100%", minWidth: 140, padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="Nome completo"
            style={{ width: "100%", minWidth: 200, padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Celular *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
            placeholder="(00) 00000-0000"
            maxLength={15}
            style={{ width: "100%", minWidth: 140, padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ paddingBottom: 2 }}>
          <label style={{ display: "block", marginBottom: 6, opacity: 0 }}>Ação</label>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              backgroundColor: editing ? "#28a745" : "#0052cc",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              cursor: "pointer",
              marginRight: editing ? 8 : 0,
            }}
          >
            {editing ? "Salvar" : "Cadastrar"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setError("")
                setSuccess("")
                setForm({ cpf: "", name: "", phone: "" })
              }}
              style={{ padding: "10px 16px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #eee" }}>
            <colgroup>
              <col style={{ width: 140 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ textAlign: "left", padding: 12 }}>CPF</th>
                <th style={{ textAlign: "left", padding: 12 }}>Nome</th>
                <th style={{ textAlign: "left", padding: 12 }}>Celular</th>
                <th style={{ textAlign: "right", padding: 12 }}>Pontos</th>
                <th style={{ padding: 12 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>{maskCPF(c.cpf)}</td>
                  <td style={{ padding: 12 }}>{c.name}</td>
                  <td style={{ padding: 12 }}>{maskPhone(c.phone)}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>{c.points_balance ?? 0}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        style={{ padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        style={{ padding: "6px 12px", color: "#721c24", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p style={{ padding: 24, color: "#666" }}>Nenhum cliente cadastrado.</p>}
          {list.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "#666" }}>
                Página {page} de {totalPages} — {total} cliente(s)
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: "6px 12px", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: "6px 12px", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
