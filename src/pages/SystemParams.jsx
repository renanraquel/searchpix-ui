import { useState, useEffect } from "react"
import { fetchApi, apiUrl, getToken, getTenant } from "../api"

function onlyDigits(s) {
  return String(s).replace(/\D/g, "")
}

function maskCNPJInput(v) {
  const n = onlyDigits(v).slice(0, 14)
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
}

export default function SystemParams() {
  const [nfceCnpjInput, setNfceCnpjInput] = useState("")
  const [nfceEmitters, setNfceEmitters] = useState([])
  const [nfceSaving, setNfceSaving] = useState(false)
  const [nfceMsg, setNfceMsg] = useState({ type: "", text: "" })

  const [bgUploading, setBgUploading] = useState(false)
  const [bgMessage, setBgMessage] = useState("")

  const tenant = getTenant()
  const tenantSlug = tenant?.slug || tenant?.Slug || "seu-tenant"
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/resgatar?tenant=${tenantSlug}`
      : `https://searchpix-ui.onrender.com/resgatar?tenant=${tenantSlug}`

  useEffect(() => {
    const t = getTenant()
    const raw = t?.nfce_emitter_cnpj || t?.NfceEmitterCNPJ || ""
    if (raw) setNfceEmitters([raw])
  }, [])

  useEffect(() => {
    async function loadEmitters() {
      try {
        const res = await fetchApi("/api/tenants/nfce-emitters")
        if (!res.ok) return
        const data = await res.json()
        setNfceEmitters(Array.isArray(data.emitters) ? data.emitters : [])
      } catch {
        // ignore
      }
    }
    loadEmitters()
  }, [])

  async function saveNfceEmitterCNPJ(e) {
    e.preventDefault()
    const d = onlyDigits(nfceCnpjInput)
    if (d.length !== 14) {
      setNfceMsg({ type: "error", text: "Informe o CNPJ completo (14 dígitos) que aparece como emitente na NFC-e." })
      return
    }
    setNfceSaving(true)
    setNfceMsg({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/tenants/nfce-emitters", {
        method: "POST",
        body: JSON.stringify({ nfce_emitter_cnpj: d }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || res.statusText)
      const data = JSON.parse(text)
      const emitters = Array.isArray(data.emitters) ? data.emitters : []
      setNfceEmitters(emitters)
      setNfceCnpjInput("")
      setNfceMsg({
        type: "success",
        text: data.message || "CNPJ adicionado. Só notas emitidas por CNPJs cadastrados pontuarão pelo link público.",
      })
    } catch (err) {
      setNfceMsg({ type: "error", text: err.message || "Erro ao salvar." })
    } finally {
      setNfceSaving(false)
    }
  }

  async function removeNfceEmitter(cnpj) {
    setNfceSaving(true)
    setNfceMsg({ type: "", text: "" })
    try {
      const res = await fetchApi("/api/tenants/nfce-emitters", {
        method: "DELETE",
        body: JSON.stringify({ nfce_emitter_cnpj: cnpj }),
      })
      const text = await res.text()
      if (!res.ok) throw new Error(text || res.statusText)
      const data = JSON.parse(text)
      setNfceEmitters(Array.isArray(data.emitters) ? data.emitters : [])
      setNfceMsg({ type: "success", text: data.message || "CNPJ removido." })
    } catch (err) {
      setNfceMsg({ type: "error", text: err.message || "Erro ao remover." })
    } finally {
      setNfceSaving(false)
    }
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

  return (
    <div>
      <div className="page-header">
        <h3 className="page-title">Parâmetros sistema</h3>
      </div>

      <div className="card border-primary mb-4">
        <div className="card-body">
          <h5 className="card-title">Pontos pela NFC-e (link público)</h5>
          <p className="text-dark mb-3" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
            Cadastre <strong>um ou mais CNPJs emitentes</strong> das suas notas (os mesmos que aparecem na chave de acesso).
            Assim, só notas emitidas por CNPJs desta lista geram pontos; notas de outros CNPJs são recusadas.
          </p>
          <form onSubmit={saveNfceEmitterCNPJ} className="mb-0">
            <div className="form-group mb-2">
              <label htmlFor="sys-nfce-emitter-cnpj">CNPJ emissor da NFC-e</label>
              <input
                id="sys-nfce-emitter-cnpj"
                type="text"
                className="form-control"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0001-00"
                value={nfceCnpjInput}
                onChange={(e) => setNfceCnpjInput(maskCNPJInput(e.target.value))}
                maxLength={18}
              />
            </div>
            {nfceMsg.text && (
              <div
                className={`cp-alert mb-2 ${nfceMsg.type === "error" ? "cp-alert-danger" : "cp-alert-success"}`}
                role="alert"
              >
                {nfceMsg.text}
              </div>
            )}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-dark font-weight-bold">CNPJs cadastrados para validar notas</small>
                <small className="text-muted">{nfceEmitters.length} cadastrado(s)</small>
              </div>
              {nfceEmitters.length === 0 ? (
                <div className="border rounded p-2 bg-light">
                  <small className="text-muted mb-0 d-block">
                    Nenhum CNPJ cadastrado ainda. Adicione pelo menos 1 para ativar a pontuação por NFC-e.
                  </small>
                </div>
              ) : (
                <ul className="list-group">
                  {nfceEmitters.map((cnpj) => (
                    <li key={cnpj} className="list-group-item d-flex justify-content-between align-items-center py-2">
                      <span className="font-weight-bold text-dark">{maskCNPJInput(cnpj)}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeNfceEmitter(cnpj)}
                        disabled={nfceSaving}
                        aria-label={`Remover CNPJ ${maskCNPJInput(cnpj)}`}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="btn btn-outline-primary" disabled={nfceSaving}>
              {nfceSaving ? "Salvando…" : "Adicionar CNPJ"}
            </button>
          </form>
        </div>
      </div>

      <div className="card mb-4 border-primary">
        <div className="card-body">
          <h5 className="card-title">Imagem de fundo da tela pública</h5>
          <p className="card-text text-muted small mb-2">
            Essa imagem aparece na tela externa de consulta de pontos:{" "}
            <code className="text-break">{publicUrl}</code>
          </p>
          <input type="file" accept="image/*" disabled={bgUploading} className="form-control-file" onChange={handleBackgroundChange} />
          {bgMessage && (
            <p className={`small mt-2 mb-0 ${bgMessage.includes("sucesso") ? "text-success" : "text-danger"}`}>{bgMessage}</p>
          )}
        </div>
      </div>
    </div>
  )
}
