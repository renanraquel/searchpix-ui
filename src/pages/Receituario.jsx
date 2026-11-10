import { useState } from "react"

const PROFISSIONAL = {
  nome: "Vera Lucia Ronque Rodrigues",
  coren: "Coren PR/472776",
  endereco: "Rua: Acre 201",
  telefone: "Telefone: 991197470",
}

function formatDataHoje() {
  return new Date().toLocaleDateString("pt-BR")
}

export default function Receituario() {
  const [nomePaciente, setNomePaciente] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState("")

  function handleCancelar() {
    setNomePaciente("")
    setDescricao("")
    setPreview(null)
    setError("")
  }

  function handleGerar(e) {
    e.preventDefault()
    const nome = nomePaciente.trim()
    const texto = descricao.trim()
    if (!nome) {
      setError("Informe o nome do paciente.")
      setPreview(null)
      return
    }
    if (!texto) {
      setError("Informe a descrição da receita.")
      setPreview(null)
      return
    }
    setError("")
    setPreview({
      nome,
      descricao: texto,
      data: formatDataHoje(),
    })
  }

  function handleImprimir() {
    window.print()
  }

  return (
    <div className="receituario-page">
      <div className="page-header no-print">
        <h3 className="page-title">Receituário</h3>
      </div>

      {error && <div className="cp-alert cp-alert-danger no-print">{error}</div>}

      <div className="card mb-4 no-print">
        <div className="card-body">
          <form onSubmit={handleGerar}>
            <div className="form-group">
              <label htmlFor="receituario-nome">NOME DO PACIENTE:</label>
              <input
                id="receituario-nome"
                type="text"
                className="form-control"
                value={nomePaciente}
                onChange={(e) => setNomePaciente(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="receituario-descricao">DESCRIÇÃO:</label>
              <textarea
                id="receituario-descricao"
                className="form-control"
                rows={12}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="d-flex flex-wrap" style={{ gap: "0.75rem" }}>
              <button type="submit" className="btn btn-primary">
                Gerar
              </button>
              <button type="button" className="btn btn-light" onClick={handleCancelar}>
                Cancelar
              </button>
              {preview && (
                <button type="button" className="btn btn-success" onClick={handleImprimir}>
                  Imprimir
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {preview && (
        <div className="card receituario-preview-card">
          <div className="card-body">
            <div className="receituario-sheet" id="receituario-print-area">
              <header className="receituario-sheet-header">
                <img
                  src="/receituario-logo.png"
                  alt="Ronque Rodrigues"
                  className="receituario-logo"
                />
                <div className="receituario-profissional">
                  <div className="receituario-profissional-nome">{PROFISSIONAL.nome}</div>
                  <div>{PROFISSIONAL.coren}</div>
                  <div>{PROFISSIONAL.endereco}</div>
                  <div>{PROFISSIONAL.telefone}</div>
                </div>
              </header>

              <div className="receituario-meta">
                <div className="receituario-meta-row">
                  <span className="receituario-label">NOME:</span>
                  <span className="receituario-value">{preview.nome}</span>
                </div>
                <div className="receituario-meta-row receituario-meta-data">
                  <span className="receituario-label">DATA:</span>
                  <span className="receituario-value">{preview.data}</span>
                </div>
              </div>

              <div className="receituario-descricao">
                {preview.descricao.split("\n").map((line, i) => (
                  <p key={i}>{line || "\u00A0"}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
