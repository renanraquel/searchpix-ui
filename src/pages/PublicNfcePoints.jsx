import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Html5Qrcode } from "html5-qrcode"
import { apiUrl } from "../api"

const READER_ELEMENT_ID = "nfce-qr-reader"

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
  const [startingCamera, setStartingCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(null)
  const scannerRef = useRef(null)

  const stopScanner = useCallback(async () => {
    const instance = scannerRef.current
    scannerRef.current = null
    if (instance) {
      try {
        if (instance.isScanning) await instance.stop()
      } catch {
        /* ignore */
      }
      try {
        instance.clear()
      } catch {
        /* ignore */
      }
    }
    setCameraOn(false)
    setStartingCamera(false)
  }, [])

  useEffect(() => {
    return () => {
      void stopScanner()
    }
  }, [stopScanner])

  async function startScanner() {
    setError("")
    setSuccess(null)
    if (scannerRef.current || startingCamera) return
    setCameraOn(true)
    setStartingCamera(true)
    await new Promise((resolve) => requestAnimationFrame(() => resolve()))
    const html5 = new Html5Qrcode(READER_ELEMENT_ID, {
      verbose: false,
      useBarCodeDetectorIfSupported: true,
    })
    scannerRef.current = html5
    try {
      await html5.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight)
            const size = Math.max(200, Math.floor(edge * 0.88))
            return { width: size, height: size }
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          setQrPayload(String(decodedText).trim())
          void stopScanner()
        },
        () => {}
      )
    } catch (err) {
      scannerRef.current = null
      try {
        html5.clear()
      } catch {
        /* ignore */
      }
      setCameraOn(false)
      const msg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : String(err)
      if (/NotFoundError|not found/i.test(msg) || /OverconstrainedError/i.test(msg)) {
        setError(
          "Não foi possível abrir a câmera traseira neste aparelho. Use um celular com câmera de trás e permita o acesso à câmera (site em HTTPS)."
        )
      } else if (/NotAllowedError|Permission/i.test(msg)) {
        setError("Permissão da câmera negada. Permita o uso da câmera nas configurações do navegador.")
      } else {
        setError(
          "Não foi possível iniciar a câmera. Confirme permissões, use HTTPS e, se estiver no computador, teste no celular."
        )
      }
    } finally {
      setStartingCamera(false)
    }
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
      setError("Leia o QR code da nota com a câmera antes de acumular.")
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
      <p className="text-muted small mb-2">
        Piloto <strong>Paraná</strong>: informe o CPF cadastrado e use só a <strong>câmera traseira</strong> para ler o{" "}
        <strong>QR code da nota</strong> (impresso no papel). O valor vem da consulta da SEFAZ. Cada nota vale uma vez.
      </p>
      <p className="text-muted small mb-4">
        <strong>Dica:</strong> apontar a câmera para uma imagem na tela do computador costuma não ler o código; filme o QR na
        nota física ou em outro celular.
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
          <label className="d-block">QR code da nota (somente leitura pela câmera)</label>
          {qrPayload ? (
            <div className="mb-2">
              <p className="text-success small font-weight-bold mb-1">Nota lida com sucesso.</p>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearNota}>
                Ler outra nota
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-primary mb-2"
                disabled={startingCamera}
                onClick={() => void (cameraOn ? stopScanner() : startScanner())}
              >
                {startingCamera
                  ? "Abrindo câmera…"
                  : cameraOn
                    ? "Parar leitura"
                    : "Ler QR code com a câmera traseira"}
              </button>
              {cameraOn && (
                <div className="mb-3">
                  <p className="small text-muted mb-1">Enquadre o QR code no centro; a câmera usada é a de trás.</p>
                  <div
                    id={READER_ELEMENT_ID}
                    className="rounded overflow-hidden"
                    style={{ maxWidth: "100%", minHeight: startingCamera ? 200 : undefined }}
                  />
                </div>
              )}
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
          {loading ? "Enviando…" : "Acumular pontos"}
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
