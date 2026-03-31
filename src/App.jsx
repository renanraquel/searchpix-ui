import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getToken, getTenant } from "./api"
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

function PrivateRoute({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function appHomePath() {
  const t = getTenant()
  return isPixModuleEnabledForTenantSlug(t?.slug) ? "/pix" : "/produtos"
}

function NavigateToAppHome() {
  return <Navigate to={appHomePath()} replace />
}

function PrivatePixRoute() {
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
          <Route path="produtos" element={<Products />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="pontos" element={<Points />} />
          <Route path="parametros-sistema" element={<SystemParams />} />
          <Route path="resgates" element={<Redemptions />} />
          <Route path="resgates/efetuar" element={<EfetuarResgate />} />
        </Route>
        <Route path="*" element={<NavigateToAppHome />} />
      </Routes>
    </BrowserRouter>
  )
}
