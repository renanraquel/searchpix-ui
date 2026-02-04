import { useState, useEffect } from "react"

/* =======================
   Utilitários
======================= */

function formatarDataHora(dataIso) {
  const data = new Date(dataIso)
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function formatarValorBR(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor))
}

/* =======================
   App
======================= */

function App() {
  /* ---------- AUTH ---------- */
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [token, setToken] = useState(null)
  const [erroLogin, setErroLogin] = useState("")

  /* ---------- PIX ---------- */
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [pixList, setPixList] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  /* ---------- PAGINAÇÃO ---------- */
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 8

  /* =======================
     Recupera token salvo
  ======================= */
  useEffect(() => {
    const t = localStorage.getItem("token")
    if (t) setToken(t)
  }, [])

  /* =======================
     LOGIN
  ======================= */
  async function fazerLogin() {
    setErroLogin("")

    try {
      const response = await fetch("https://searchpix.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: usuario,
          password: senha
        })
      })

      if (!response.ok) {
        throw new Error("Usuário ou senha inválidos")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setToken(data.token)
    } catch (e) {
      setErroLogin(e.message)
    }
  }

  function logout() {
    localStorage.removeItem("token")
    setToken(null)
    setPixList([])
    setUsuario("")
    setSenha("")
  }

  /* =======================
     BUSCAR PIX
  ======================= */
  async function buscarPix() {
    if (!inicio || !fim) {
      setErro("Informe data início e data fim")
      return
    }

    setErro("")
    setLoading(true)
    setPixList([])
    setPaginaAtual(1)

    try {
      const response = await fetch(
        `https://searchpix.onrender.com/pix?inicio=${inicio}&fim=${fim}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const msg = await response.text()
        throw new Error(msg)
      }

      const data = await response.json()

      const lista = data.pix
        .map((p) => ({
          horario: p.horario,
          cpf: p.pagador?.cpf || p.pagador?.cnpj || "",
          nome: p.pagador?.nome || "",
          valor: p.valor
        }))
        .sort((a, b) => new Date(b.horario) - new Date(a.horario))

      setPixList(lista)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     PAGINAÇÃO
  ======================= */
  const inicioPagina = (paginaAtual - 1) * itensPorPagina
  const fimPagina = inicioPagina + itensPorPagina
  const pixPaginado = pixList.slice(inicioPagina, fimPagina)
  const totalPaginas = Math.ceil(pixList.length / itensPorPagina)

  /* Soma de todos os valores (lista completa, não só a página atual) */
  const valorTotalPix = pixList.reduce((acc, p) => acc + Number(p.valor), 0)

  /* =======================
     RENDERIZAÇÃO CONDICIONAL
  ======================= */

  // Se NÃO houver token, renderiza a tela de Login centralizada
  if (!token) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f2f5",
          margin: 0,
          position: "fixed",
          top: 0,
          left: 0
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            padding: "40px",
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            boxSizing: "border-box"
          }}
        >
          <h2 style={{ marginBottom: "24px", textAlign: "center", fontFamily: "sans-serif", color: "#333" }}>
            Acesso Restrito
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Usuário</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{ width: "100%", height: "40px", padding: "8px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={{ width: "100%", height: "40px", padding: "8px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          {erroLogin && (
            <p style={{ color: "#721c24", backgroundColor: "#f8d7da", padding: "10px", borderRadius: "4px", marginBottom: "16px", fontSize: "14px" }}>
              {erroLogin}
            </p>
          )}

          <button
            onClick={fazerLogin}
            style={{ 
              width: "100%", 
              height: "44px", 
              backgroundColor: "#0052cc", 
              color: "white", 
              border: "none", 
              borderRadius: "6px", 
              fontWeight: "bold", 
              cursor: "pointer" 
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // Se houver token, renderiza a tela Principal
  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        width: "100%",
        padding: "24px 32px", 
        boxSizing: "border-box",
        backgroundColor: "#fff"
      }}
    >
      <div
        style={{
          width: "100%",
          minWidth: 0
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            borderBottom: "1px solid #eee",
            paddingBottom: "16px"
          }}
        >
          <h1 style={{ margin: 0, fontSize: "28px" }}>Consultar PIX Recebidos</h1>
          <button 
            onClick={logout}
            style={{ 
              padding: "10px 20px", 
              cursor: "pointer", 
              backgroundColor: "#f5f5f5", 
              border: "1px solid #ccc", 
              borderRadius: "4px",
              fontWeight: "bold"
            }}
          >
            Sair do Sistema
          </button>
        </div>

        {/* Formulário de pesquisa – ocupa toda a largura disponível */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 180px auto",
            gap: "16px",
            marginBottom: "20px",
            alignItems: "end",
            width: "fit-content"
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Data Início</label>
            <input 
              type="date" 
              value={inicio} 
              onChange={(e) => setInicio(e.target.value)} 
              style={{ width: "100%", height: "38px", padding: "6px 10px", fontSize: "14px", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ccc" }} 
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Data Fim</label>
            <input 
              type="date" 
              value={fim} 
              onChange={(e) => setFim(e.target.value)} 
              style={{ width: "100%", height: "38px", padding: "6px 10px", fontSize: "14px", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ccc" }} 
            />
          </div>
          <button 
            onClick={buscarPix} 
            disabled={loading}
            style={{ 
              height: "38px", 
              width: "100%", 
              minWidth: "120px",
              cursor: "pointer", 
              backgroundColor: "#0052cc", 
              color: "#fff", 
              border: "none", 
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>

        {erro && (
          <p style={{ 
            color: "red", 
            padding: "15px", 
            backgroundColor: "#fff1f0", 
            border: "1px solid #ffa39e",
            borderRadius: "4px",
            marginBottom: "20px" 
          }}>
            {erro}
          </p>
        )}

        {/* TABELA OCUPANDO 100% DA TELA */}
        {pixList.length > 0 ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table 
                width="100%" 
                border="1" 
                cellPadding="15" 
                style={{ 
                  borderCollapse: "collapse", 
                  borderColor: "#eee",
                  fontSize: "16px" 
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th style={{ textAlign: "left" }}>Horário</th>
                    <th style={{ textAlign: "left" }}>CPF/CNPJ</th>
                    <th style={{ textAlign: "left" }}>Nome</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pixPaginado.map((pix, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td>{formatarDataHora(pix.horario)}</td>
                      <td>{pix.cpf}</td>
                      <td>{pix.nome}</td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "#2e7d32", fontSize: "18px" }}>
                        {formatarValorBR(pix.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #eee", backgroundColor: "#f8f9fa" }}>
                    <td colSpan={3} style={{ padding: "15px", textAlign: "right", fontWeight: "600" }}>
                      Soma Total PIX:
                    </td>
                    <td style={{ padding: "15px", textAlign: "right", fontWeight: "700", color: "#0052cc", fontSize: "18px" }}>
                      {formatarValorBR(valorTotalPix)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PAGINAÇÃO ALINHADA À DIREITA PARA APROVEITAR O ESPAÇO */}
            {totalPaginas > 1 && (
              <div style={{ 
                marginTop: "25px", 
                display: "flex", 
                gap: "15px", 
                alignItems: "center", 
                justifyContent: "flex-end" // Alinha a paginação à direita
              }}>
                <span style={{ color: "#666" }}>Exibindo página {paginaAtual} de {totalPaginas}</span>
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  disabled={paginaAtual === 1}
                  style={{ padding: "10px 20px", cursor: "pointer" }}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  style={{ padding: "10px 20px", cursor: "pointer" }}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <div style={{ textAlign: "center", marginTop: "100px", color: "#999" }}>
              <p style={{ fontSize: "18px" }}>Nenhum PIX encontrado. Selecione as datas acima para pesquisar.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
  
}

export default App