import { useState } from "react"
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
      setAuth(data.token, data.tenant)
      onLogin?.()
    } catch (err) {
      setError(err.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 40,
          borderRadius: 12,
          backgroundColor: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <h2 style={{ marginBottom: 24, textAlign: "center", color: "#333" }}>
          Acesso - Fidelização
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Usuário
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
              style={{
                width: "100%",
                height: 44,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                height: 44,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
          {error && (
            <p
              style={{
                color: "#721c24",
                backgroundColor: "#f8d7da",
                padding: 12,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              backgroundColor: "#0052cc",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
