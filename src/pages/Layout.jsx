import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { setAuth, getTenant } from "../api"

const linkStyle = { color: "#333", textDecoration: "none", fontSize: "1.05rem" }
const activeStyle = { ...linkStyle, color: "#0052cc", fontWeight: "bold" }

export default function Layout({ onLogout }) {
  const navigate = useNavigate()
  const tenant = getTenant()

  function logout() {
    setAuth(null, null)
    onLogout?.()
    navigate("/login")
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid #eee",
          backgroundColor: "#f8f9fa",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <nav style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: "1.05rem" }}>
          <NavLink to="/pix" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            PIX
          </NavLink>
          <NavLink to="/produtos" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            Cadastro de Produtos
          </NavLink>
          <NavLink to="/clientes" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            Cadastro de Clientes
          </NavLink>
          <NavLink to="/pontos" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            Lançar pontos
          </NavLink>
          <NavLink to="/resgates" end style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            Pesquisa de Resgates
          </NavLink>
          <NavLink to="/resgates/efetuar" style={({ isActive }) => (isActive ? activeStyle : linkStyle)}>
            Resgatar Produto
          </NavLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {tenant?.name && (
            <span
              style={{
                color: "#003366",
                fontWeight: "bold",
                fontSize: "1.05rem",
              }}
            >
              {tenant.name}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #ccc",
              borderRadius: 6,
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1.05rem",
            }}
          >
            Sair
          </button>
        </div>
      </header>
      <main style={{ padding: "24px 0" }}>
        <Outlet />
      </main>
    </div>
  )
}
