import { useState, useEffect } from "react"
import { fetchApi } from "../api"

function nameToUpper(s) {
  return String(s).toLocaleUpperCase("pt-BR")
}

function maskPhone(v) {
  const n = v.replace(/\D/g, "").slice(0, 11)
  if (n.length <= 2) return n.replace(/(\d{0,2})/, "($1")
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? `-${c}` : ""}`)
}

const emptyForm = {
  nome: "",
  tipo: "estudante",
  sexo: "M",
  telefone: "",
  ativo: true,
  qualificado_tesouros: false,
  disponivel_oracao_inicial: true,
  qualificado_presidente: false,
  capacidade: "pleno",
}

const tipoLabel = { estudante: "Estudante", servo: "Servo", anciao: "Ancião" }

export default function DesignacoesIrmaos() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await fetchApi("/api/desig/pessoas")
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

  function startEdit(p) {
    setEditing(p)
    setForm({
      nome: p.nome || "",
      tipo: p.tipo,
      sexo: p.sexo,
      telefone: maskPhone(p.telefone || ""),
      ativo: !!p.ativo,
      qualificado_tesouros: !!p.qualificado_tesouros,
      disponivel_oracao_inicial: !!p.disponivel_oracao_inicial,
      qualificado_presidente: !!p.qualificado_presidente,
      capacidade: p.capacidade || "pleno",
    })
    setError("")
    setSuccess("")
  }

  function resetForm() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setError("Informe o nome.")
      return
    }
    setError("")
    const payload = {
      ...form,
      nome: nameToUpper(form.nome).trim(),
      telefone: form.telefone.replace(/\D/g, ""),
    }
    try {
      const res = editing
        ? await fetchApi(`/api/desig/pessoas/update?id=${editing.id}`, {
            method: "POST",
            body: JSON.stringify(payload),
          })
        : await fetchApi("/api/desig/pessoas/create", {
            method: "POST",
            body: JSON.stringify(payload),
          })
      if (!res.ok) throw new Error(await res.text())
      setSuccess(editing ? "Irmão atualizado." : "Irmão cadastrado.")
      resetForm()
      load()
    } catch (e) {
      setError(e.message)
      setSuccess("")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este cadastro?")) return
    try {
      const res = await fetchApi(`/api/desig/pessoas/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const showServoFlags = form.tipo === "servo" || form.tipo === "anciao"
  const showAnciaoFlags = form.tipo === "anciao"
  const showOracaoInicial =
    form.sexo === "M" && (form.tipo === "estudante" || form.tipo === "servo" || form.tipo === "anciao")

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Irmãos — Designações</h3>
      </div>
      <p className="text-muted mb-4">
        Cadastre estudantes, servos e anciãos com as qualificações usadas na reunião do meio de semana.
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
          <h4 className="card-title">{editing ? "Editar" : "Novo cadastro"}</h4>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 form-group">
                <label>Nome</label>
                <input
                  className="form-control"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: nameToUpper(e.target.value) })}
                  required
                />
              </div>
              <div className="col-md-3 form-group">
                <label>Tipo</label>
                <select
                  className="form-control"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="estudante">Estudante</option>
                  <option value="servo">Servo</option>
                  <option value="anciao">Ancião</option>
                </select>
              </div>
              <div className="col-md-3 form-group">
                <label>Sexo</label>
                <select
                  className="form-control"
                  value={form.sexo}
                  onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Telefone (WhatsApp)</label>
                <input
                  className="form-control"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })}
                />
              </div>
              <div className="col-md-4 form-group">
                <label>Capacidade</label>
                <select
                  className="form-control"
                  value={form.capacidade}
                  onChange={(e) => setForm({ ...form, capacidade: e.target.value })}
                >
                  <option value="pleno">Pleno</option>
                  <option value="limitado">Limitado</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="form-check">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  />{" "}
                  Ativo
                  <i className="input-helper" />
                </label>
              </div>
              {showServoFlags && (
                <div className="form-check">
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={form.qualificado_tesouros}
                      onChange={(e) => setForm({ ...form, qualificado_tesouros: e.target.checked })}
                    />{" "}
                    Qualificado para Tesouros da Palavra
                    <i className="input-helper" />
                  </label>
                </div>
              )}
              {showOracaoInicial && (
                <div className="form-check">
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={form.disponivel_oracao_inicial}
                      onChange={(e) =>
                        setForm({ ...form, disponivel_oracao_inicial: e.target.checked })
                      }
                    />{" "}
                    Disponível para oração inicial (chega cedo)
                    <i className="input-helper" />
                  </label>
                </div>
              )}
              {showAnciaoFlags && (
                <div className="form-check">
                  <label className="form-check-label">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={form.qualificado_presidente}
                      onChange={(e) => setForm({ ...form, qualificado_presidente: e.target.checked })}
                    />{" "}
                    Qualificado para presidente da reunião
                    <i className="input-helper" />
                  </label>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary mr-2">
              {editing ? "Salvar" : "Cadastrar"}
            </button>
            {editing && (
              <button type="button" className="btn btn-light" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h4 className="card-title">Cadastrados</h4>
          {loading ? (
            <p className="text-muted">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted">Nenhum cadastro ainda.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Sexo</th>
                    <th>Capacidade</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{tipoLabel[p.tipo] || p.tipo}</td>
                      <td>{p.sexo === "M" ? "Masc." : "Fem."}</td>
                      <td>{p.capacidade === "limitado" ? "Limitado" : "Pleno"}</td>
                      <td>{p.ativo ? "Ativo" : "Inativo"}</td>
                      <td className="text-right text-nowrap">
                        <button type="button" className="btn btn-sm btn-outline-primary mr-1" onClick={() => startEdit(p)}>
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
          )}
        </div>
      </div>
    </div>
  )
}
