import { useState, useEffect } from "react"
import { fetchApi, apiUrl, getToken } from "../api"

export default function Products() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ description: "", points_required: "" })
  const [imageFile, setImageFile] = useState(null)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await fetchApi("/api/products")
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setList(Array.isArray(data) ? data : [])
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
    const points = parseInt(form.points_required, 10)
    if (!form.description || !points || points < 1) {
      setError("Descrição e pontos (maior que 0) são obrigatórios.")
      return
    }
    setError("")
    try {
      const formData = new FormData()
      formData.append("description", form.description.trim())
      formData.append("points_required", String(points))
      if (imageFile) formData.append("image", imageFile)
      const token = getToken()
      const url = editing
        ? apiUrl(`/api/products/update?id=${editing.id}`)
        : apiUrl("/api/products/create")
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      setForm({ description: "", points_required: "" })
      setImageFile(null)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este produto?")) return
    try {
      const res = await fetchApi(`/api/products/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(p) {
    setEditing(p)
    setImageFile(null)
    setForm({
      description: p.description,
      points_required: String(p.points_required),
    })
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.")
      return
    }
    setError("")
    setImageFile(file)
    e.target.value = ""
  }

  return (
    <div style={{ padding: "0 24px" }}>
      <h2 style={{ marginBottom: 24 }}>Produtos para resgate</h2>
      {error && (
        <p style={{ color: "#721c24", backgroundColor: "#f8d7da", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {error}
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
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Cadastrar Imagem</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ width: "100%", minWidth: 200, padding: "8px 0", boxSizing: "border-box" }}
          />
          {(imageFile || (editing?.image_url)) && (
            <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
              {imageFile ? "Nova imagem selecionada. Salve para gravar no banco." : "Imagem no banco. Selecione outra para substituir."}
            </p>
          )}
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Descrição *</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            placeholder="Nome do produto"
            style={{ width: "100%", minWidth: 200, padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 100 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Pontos *</label>
          <input
            type="number"
            min={1}
            value={form.points_required}
            onChange={(e) => setForm((f) => ({ ...f, points_required: e.target.value }))}
            required
            style={{ width: "100%", minWidth: 80, padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
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
              onClick={() => { setEditing(null); setImageFile(null); setForm({ description: "", points_required: "" }); }}
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
              <col style={{ width: 90 }} />
              <col />
              <col style={{ width: 90 }} />
              <col style={{ width: 160 }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ textAlign: "left", padding: 12 }}>Imagem</th>
                <th style={{ textAlign: "left", padding: 12 }}>Descrição</th>
                <th style={{ textAlign: "right", padding: 12 }}>Pontos</th>
                <th style={{ padding: 12 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(list || []).map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>
                    {p.image_url ? (
                      <img
                        src={p.image_url.startsWith("http") ? p.image_url : apiUrl(p.image_url)}
                        alt=""
                        style={{ maxWidth: 60, maxHeight: 60, objectFit: "cover" }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ padding: 12 }}>{p.description}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>{p.points_required}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", flexWrap: "nowrap", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        style={{ padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
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
          {list.length === 0 && <p style={{ padding: 24, color: "#666" }}>Nenhum produto cadastrado.</p>}
        </div>
      )}
    </div>
  )
}
