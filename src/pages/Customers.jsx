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

/** Nome sempre em maiúsculas (pt-BR), inclusive acentos. */
function nameToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
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
            name: nameToUpper(form.name).trim(),
            phone: form.phone.replace(/\D/g, ""),
          }),
        })
        if (!res.ok) throw new Error(await res.text())
      } else {
        const res = await fetchApi("/api/customers/create", {
          method: "POST",
          body: JSON.stringify({
            cpf: form.cpf.replace(/\D/g, ""),
            name: nameToUpper(form.name).trim(),
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
      name: nameToUpper(c.name || ""),
      phone: maskPhone(c.phone),
    })
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Clientes</h3>
      </div>
      <p className="text-muted mb-4">
        Cadastre e gerencie os clientes que poderão acumular e resgatar pontos no programa de fidelidade.
      </p>

      {error && (
        <div className="cp-alert cp-alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="cp-alert cp-alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">{editing ? "Editar cliente" : "Novo cliente"}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row align-items-end">
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="cust-cpf">CPF *</label>
                  <input
                    id="cust-cpf"
                    type="text"
                    className="form-control"
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: maskCPF(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
              <div className="col-md-4 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="cust-name">Nome *</label>
                  <input
                    id="cust-name"
                    type="text"
                    className="form-control text-uppercase"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: nameToUpper(e.target.value) }))}
                    required
                    placeholder="NOME COMPLETO"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="form-group mb-0">
                  <label htmlFor="cust-phone">Celular *</label>
                  <input
                    id="cust-phone"
                    type="text"
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="col-md-auto mb-3">
                <button type="submit" className={`btn ${editing ? "btn-success" : "btn-primary"} mr-2`}>
                  {editing ? "Salvar" : "Cadastrar"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setEditing(null)
                      setError("")
                      setSuccess("")
                      setForm({ cpf: "", name: "", phone: "" })
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
                  <th>CPF</th>
                  <th>Nome</th>
                  <th>Celular</th>
                  <th className="text-right">Pontos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id}>
                    <td>{maskCPF(c.cpf)}</td>
                    <td>{c.name}</td>
                    <td>{maskPhone(c.phone)}</td>
                    <td className="text-right">{c.points_balance ?? 0}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-primary mr-2" onClick={() => startEdit(c)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="text-muted p-3">Nenhum cliente cadastrado.</p>}
          {list.length > 0 && (
            <div className="d-flex align-items-center flex-wrap mt-3">
              <span className="text-muted mr-3 mb-2 mb-sm-0">
                Página {page} de {totalPages} — {total} cliente(s)
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mr-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
