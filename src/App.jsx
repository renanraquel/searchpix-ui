import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getToken, getTenant, isAdmin, isReceituarioOnly, canAccessReceituario } from "./api"
import { isPixModuleEnabledForTenantSlug } from "./constants/pixModule"
import LoginLoyalty from "./pages/LoginLoyalty"
import Layout from "./pages/Layout"
import Pix from "./pages/Pix"
import Products from "./pages/Products"
import Customers from "./pages/Customers"
import Points from "./pages/Points"
import Redemptions from "./pages/Redemptions"
import SystemParams from "./pages/SystemParams"
import EfetuarResgate from "./pages/EfetuarResgate"
import PublicRedemption from "./pages/PublicRedemption"
import Pricing from "./pages/Pricing"
import PricingPlanFollowup from "./pages/PricingPlanFollowup"
import MerchantSignup from "./pages/MerchantSignup"
import VerifyMerchantEmail from "./pages/VerifyMerchantEmail"
import PublicRegister from "./pages/PublicRegister"
import PublicNfcePoints from "./pages/PublicNfcePoints"
import PublicNfcePointsEnviar from "./pages/PublicNfcePointsEnviar"
import CarouselManage from "./pages/CarouselManage"
import PublicCarousel from "./pages/PublicCarousel"
import DesignacoesIrmaos from "./pages/DesignacoesIrmaos"
import DesignacoesSemana from "./pages/DesignacoesSemana"
import DesignacoesLembretes from "./pages/DesignacoesLembretes"
import Receituario from "./pages/Receituario"

function PrivateRoute({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  if (!isAdmin()) return <Navigate to={appHomePath()} replace />
  return children
}

/** Bloqueia telas do SearchPix para o usuário exclusivo do Receituário. */
function LoyaltyRoute({ children }) {
  if (isReceituarioOnly()) return <Navigate to="/receituario" replace />
  return children
}

function ReceituarioRoute({ children }) {
  if (!canAccessReceituario()) return <Navigate to={appHomePath()} replace />
  return children
}

function appHomePath() {
  if (isReceituarioOnly()) return "/receituario"
  const t = getTenant()
  return isPixModuleEnabledForTenantSlug(t?.slug) ? "/pix" : "/produtos"
}

function NavigateToAppHome() {
  return <Navigate to={appHomePath()} replace />
}

function PrivatePixRoute() {
  if (isReceituarioOnly()) return <Navigate to="/receituario" replace />
  const t = getTenant()
  if (!isPixModuleEnabledForTenantSlug(t?.slug)) {
    return <Navigate to="/produtos" replace />
  }
  return <Pix />
}

export default function App() {
  const [token, setToken] = useState(getToken())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/resgatar" element={<PublicRedemption />} />
        <Route path="/cadastro" element={<PublicRegister />} />
        <Route path="/pontos-nota/enviar" element={<PublicNfcePointsEnviar />} />
        <Route path="/pontos-nota" element={<PublicNfcePoints />} />
        <Route path="/precos" element={<Pricing />} />
        <Route path="/precos/como-comecar" element={<PricingPlanFollowup />} />
        <Route path="/precos/cadastro-lojista" element={<MerchantSignup />} />
        <Route path="/precos/verificar-email" element={<VerifyMerchantEmail />} />
        <Route path="/carrossel-tv" element={<PublicCarousel />} />
        <Route
          path="/login"
          element={
            token ? (
              <NavigateToAppHome />
            ) : (
              <LoginLoyalty onLogin={() => setToken(getToken())} />
            )
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout onLogout={() => setToken(null)} />
            </PrivateRoute>
          }
        >
          <Route index element={<NavigateToAppHome />} />
          <Route path="pix" element={<PrivatePixRoute />} />
          <Route
            path="produtos"
            element={
              <LoyaltyRoute>
                <Products />
              </LoyaltyRoute>
            }
          />
          <Route
            path="clientes"
            element={
              <LoyaltyRoute>
                <Customers />
              </LoyaltyRoute>
            }
          />
          <Route
            path="pontos"
            element={
              <LoyaltyRoute>
                <Points />
              </LoyaltyRoute>
            }
          />
          <Route
            path="parametros-sistema"
            element={
              <LoyaltyRoute>
                <SystemParams />
              </LoyaltyRoute>
            }
          />
          <Route
            path="resgates"
            element={
              <LoyaltyRoute>
                <Redemptions />
              </LoyaltyRoute>
            }
          />
          <Route
            path="resgates/efetuar"
            element={
              <LoyaltyRoute>
                <EfetuarResgate />
              </LoyaltyRoute>
            }
          />
          <Route
            path="carrossel"
            element={
              <LoyaltyRoute>
                <CarouselManage />
              </LoyaltyRoute>
            }
          />
          <Route
            path="designacoes/irmaos"
            element={
              <AdminRoute>
                <DesignacoesIrmaos />
              </AdminRoute>
            }
          />
          <Route
            path="designacoes"
            element={
              <AdminRoute>
                <DesignacoesSemana />
              </AdminRoute>
            }
          />
          <Route
            path="designacoes/lembretes"
            element={
              <AdminRoute>
                <DesignacoesLembretes />
              </AdminRoute>
            }
          />
          <Route
            path="receituario"
            element={
              <ReceituarioRoute>
                <Receituario />
              </ReceituarioRoute>
            }
          />
        </Route>
        <Route path="*" element={<NavigateToAppHome />} />
      </Routes>
    </BrowserRouter>
  )
}
