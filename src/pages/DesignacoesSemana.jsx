import { useState, useEffect, useCallback } from "react"
import { fetchApi } from "../api"
import { openWhatsApp, copyToClipboard } from "../utils/whatsapp"

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default function DesignacoesSemana() {
  const [semanas, setSemanas] = useState([])
  const [tipos, setTipos] = useState([])
  const [detalhe, setDetalhe] = useState(null)
  const [dataNova, setDataNova] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [extraTipoId, setExtraTipoId] = useState("")
  const [extraTema, setExtraTema] = useState("")
  const [editParte, setEditParte] = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [assignParte, setAssignParte] = useState(null)
  const [assignPapel, setAssignPapel] = useState("dono")
  const [mostrarInelegiveis, setMostrarInelegiveis] = useState(false)

  const loadSemanas = useCallback(async () => {
    const res = await fetchApi("/api/desig/semanas")
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setSemanas(Array.isArray(data) ? data : [])
  }, [])

  const loadTipos = useCallback(async () => {
    const res = await fetchApi("/api/desig/tipos")
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setTipos(Array.isArray(data) ? data : [])
  }, [])

  const loadDetalhe = useCallback(async (id) => {
    const res = await fetchApi(`/api/desig/semanas/get?id=${id}`)
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setDetalhe(data)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        await Promise.all([loadSemanas(), loadTipos()])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [loadSemanas, loadTipos])

  async function criarSemana() {
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await fetchApi("/api/desig/semanas/create", {
        method: "POST",
        body: JSON.stringify({ data: dataNova, com_partes_fixas: true }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDetalhe(data)
      setSuccess(`Semana ${data.rotulo} pronta (reunião ${data.data_reuniao}).`)
      await loadSemanas()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function abrirSemana(id) {
    setError("")
    setSuccess("")
    setAssignParte(null)
    try {
      await loadDetalhe(id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function excluirSemana(id) {
    if (!confirm("Excluir esta semana e todas as designações?")) return
    try {
      const res = await fetchApi(`/api/desig/semanas/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      if (detalhe?.id === id) setDetalhe(null)
      await loadSemanas()
    } catch (e) {
      setError(e.message)
    }
  }

  async function adicionarParte() {
    if (!detalhe || !extraTipoId) return
    setError("")
    try {
      const res = await fetchApi("/api/desig/partes/create", {
        method: "POST",
        body: JSON.stringify({
          semana_id: detalhe.id,
          tipo_parte_id: extraTipoId,
          tema: extraTema,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setExtraTema("")
      await loadDetalhe(detalhe.id)
      setSuccess("Parte adicionada.")
    } catch (e) {
      setError(e.message)
    }
  }

  async function salvarParteEdit() {
    if (!editParte) return
    try {
      const res = await fetchApi(`/api/desig/partes/update?id=${editParte.id}`, {
        method: "POST",
        body: JSON.stringify({
          titulo: editParte.titulo,
          tema: editParte.tema,
          duracao_min: Number(editParte.duracao_min) || 0,
          ordem: editParte.ordem,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditParte(null)
      await loadDetalhe(detalhe.id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function removerParte(id) {
    if (!confirm("Remover esta parte?")) return
    try {
      const res = await fetchApi(`/api/desig/partes/delete?id=${id}`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      await loadDetalhe(detalhe.id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function abrirAssign(parte, papel) {
    setAssignParte(parte)
    setAssignPapel(papel)
    setMostrarInelegiveis(false)
    setError("")
    try {
      const res = await fetchApi(`/api/desig/candidatos?parte_id=${parte.id}&papel=${papel}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setCandidatos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
      setCandidatos([])
    }
  }

  async function designar(pessoaId) {
    if (!assignParte) return
    try {
      const res = await fetchApi("/api/desig/designacoes/set", {
        method: "POST",
        body: JSON.stringify({
          parte_id: assignParte.id,
          pessoa_id: pessoaId,
          papel: assignPapel,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setAssignParte(null)
      setSuccess("Designação salva.")
      await loadDetalhe(detalhe.id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function limparDesignacao(parteId, papel) {
    try {
      const res = await fetchApi("/api/desig/designacoes/clear", {
        method: "POST",
        body: JSON.stringify({ parte_id: parteId, papel }),
      })
      if (!res.ok) throw new Error(await res.text())
      await loadDetalhe(detalhe.id)
    } catch (e) {
      setError(e.message)
    }
  }

  async function enviarWhatsApp(parteId, papel) {
    try {
      const res = await fetchApi(`/api/desig/whatsapp?parte_id=${parteId}&papel=${papel}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      await copyToClipboard(data.mensagem || "")
      openWhatsApp(data.telefone, data.mensagem)
      setSuccess(
        data.telefone
          ? `WhatsApp aberto para ${data.pessoa_nome}. A mensagem também foi copiada.`
          : `${data.pessoa_nome} não tem telefone cadastrado. Escolha o contato no WhatsApp (mensagem já preenchida).`
      )
    } catch (e) {
      setError(e.message)
    }
  }

  function nomeDesignado(parte, papel) {
    const d = (parte.designacoes || []).find((x) => x.papel === papel)
    return d?.pessoa_nome || ""
  }

  const candidatosVisiveis = mostrarInelegiveis ? candidatos : candidatos.filter((c) => c.elegivel)
  const sugestoesIds = new Set(
    candidatosVisiveis.filter((c) => c.elegivel).slice(0, 3).map((c) => c.id)
  )

  const tiposVariaveis = tipos.filter(
    (t) =>
      !t.fixa ||
      t.codigo === "vida_crista_extra" ||
      t.codigo.startsWith("iniciando") ||
      ["cultivando_interesse", "explicando_crencas", "fazendo_discipulos", "discurso", "vida_crista_extra"].includes(
        t.codigo
      )
  )

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Designações da semana</h3>
      </div>
      <p className="text-muted mb-4">
        A reunião é na quinta-feira. Informe qualquer data da semana; o sistema monta o rótulo (ex.: 20-26 DE JULHO).
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
          <div className="form-row align-items-end">
            <div className="form-group col-md-4 mb-0">
              <label>Data (qualquer dia da semana)</label>
              <input
                type="date"
                className="form-control"
                value={dataNova}
                onChange={(e) => setDataNova(e.target.value)}
              />
            </div>
            <div className="form-group col-md-4 mb-0">
              <button type="button" className="btn btn-primary" onClick={criarSemana} disabled={loading}>
                Criar / abrir semana
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Semanas</h4>
              {semanas.length === 0 ? (
                <p className="text-muted mb-0">Nenhuma semana ainda.</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {semanas.map((s) => (
                    <li key={s.id} className="mb-2 d-flex justify-content-between align-items-center">
                      <button
                        type="button"
                        className={`btn btn-link p-0 text-left${detalhe?.id === s.id ? " font-weight-bold" : ""}`}
                        onClick={() => abrirSemana(s.id)}
                      >
                        {s.rotulo}
                        <br />
                        <small className="text-muted">Reunião {s.data_reuniao}</small>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => excluirSemana(s.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8 mb-4">
          {!detalhe ? (
            <div className="card">
              <div className="card-body text-muted">Selecione ou crie uma semana.</div>
            </div>
          ) : (
            <>
              <div className="card mb-3">
                <div className="card-body">
                  <h4 className="card-title mb-1">{detalhe.rotulo}</h4>
                  <p className="text-muted mb-3">
                    {detalhe.data_inicio} → {detalhe.data_fim} · Reunião quinta {detalhe.data_reuniao}
                  </p>

                  <div className="form-row align-items-end mb-3">
                    <div className="form-group col-md-5 mb-2">
                      <label>Adicionar parte variável</label>
                      <select
                        className="form-control"
                        value={extraTipoId}
                        onChange={(e) => setExtraTipoId(e.target.value)}
                      >
                        <option value="">Selecione…</option>
                        {tiposVariaveis.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.categoria} — {t.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group col-md-5 mb-2">
                      <label>Tema / texto</label>
                      <input
                        className="form-control"
                        value={extraTema}
                        onChange={(e) => setExtraTema(e.target.value)}
                        placeholder="Ex.: Jer. 20:7-18 (th lição 2)"
                      />
                    </div>
                    <div className="form-group col-md-2 mb-2">
                      <button type="button" className="btn btn-outline-primary btn-block" onClick={adicionarParte}>
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {(detalhe.partes || []).map((parte) => {
                    const dono = nomeDesignado(parte, "dono")
                    const ajudante = nomeDesignado(parte, "ajudante")
                    const editing = editParte?.id === parte.id
                    return (
                      <div key={parte.id} className="border rounded p-3 mb-3">
                        {editing ? (
                          <div className="mb-2">
                            <input
                              className="form-control mb-2"
                              value={editParte.titulo}
                              onChange={(e) => setEditParte({ ...editParte, titulo: e.target.value })}
                            />
                            <input
                              className="form-control mb-2"
                              value={editParte.tema}
                              onChange={(e) => setEditParte({ ...editParte, tema: e.target.value })}
                              placeholder="Tema"
                            />
                            <input
                              type="number"
                              className="form-control mb-2"
                              value={editParte.duracao_min}
                              onChange={(e) => setEditParte({ ...editParte, duracao_min: e.target.value })}
                              placeholder="Minutos"
                            />
                            <button type="button" className="btn btn-sm btn-primary mr-2" onClick={salvarParteEdit}>
                              Salvar tema
                            </button>
                            <button type="button" className="btn btn-sm btn-light" onClick={() => setEditParte(null)}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="d-flex justify-content-between">
                              <div>
                                <strong>{parte.titulo}</strong>
                                {parte.duracao_min > 0 ? ` (${parte.duracao_min} min)` : ""}
                                <div className="text-muted small">{parte.categoria}</div>
                                {parte.tema && <div>{parte.tema}</div>}
                              </div>
                              <div className="text-nowrap">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary mr-1"
                                  onClick={() => setEditParte({ ...parte })}
                                >
                                  Tema
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removerParte(parte.id)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="mb-1">
                                <strong>Dono:</strong> {dono || <em className="text-muted">não designado</em>}{" "}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link"
                                  onClick={() => abrirAssign(parte, "dono")}
                                >
                                  {dono ? "Trocar" : "Designar"}
                                </button>
                                {dono && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link"
                                      onClick={() => limparDesignacao(parte.id, "dono")}
                                    >
                                      Limpar
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link"
                                      onClick={() => enviarWhatsApp(parte.id, "dono")}
                                    >
                                      WhatsApp
                                    </button>
                                  </>
                                )}
                              </div>
                              {parte.permite_ajudante && (
                                <div>
                                  <strong>Ajudante:</strong>{" "}
                                  {ajudante || <em className="text-muted">não designado</em>}{" "}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link"
                                    onClick={() => abrirAssign(parte, "ajudante")}
                                  >
                                    {ajudante ? "Trocar" : "Designar"}
                                  </button>
                                  {ajudante && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-link"
                                        onClick={() => limparDesignacao(parte.id, "ajudante")}
                                      >
                                        Limpar
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-link"
                                        onClick={() => enviarWhatsApp(parte.id, "ajudante")}
                                      >
                                        WhatsApp
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {assignParte && (
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">
                      Designar {assignPapel} — {assignParte.titulo}
                    </h4>
                    <div className="d-flex align-items-center mb-3">
                      <button type="button" className="btn btn-sm btn-light mr-3" onClick={() => setAssignParte(null)}>
                        Fechar
                      </button>
                      <div className="form-check mb-0">
                        <label className="form-check-label">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={mostrarInelegiveis}
                            onChange={(e) => setMostrarInelegiveis(e.target.checked)}
                          />{" "}
                          Mostrar quem não pode fazer esta parte
                          <i className="input-helper" />
                        </label>
                      </div>
                    </div>
                    <p className="text-muted small mb-3">
                      Lista ordenada por sugestão: quem está há mais tempo sem designação (ou nunca designado) aparece
                      primeiro. Os 3 primeiros elegíveis são destacados.
                    </p>
                    {candidatosVisiveis.length === 0 && (
                      <p className="text-muted">
                        Nenhum irmão disponível para esta parte. Verifique o cadastro ou marque a opção acima para ver
                        os motivos.
                      </p>
                    )}
                    <div className="table-responsive">
                      <table className="table table-sm table-hover">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>8 sem.</th>
                            <th>Sugestão / última</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {candidatosVisiveis.map((c) => (
                            <tr key={c.id} className={c.elegivel ? "" : "table-secondary"}>
                              <td>
                                {c.nome}
                                {sugestoesIds.has(c.id) && (
                                  <span className="badge badge-success ml-2">Sugestão</span>
                                )}
                                {!c.elegivel && (
                                  <div className="small text-danger">{c.motivo_inelegivel}</div>
                                )}
                              </td>
                              <td>{c.tipo}</td>
                              <td>{c.designacoes_ultimas_8_semanas}</td>
                              <td>{c.alerta || "—"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  disabled={!c.elegivel}
                                  onClick={() => designar(c.id)}
                                >
                                  Escolher
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
