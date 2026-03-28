import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getToken } from "./api"
import LoginLoyalty from "./pages/LoginLoyalty"
import Layout from "./pages/Layout"
import Pix from "./pages/Pix"
import Products from "./pages/Products"
import Customers from "./pages/Customers"
import Points from "./pages/Points"
import Redemptions from "./pages/Redemptions"
import EfetuarResgate from "./pages/EfetuarResgate"
import PublicRedemption from "./pages/PublicRedemption"
import Pricing from "./pages/Pricing"
import PublicRegister from "./pages/PublicRegister"
import PublicNfcePoints from "./pages/PublicNfcePoints"
import PublicNfcePointsEnviar from "./pages/PublicNfcePointsEnviar"

function PrivateRoute({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
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
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/pix" replace />
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
          <Route index element={<Navigate to="/pix" replace />} />
          <Route path="pix" element={<Pix />} />
          <Route path="produtos" element={<Products />} />
          <Route path="clientes" element={<Customers />} />
          <Route path="pontos" element={<Points />} />
          <Route path="resgates" element={<Redemptions />} />
          <Route path="resgates/efetuar" element={<EfetuarResgate />} />
        </Route>
        <Route path="*" element={<Navigate to="/pix" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
