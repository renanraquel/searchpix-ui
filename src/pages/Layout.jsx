import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { setAuth, getTenant } from "../api"

function SidebarLink({ to, end, icon, children }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
        <span className="icon-bg">
          <i className={`mdi ${icon} menu-icon`} />
        </span>
        <span className="menu-title">{children}</span>
      </NavLink>
    </li>
  )
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
    <div className="container-scroller">
      <nav className="navbar default-layout-navbar col-lg-12 col-12 p-0 fixed-top d-flex flex-row">
        <div className="text-center navbar-brand-wrapper d-flex align-items-center justify-content-center">
          {/* Um único link: brand-logo + brand-logo-mini com d-flex quebravam o display:none do tema */}
          <NavLink
            className="navbar-brand app-brand-text-link d-flex align-items-center justify-content-center w-100"
            to="/pix"
          >
            <span className="app-brand-text">RR Solutions</span>
          </NavLink>
        </div>
        <div className="navbar-menu-wrapper d-flex align-items-stretch flex-grow-1">
          <ul className="navbar-nav navbar-nav-right ml-auto align-items-center">
            {tenant?.name && (
              <li className="nav-item mr-3 d-none d-md-block">
                <span className="text-dark font-weight-bold">{tenant.name}</span>
              </li>
            )}
            <li className="nav-item">
              <button type="button" className="btn btn-primary btn-sm" onClick={logout}>
                Sair
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container-fluid page-body-wrapper">
        <nav className="sidebar sidebar-offcanvas" id="sidebar">
          <ul className="nav">
            <li className="nav-item nav-category">Fidelização</li>
            <SidebarLink to="/pix" icon="mdi-cash-multiple">
              PIX
            </SidebarLink>
            <SidebarLink to="/produtos" icon="mdi-package-variant">
              Produtos
            </SidebarLink>
            <SidebarLink to="/clientes" icon="mdi-account-multiple">
              Clientes
            </SidebarLink>
            <SidebarLink to="/pontos" icon="mdi-star-circle">
              Lançar pontos
            </SidebarLink>
            <SidebarLink to="/resgates" end icon="mdi-magnify">
              Pesquisa de resgates
            </SidebarLink>
            <SidebarLink to="/resgates/efetuar" icon="mdi-gift">
              Resgatar produto
            </SidebarLink>
          </ul>
        </nav>

        <div className="main-panel">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
