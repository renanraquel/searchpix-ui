import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { apiUrl } from "../api"

export default function VerifyMerchantEmail() {
  const [searchParams] = useSearchParams()
  const token = (searchParams.get("token") || "").trim()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("Validando seu e-mail...")

  useEffect(() => {
    let ignore = false
    async function run() {
      if (!token) {
        setStatus("error")
        setMessage("Token inválido.")
        return
      }
      try {
        const res = await fetch(`${apiUrl("/api/public/merchant-signup/verify-email")}?token=${encodeURIComponent(token)}`)
        if (!res.ok) {
          const text = await res.text()
          if (!ignore) {
            setStatus("error")
            setMessage(text || "Não foi possível validar o e-mail.")
          }
          return
        }
        if (!ignore) {
          setStatus("success")
          setMessage("E-mail confirmado com sucesso. Agora você já pode fazer login.")
        }
      } catch {
        if (!ignore) {
          setStatus("error")
          setMessage("Erro de rede ao validar e-mail.")
        }
      }
    }
    run()
    return () => {
      ignore = true
    }
  }, [token])

  return (
    <div id="pricing-onboarding-root" className="min-h-screen">
      <div className="relative min-h-screen overflow-x-hidden bg-slate-100 py-10 px-4 sm:px-6">
        <div className="relative z-10 mx-auto max-w-lg rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-bold text-slate-950">Confirmação de e-mail</h1>
          <p className={`mt-4 text-sm font-medium ${status === "success" ? "text-emerald-700" : status === "error" ? "text-red-700" : "text-slate-700"}`}>
            {message}
          </p>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
