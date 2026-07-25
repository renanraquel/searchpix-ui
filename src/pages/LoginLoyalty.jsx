import { useState } from "react"
import { Link } from "react-router-dom"
import { setAuth, apiUrl } from "../api"

export default function LoginLoyalty({ onLogin }) {
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!user || !password) {
      setError("Preencha usuário e senha.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          password,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Usuário ou senha inválidos")
      }
      const data = await res.json()
      setAuth(data.token, data.tenant, data.user || null)
      onLogin?.()
    } catch (err) {
      setError(err.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth">
          <div className="row flex-grow w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left p-3 p-md-5">
                <div className="brand-logo mb-4">
                  <span className="app-brand-text app-brand-text--login">RR Solutions</span>
                </div>
                <h4>Acesso — Fidelização</h4>
                <h6 className="font-weight-light">Entre com seu usuário e senha.</h6>
                <p className="mb-0 mt-2">
                  <Link to="/precos" className="text-primary small">
                    Ver planos e preços
                  </Link>
                </p>
                <form className="pt-3" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="login-user" className="sr-only">
                      Usuário
                    </label>
                    <input
                      id="login-user"
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Usuário"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="login-pass" className="sr-only">
                      Senha
                    </label>
                    <input
                      id="login-pass"
                      type="password"
                      className="form-control form-control-lg"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="cp-alert cp-alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      type="submit"
                      className="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                      disabled={loading}
                    >
                      {loading ? "Entrando..." : "Entrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
