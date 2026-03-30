import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import QrScanner from "qr-scanner"
import { apiUrl } from "../api"
import { PublicProgramFooterBootstrap } from "../components/public/PublicProgramFooter"
import "../styles/tailwind-pontos-nota.css"

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

export default function PublicNfcePointsEnviar() {
  const [searchParams] = useSearchParams()
  const tenantSlug = searchParams.get("tenant") || ""
  const [cpf, setCpf] = useState("")
  const [qrPayload, setQrPayload] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const [startingCamera, setStartingCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(null)
  const [backgroundUrl, setBackgroundUrl] = useState(null)
  const scannerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!tenantSlug) return
    let cancelled = false
    async function loadBackground() {
      try {
        const res = await fetch(`${apiUrl("/api/public/redemption")}?tenant=${encodeURIComponent(tenantSlug)}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const bg = data?.tenant?.background_image_url
        setBackgroundUrl(bg ? apiUrl(bg) : null)
      } catch {
        if (!cancelled) setBackgroundUrl(null)
      }
    }
    loadBackground()
    return () => {
      cancelled = true
    }
  }, [tenantSlug])

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
      <div id="pontos-nota-root" className="min-h-screen">
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-100/60">
          <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
            <div className="w-full rounded-2xl border border-slate-200/90 bg-white/95 p-8 shadow-soft-lg backdrop-blur-md">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Cadastrar nota fiscal</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Use o link completo do estabelecimento. Ex.:{" "}
                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
                  /pontos-nota/enviar?tenant=slug-da-loja
                </code>
              </p>
              <Link
                to="/pontos-nota"
                className="mt-6 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="pontos-nota-root" className="min-h-screen">
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="d-flex justify-content-center align-items-start py-4 px-3"
          style={{
            minHeight: "100vh",
            backgroundColor: backgroundUrl ? "rgba(0,0,0,0.62)" : "#e2e8f0",
            boxSizing: "border-box",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          <div
            className="my-3 w-full rounded-2xl border-2 p-6 shadow-xl backdrop-blur-sm sm:p-8"
            style={{
              maxWidth: 520,
              backgroundColor: backgroundUrl ? "rgba(255,255,255,0.97)" : "#ffffff",
              borderColor: backgroundUrl ? "rgba(255,255,255,0.45)" : "#94a3b8",
              boxSizing: "border-box",
              overflow: "hidden",
              boxShadow: backgroundUrl ? "0 25px 50px -12px rgba(0,0,0,0.45)" : "0 12px 40px -12px rgba(15,23,42,0.18)",
            }}
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Acumular pontos pela NFC-e</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Informe o CPF cadastrado e use a <strong className="font-semibold text-slate-800">câmera traseira</strong> para ler o{" "}
              <strong className="font-semibold text-slate-800">QR code da nota</strong> (impresso no papel). O valor vem da consulta da
              SEFAZ. Cada nota vale uma vez.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="nfce-cpf-enviar" className="block text-sm font-semibold text-slate-800">
                  CPF (cadastrado no programa)
                </label>
                <input
                  id="nfce-cpf-enviar"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  autoComplete="off"
                />
              </div>

              <div>
                <span className="block text-sm font-semibold text-slate-800">QR code da nota (somente leitura pela câmera)</span>
                {qrPayload ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-semibold text-emerald-700">Nota lida com sucesso.</p>
                    <button
                      type="button"
                      onClick={clearNota}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Ler outra nota
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-3">
                    <button
                      type="button"
                      disabled={startingCamera}
                      onClick={() => void (cameraOn ? stopScanner() : startScanner())}
                      className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-3.5 text-sm font-semibold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-60"
                    >
                      {startingCamera
                        ? "Abrindo câmera…"
                        : cameraOn
                          ? "Parar leitura"
                          : "Ler QR code com a câmera traseira"}
                    </button>
                    {cameraOn ? (
                      <div>
                        <p className="text-sm leading-relaxed text-slate-600">
                          Enquadre o QR dentro da moldura; a câmera usada é a de trás. O leitor foi ajustado para QR codes longos (NFC-e).
                        </p>
                        <div className="mt-3 overflow-hidden rounded-2xl bg-slate-900 shadow-inner ring-1 ring-slate-200">
                          <video
                            ref={videoRef}
                            className="block min-h-[220px] w-full object-cover"
                            muted
                            playsInline
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
                  <strong className="font-semibold">{success.message}</strong>
                  <p className="mt-2 text-emerald-800/90">
                    +{success.points_added} pts · Novo saldo: {success.new_balance} pts
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !qrPayload.trim()}
                className="btn btn-primary btn-lg btn-block w-full rounded-xl"
              >
                {loading ? "Enviando…" : "Acumular pontos"}
              </button>
            </form>

            <PublicProgramFooterBootstrap tenantSlug={tenantSlug} />
          </div>
        </div>
      </div>
    </div>
  )
}
