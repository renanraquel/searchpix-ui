import { useState } from "react"

function formatDataHoje() {
  return new Date().toLocaleDateString("pt-BR")
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function templateUrl() {
  return `${window.location.origin}/receituario-template.jpg`
}

function buildPrintHtml({ nome, descricao, data }, bgUrl) {
  const descricaoHtml = escapeHtml(descricao)
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 210mm;
      height: 297mm;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      position: relative;
      width: 210mm;
      height: 297mm;
      background: #fff url("${bgUrl}") center / 100% 100% no-repeat;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    .field-nome {
      position: absolute;
      left: 16.5%;
      top: 26.4%;
      width: 52%;
      font-size: 14pt;
      font-weight: 600;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .field-descricao {
      position: absolute;
      left: 10%;
      top: 32%;
      width: 80%;
      height: 36%;
      font-size: 13pt;
      line-height: 1.45;
      overflow: hidden;
      white-space: pre-wrap;
    }
    .field-descricao p { margin: 0 0 0.2em; }
    .field-data {
      position: absolute;
      left: 16%;
      top: 71.6%;
      width: 40%;
      font-size: 14pt;
      font-weight: 600;
      line-height: 1.15;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="field-nome">${escapeHtml(nome)}</div>
    <div class="field-descricao">${descricaoHtml}</div>
    <div class="field-data">${escapeHtml(data)}</div>
  </div>
</body>
</html>`
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
    if (!preview) return
    setError("")

    const bgUrl = templateUrl()
    const html = buildPrintHtml(preview, bgUrl)

    // iframe oculto: não dispara bloqueio de pop-up
    const existing = document.getElementById("receituario-print-frame")
    if (existing) existing.remove()

    const iframe = document.createElement("iframe")
    iframe.id = "receituario-print-frame"
    iframe.title = "Impressão receituário"
    iframe.setAttribute("aria-hidden", "true")
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      visibility: "hidden",
    })
    document.body.appendChild(iframe)

    const frameWindow = iframe.contentWindow
    const frameDoc = frameWindow?.document
    if (!frameWindow || !frameDoc) {
      setError("Não foi possível preparar a impressão.")
      iframe.remove()
      return
    }

    frameDoc.open()
    frameDoc.write(html)
    frameDoc.close()

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000)
    }

    const triggerPrint = () => {
      try {
        frameWindow.focus()
        frameWindow.print()
      } finally {
        cleanup()
      }
    }

    const img = new frameWindow.Image()
    img.onload = () => setTimeout(triggerPrint, 200)
    img.onerror = () => setTimeout(triggerPrint, 400)
    img.src = bgUrl
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
        <div className="card receituario-preview-card no-print">
          <div className="card-body">
            <div className="receituario-sheet" aria-label="Pré-visualização da receita">
              <div className="receituario-field-nome">{preview.nome}</div>
              <div className="receituario-field-descricao">
                {preview.descricao.split("\n").map((line, i) => (
                  <p key={i}>{line || "\u00A0"}</p>
                ))}
              </div>
              <div className="receituario-field-data">{preview.data}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
