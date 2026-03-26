import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import QrScanner from "qr-scanner"
import { apiUrl } from "../api"

/** QR de NFC-e é denso e longo; o BarcodeDetector do navegador costuma falhar onde a câmera nativa acerta. Forçar o worker jsQR do qr-scanner. */
function forceWorkerQrEngineOnly() {
  QrScanner["_disableBarcodeDetector"] = true
}

function maskCPF(v) {
  const n = String(v).replace(/\D/g, "").slice(0, 11)
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
    [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
  )
}

function looksLikeNfcePayload(raw) {
  const s = String(raw || "").trim()
  if (!s) return false

  const directDigits = s.replace(/\D/g, "")
  if (directDigits.length === 44) return true

  try {
    const urlText = s.includes("://") ? s : `https://${s}`
    const u = new URL(urlText)
    const p = decodeURIComponent(u.searchParams.get("p") || "")
    if (p) {
      const firstPart = (p.split("|")[0] || "").replace(/\D/g, "")
      if (firstPart.length === 44) return true
    }
  } catch {
    // ignore parse errors
  }

  return /fazenda\.pr\.gov\.br\/nfce/i.test(s)
}

/** Região = quadro quase inteiro (nota costuma ter o QR fora do centro); downscale mantém performance. */
function calculateNfceScanRegion(video) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) {
    return { x: 0, y: 0, width: 640, height: 480, downScaledWidth: 400, downScaledHeight: 400 }
  }
  const margin = 0.06
  const w = Math.round(vw * (1 - 2 * margin))
  const h = Math.round(vh * (1 - 2 * margin))
  const x = Math.round((vw - w) / 2)
  const y = Math.round((vh - h) / 2)
  const maxEdge = 1024
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const dw = Math.max(320, Math.round(w * scale))
  const dh = Math.max(320, Math.round(h * scale))
  return { x, y, width: w, height: h, downScaledWidth: dw, downScaledHeight: dh }
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
  const videoRef = useRef(null)

  const stopScanner = useCallback(() => {
    const instance = scannerRef.current
    scannerRef.current = null
    if (instance) {
      try {
        instance.stop()
      } catch {
        /* ignore */
      }
      try {
        instance.destroy()
      } catch {
        /* ignore */
      }
    }
    setCameraOn(false)
    setStartingCamera(false)
  }, [])

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  async function startScanner() {
    setError("")
    setSuccess(null)
    if (scannerRef.current || startingCamera) return
    setCameraOn(true)
    setStartingCamera(true)
    await new Promise((r) => requestAnimationFrame(r))
    await new Promise((r) => requestAnimationFrame(r))
    const video = videoRef.current
    if (!video) {
      setStartingCamera(false)
      setCameraOn(false)
      setError("Não foi possível preparar o vídeo. Tente de novo.")
      return
    }
    forceWorkerQrEngineOnly()
    const scanner = new QrScanner(
      video,
      (result) => {
        const text = String(typeof result === "string" ? result : result?.data || "").trim()
        if (!text) {
          setError("A leitura retornou vazia. Tente aproximar/afastar um pouco e manter boa iluminação.")
          return
        }
        if (!looksLikeNfcePayload(text)) {
          setError("O código lido não parece ser o QR da NFC-e. Tente enquadrar somente o QR da nota fiscal.")
          return
        }
        setError("")
        setQrPayload(text)
        stopScanner()
      },
      {
        returnDetailedScanResult: true,
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 15,
        calculateScanRegion: calculateNfceScanRegion,
        onDecodeError: () => {},
      }
    )
    try {
      scanner.setInversionMode("both")
    } catch {
      /* ignore */
    }
    scannerRef.current = scanner
    try {
      await scanner.start()
    } catch (err) {
      scannerRef.current = null
      try {
        scanner.destroy()
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
      <div className="nfce-public-page container py-5 text-center px-3">
        <p className="nfce-empty-state mb-0">
          Use o link do estabelecimento. Ex.: <code>/pontos-nota?tenant=slug-da-loja</code>
        </p>
        <p className="nfce-empty-state mt-2 mb-0">
          <Link to="/cadastro">Cadastro no programa</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="nfce-public-page container py-4 px-3" style={{ maxWidth: 520 }}>
      <h1 className="nfce-title">Pontos pela nota (NFC-e)</h1>
      <p className="nfce-intro mb-4">
        Informe o CPF cadastrado e use só a <strong>câmera traseira</strong> para ler o <strong>QR code da nota</strong>{" "}
        (impresso no papel). O valor vem da consulta da SEFAZ. Cada nota vale uma vez.
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
                  <p className="nfce-hint mb-1">
                    Enquadre o QR dentro da moldura; a câmera usada é a de trás. O leitor foi ajustado para QR codes longos
                    (NFC-e).
                  </p>
                  <div
                    className="rounded overflow-hidden bg-dark position-relative"
                    style={{ maxWidth: "100%", lineHeight: 0 }}
                  >
                    <video
                      ref={videoRef}
                      className="w-100"
                      style={{ display: "block", minHeight: 220, objectFit: "cover" }}
                      muted
                      playsInline
                    />
                  </div>
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

      <div className="nfce-footer-links mt-4">
        <p className="mb-2">Acessos rápidos</p>
        <div className="nfce-footer-actions">
          <Link className="nfce-footer-action" to={`/resgatar?tenant=${encodeURIComponent(tenantSlug)}`}>
            Ver saldo e resgates
          </Link>
          <Link className="nfce-footer-action" to={`/cadastro?tenant=${encodeURIComponent(tenantSlug)}`}>
            Cadastro
          </Link>
        </div>
      </div>
    </div>
  )
}
