import { useState } from "react"

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
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [pixList, setPixList] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  // paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

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
        `http://localhost:8080/pix?inicio=${inicio}&fim=${fim}`
      )

      if (!response.ok) {
        const msg = await response.text()
        throw new Error(msg)
      }

      const data = await response.json()
      
      const lista = data.pix
        .map((p) => {
          const cpf = p.pagador?.cpf
          const cnpj = p.pagador?.cnpj

          return {
            horario: p.horario,
            cpf: cpf || cnpj || "",
            nome: p.pagador?.nome || "",
            valor: p.valor
          }
        })
        .sort((a, b) => new Date(b.horario) - new Date(a.horario))
  

      setPixList(lista)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* =======================
     Paginação
  ======================= */

  const inicioPagina = (paginaAtual - 1) * itensPorPagina
  const fimPagina = inicioPagina + itensPorPagina
  const pixPaginado = pixList.slice(inicioPagina, fimPagina)
  const totalPaginas = Math.ceil(pixList.length / itensPorPagina)

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box"
      }}
    >
      {/* CONTAINER PRINCIPAL */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          margin: "0 auto"
        }}
      >
        <h1 style={{ marginBottom: "24px" }}>Consultar PIX Pagos</h1>

        {/* FORMULÁRIO RESPONSIVO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 200px",
              gap: "16px",
              alignItems: "end",
              marginBottom: "20px"
            }}
          >
          <div>
            <label>Data início</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <div>
            <label>Data fim</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              style={{ width: "100%", height: "38px" }}
            />
          </div>

          <button
            onClick={buscarPix}
            disabled={loading}
            style={{
              height: "38px",
              width: "100%"
            }}
          >
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>

        {erro && (
          <p style={{ color: "red", marginBottom: "16px" }}>
            {erro}
          </p>
        )}

        {/* TABELA */}
        {pixList.length > 0 && (
          <>
            <div
              style={{
                overflowX: "auto",
                marginTop: "20px"
              }}
            >
              <table
                width="100%"
                cellPadding="10"
                style={{
                  borderCollapse: "collapse",
                  minWidth: "700px"
                }}
                border="1"
              >
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>CPF/CNPJ</th>
                    <th>Nome</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pixPaginado.map((pix, index) => (
                    <tr key={index}>
                      <td>{formatarDataHora(pix.horario)}</td>
                      <td>{pix.cpf}</td>
                      <td>{pix.nome}</td>
                      <td style={{ textAlign: "right" }}>
                        {formatarValorBR(pix.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <span>
                  Página {paginaAtual} de {totalPaginas}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() =>
                      setPaginaAtual((p) => Math.max(p - 1, 1))
                    }
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </button>

                  <button
                    onClick={() =>
                      setPaginaAtual((p) =>
                        Math.min(p + 1, totalPaginas)
                      )
                    }
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && pixList.length === 0 && !erro && (
          <p>Nenhum PIX encontrado</p>
        )}
      </div>
    </div>
  )
}

export default App
