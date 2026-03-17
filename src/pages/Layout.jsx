import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { setAuth, getTenant } from "../api"

const baseLinkStyle = {
  textDecoration: "none",
  fontSize: "0.95rem",
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid transparent",
  color: "#344054",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontWeight: 500,
}

const linkStyle = {
  ...baseLinkStyle,
  backgroundColor: "transparent",
}

const activeStyle = {
  ...baseLinkStyle,
  backgroundColor: "#e0edff",
  borderColor: "#b2ccff",
  color: "#0052cc",
}

export default function Layout({ onLogout }) {
  const navigate = useNavigate()
  const tenant = getTenant()

  function logout() {
    setAuth(null, null)
    onLogout?.()
    navigate("/login")
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "#ffffffcc",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <nav
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              fontSize: "0.95rem",
            }}
          >
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {tenant?.name && (
            <span
              style={{
              color: "#111827",
              fontWeight: 600,
              fontSize: "0.95rem",
              }}
            >
              {tenant.name}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Sair
          </button>
        </div>
        </div>
      </header>
      <main>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "24px 20px 40px",
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
