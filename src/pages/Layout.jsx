import { useState, useEffect } from "react"
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { setAuth, getTenant, getPontosNotaPublicUrl, isAdmin } from "../api"
import { isPixModuleEnabledForTenantSlug } from "../constants/pixModule"

function SidebarLink({ to, end, icon, children, onNavigate }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={end}
        onClick={() => onNavigate?.()}
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
  const location = useLocation()
  const tenant = getTenant()
  const showPixModule = isPixModuleEnabledForTenantSlug(tenant?.slug)
  const showDesignacoes = isAdmin()
  const homePath = showPixModule ? "/pix" : "/produtos"
  const pontosNotaDivulgeUrl = tenant?.slug ? getPontosNotaPublicUrl(tenant.slug) : ""
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    function onKey(e) {
      if (e.key === "Escape") setMobileMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 992) setMobileMenuOpen(false)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  function logout() {
    setAuth(null, null, null)
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
            to={homePath}
          >
            <span className="app-brand-text">RR Solutions</span>
          </NavLink>
        </div>
        <div className="navbar-menu-wrapper d-flex align-items-stretch flex-grow-1">
          <button
            type="button"
            className="navbar-toggler layout-sidebar-toggle d-lg-none align-self-center border-0 bg-transparent"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            <span className="mdi mdi-menu" style={{ fontSize: "1.35rem", color: "#8e94a9" }} />
          </button>
          {pontosNotaDivulgeUrl && (
            <div className="layout-navbar-divulge-wrap d-flex align-items-center px-2 px-md-3">
              <span className="layout-navbar-divulge-label d-none d-md-inline text-muted small font-weight-medium text-nowrap mr-2">
                Link para clientes
              </span>
              <a
                href={pontosNotaDivulgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="layout-navbar-divulge-link small font-weight-bold"
                title={pontosNotaDivulgeUrl}
              >
                {pontosNotaDivulgeUrl}
              </a>
            </div>
          )}
          <ul className="navbar-nav navbar-nav-right ml-auto align-items-center layout-navbar-user-actions">
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

      <div className="container-fluid page-body-wrapper position-relative">
        <div
          className={`sidebar-mobile-backdrop d-lg-none${mobileMenuOpen ? " is-visible" : ""}`}
          aria-hidden="true"
          onClick={closeMobileMenu}
        />
        <nav
          className={`sidebar sidebar-offcanvas${mobileMenuOpen ? " active" : ""}`}
          id="sidebar"
        >
          <ul className="nav">
            <li className="nav-item nav-category">Fidelização</li>
            {showPixModule && (
              <SidebarLink to="/pix" icon="mdi-cash-multiple" onNavigate={closeMobileMenu}>
                PIX
              </SidebarLink>
            )}
            <SidebarLink to="/produtos" icon="mdi-package-variant" onNavigate={closeMobileMenu}>
              Produtos
            </SidebarLink>
            <SidebarLink to="/clientes" icon="mdi-account-multiple" onNavigate={closeMobileMenu}>
              Clientes
            </SidebarLink>
            <SidebarLink to="/pontos" icon="mdi-star-circle" onNavigate={closeMobileMenu}>
              Lançar pontos
            </SidebarLink>
            <SidebarLink to="/parametros-sistema" icon="mdi-settings" onNavigate={closeMobileMenu}>
              Parâmetros sistema
            </SidebarLink>
            <SidebarLink to="/resgates" end icon="mdi-magnify" onNavigate={closeMobileMenu}>
              Pesquisa de resgates
            </SidebarLink>
            <SidebarLink to="/resgates/efetuar" icon="mdi-gift" onNavigate={closeMobileMenu}>
              Resgatar produto
            </SidebarLink>
            {showDesignacoes && (
              <>
                <li className="nav-item nav-category">Designações</li>
                <SidebarLink to="/designacoes/irmaos" icon="mdi-account-group" onNavigate={closeMobileMenu}>
                  Irmãos
                </SidebarLink>
                <SidebarLink to="/designacoes" icon="mdi-calendar-check" onNavigate={closeMobileMenu}>
                  Semana
                </SidebarLink>
                <SidebarLink to="/designacoes/lembretes" icon="mdi-bell-ring" onNavigate={closeMobileMenu}>
                  Lembretes
                </SidebarLink>
              </>
            )}
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
