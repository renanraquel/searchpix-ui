import { useState, useEffect } from "react"
import { fetchApi } from "../api"

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function DesignacoesLembretes() {
  const [date, setDate] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function load(d = date) {
    setLoading(true)
    setError("")
    try {
      const res = await fetchApi(`/api/desig/lembretes?date=${d}`)
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function copiar(msg) {
    const ok = await copyText(msg)
    setSuccess(ok ? "Mensagem copiada." : msg)
  }

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Lembretes da semana</h3>
      </div>
      <p className="text-muted mb-4">
        Mostra quem está designado na semana (segunda a domingo) que contém a data informada — para lembrar pelo
        WhatsApp.
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
              <label>Data de referência</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group col-md-3 mb-0">
              <button type="button" className="btn btn-primary" onClick={() => load()} disabled={loading}>
                Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted">Carregando…</p>}

      {!loading && data && (
        <div className="card">
          <div className="card-body">
            {data.semana ? (
              <>
                <h4 className="card-title">Semana {data.semana.rotulo}</h4>
                <p className="text-muted">
                  {data.semana.data_inicio} → {data.semana.data_fim} · Reunião {data.semana.data_reuniao}
                </p>
                {(data.itens || []).length === 0 ? (
                  <p className="text-muted mb-0">Ainda não há designações nesta semana.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Parte</th>
                          <th>Papel</th>
                          <th>Irmão</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.itens.map((item, idx) => (
                          <tr key={`${item.parte_id}-${item.papel}-${idx}`}>
                            <td>
                              <strong>{item.titulo}</strong>
                              {item.duracao_min > 0 ? ` (${item.duracao_min} min)` : ""}
                              {item.tema ? <div className="small text-muted">{item.tema}</div> : null}
                            </td>
                            <td>{item.papel === "dono" ? "Dono" : "Ajudante"}</td>
                            <td>{item.pessoa_nome}</td>
                            <td className="text-right text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => copiar(item.mensagem_whatsapp)}
                              >
                                Copiar WhatsApp
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted mb-0">{data.mensagem || "Nenhuma semana encontrada."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
