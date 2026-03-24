import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Html5QrcodeScanner } from "html5-qrcode"
import { apiUrl } from "../api"

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

export default function PublicNfcePoints() {
  const [searchParams] = useSearchParams()
  const tenantSlug = searchParams.get("tenant") || ""
  const [cpf, setCpf] = useState("")
  const [qrPayload, setQrPayload] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(null)
  const scannerRef = useRef(null)

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopScanner(), [stopScanner])

  function startScanner() {
    setError("")
    setSuccess(null)
    if (scannerRef.current) return
    setCameraOn(true)
    requestAnimationFrame(() => {
      const scanner = new Html5QrcodeScanner(
        "nfce-qr-reader",
        { fps: 8, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
        false
      )
      scannerRef.current = scanner
      scanner.render(
        (decodedText) => {
          setQrPayload(String(decodedText).trim())
          stopScanner()
        },
        () => {}
      )
    })
  }

  function clearNota() {
    setQrPayload("")
    setSuccess(null)
    setError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSuccess(null)
    const raw = cpf.replace(/\D/g, "")
    if (raw.length !== 11) {
      setError("Informe um CPF válido com 11 dígitos.")
      return
    }
    if (!qrPayload.trim()) {
      setError("Use a câmera para ler o QR code impresso na nota fiscal.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl("/api/public/nfce-points"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          cpf: raw,
          qr_payload: qrPayload.trim(),
        }),
      })
      const text = await res.text()
      if (!res.ok) {
        setError(text || res.statusText)
        return
      }
      setSuccess(JSON.parse(text))
      setQrPayload("")
    } catch (err) {
      setError(err.message || "Erro ao enviar.")
    } finally {
      setLoading(false)
    }
  }

  if (!tenantSlug) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted mb-0">
          Use o link do estabelecimento. Ex.: <code>/pontos-nota?tenant=slug-da-loja</code>
        </p>
        <p className="text-muted small mt-2 mb-0">
          <Link to="/cadastro" className="text-primary">
            Cadastro no programa
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container py-4 px-3" style={{ maxWidth: 520 }}>
      <h1 className="h4 mb-2">Pontos pela nota (NFC-e)</h1>
      <p className="text-muted small mb-4">
        Piloto <strong>Paraná</strong>: informe seu CPF, aponte a câmera para o <strong>QR code da nota</strong>. O valor é
        obtido na consulta da SEFAZ. Cada nota só pode ser usada uma vez.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nfce-cpf">CPF (cadastrado no programa)</label>
          <input
            id="nfce-cpf"
            type="text"
            className="form-control"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label className="d-block">QR code da nota</label>
          {qrPayload ? (
            <div className="mb-2">
              <p className="text-success small font-weight-bold mb-1">Nota lida com sucesso.</p>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearNota}>
                Escanear outra nota
              </button>
            </div>
          ) : (
            <>
              <button type="button" className="btn btn-outline-primary mb-2" onClick={cameraOn ? stopScanner : startScanner}>
                {cameraOn ? "Parar câmera" : "Abrir câmera e escanear QR"}
              </button>
              {cameraOn && <div id="nfce-qr-reader" className="mb-3" />}
            </>
          )}
        </div>

        {error && (
          <div className="cp-alert cp-alert-danger mb-3" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="cp-alert cp-alert-success mb-3" role="status">
            <strong>{success.message}</strong>
            <p className="mb-0 small mt-2">
              +{success.points_added} pts · Novo saldo: {success.new_balance} pts
            </p>
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !qrPayload.trim()}>
          {loading ? "Enviando..." : "Acumular pontos"}
        </button>
      </form>

      <p className="text-muted small mt-4 mb-0">
        <Link to={`/resgatar?tenant=${encodeURIComponent(tenantSlug)}`}>Ver saldo e resgates</Link>
        {" · "}
        <Link to={`/cadastro?tenant=${encodeURIComponent(tenantSlug)}`}>Cadastro</Link>
      </p>
    </div>
  )
}
