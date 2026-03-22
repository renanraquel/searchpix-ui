import { useState, useEffect } from "react"
import { fetchApi, apiUrl, getToken } from "../api"

function descToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
}

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
    const description = descToUpper(form.description).trim()
    if (!description || !points || points < 1) {
      setError("Descrição e pontos (maior que 0) são obrigatórios.")
      return
    }
    setError("")
    try {
      const formData = new FormData()
      formData.append("description", description)
      formData.append("points_required", String(points))
      if (imageFile) formData.append("image", imageFile)
      const token = getToken()
      const url = editing ? apiUrl(`/api/products/update?id=${editing.id}`) : apiUrl("/api/products/create")
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
      description: descToUpper(p.description || ""),
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
    <div>
      <div className="page-header">
        <h3 className="page-title">Produtos para resgate</h3>
      </div>
      <p className="text-muted mb-4">
        Configure os itens que poderão ser trocados por pontos. Capriche nas imagens e descrições para estimular o resgate.
      </p>

      {error && (
        <div className="cp-alert cp-alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{editing ? "Editar produto" : "Novo produto"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row align-items-end">
              <div className="col-md-4 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="prod-img">Imagem</label>
                  <input id="prod-img" type="file" accept="image/*" className="form-control-file" onChange={handleImageChange} />
                  {(imageFile || editing?.image_url) && (
                    <small className="form-text text-muted">
                      {imageFile ? "Nova imagem selecionada. Salve para gravar." : "Imagem no banco. Selecione outra para substituir."}
                    </small>
                  )}
                </div>
              </div>
              <div className="col-md-4 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="prod-desc">Descrição *</label>
                  <input
                    id="prod-desc"
                    type="text"
                    className="form-control text-uppercase"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: descToUpper(e.target.value) }))}
                    required
                    placeholder="NOME DO PRODUTO"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="col-md-2 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="prod-pts">Pontos *</label>
                  <input
                    id="prod-pts"
                    type="number"
                    min={1}
                    className="form-control"
                    value={form.points_required}
                    onChange={(e) => setForm((f) => ({ ...f, points_required: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-auto mb-3">
                <button
                  type="submit"
                  className={`btn ${editing ? "btn-success" : "btn-primary"} mr-md-2 mb-2 mb-md-0 btn-block d-md-inline-block`}
                >
                  {editing ? "Salvar" : "Cadastrar"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-block d-md-inline-block"
                    onClick={() => {
                      setEditing(null)
                      setImageFile(null)
                      setForm({ description: "", points_required: "" })
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Descrição</th>
                  <th className="text-right">Pontos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(list || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.image_url ? (
                        <img
                          src={p.image_url.startsWith("http") ? p.image_url : apiUrl(p.image_url)}
                          alt=""
                          className="rounded"
                          style={{ maxWidth: 60, maxHeight: 60, objectFit: "cover" }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-uppercase">{descToUpper(p.description || "")}</td>
                    <td className="text-right">{p.points_required}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-primary mr-2" onClick={() => startEdit(p)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="text-muted p-3">Nenhum produto cadastrado.</p>}
        </>
      )}
    </div>
  )
}
