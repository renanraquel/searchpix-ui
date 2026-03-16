import { useState } from "react"
import { fetchApi, apiUrl } from "../api"

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatarValorBR(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
}

export default function Pix() {
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [pixList, setPixList] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 8

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
      const url = `${apiUrl("/pix")}?inicio=${inicio}&fim=${fim}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const lista = (data.pix || [])
        .map((p) => ({
          horario: p.horario,
          cpf: p.pagador?.cpf || p.pagador?.cnpj || "",
          nome: p.pagador?.nome || "",
          valor: p.valor,
        }))
        .sort((a, b) => new Date(b.horario) - new Date(a.horario))
      setPixList(lista)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inicioPagina = (paginaAtual - 1) * itensPorPagina
  const fimPagina = inicioPagina + itensPorPagina
  const pixPaginado = pixList.slice(inicioPagina, fimPagina)
  const totalPaginas = Math.ceil(pixList.length / itensPorPagina)
  const valorTotalPix = pixList.reduce((acc, p) => acc + Number(p.valor), 0)

  return (
    <div style={{ padding: "0 24px" }}>
      <h2 style={{ marginBottom: 24 }}>Consultar PIX Recebidos</h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "24px 20px",
          marginBottom: 20,
        }}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Data Início</label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            style={{ width: "100%", minWidth: 160, height: 40, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Data Fim</label>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            style={{ width: "100%", minWidth: 160, height: 40, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ paddingBottom: 2 }}>
          <label style={{ display: "block", marginBottom: 8, opacity: 0 }}>Ação</label>
          <button
            type="button"
            onClick={buscarPix}
            disabled={loading}
            style={{
              height: 40,
              padding: "0 24px",
              minWidth: 120,
              backgroundColor: "#0052cc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
            }}
          >
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>
      </div>
      {erro && (
        <p style={{ color: "red", padding: 15, backgroundColor: "#fff1f0", border: "1px solid #ffa39e", borderRadius: 4, marginBottom: 20 }}>
          {erro}
        </p>
      )}
      {pixList.length > 0 ? (
        <>
          <div style={{ overflowX: "auto" }}>
            <table width="100%" style={{ borderCollapse: "collapse", border: "1px solid #eee", fontSize: 16 }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ textAlign: "left", padding: 15 }}>Horário</th>
                  <th style={{ textAlign: "left", padding: 15 }}>CPF/CNPJ</th>
                  <th style={{ textAlign: "left", padding: 15 }}>Nome</th>
                  <th style={{ textAlign: "right", padding: 15 }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {pixPaginado.map((pix, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 15 }}>{formatarDataHora(pix.horario)}</td>
                    <td style={{ padding: 15 }}>{pix.cpf}</td>
                    <td style={{ padding: 15 }}>{pix.nome}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#2e7d32", padding: 15 }}>
                      {formatarValorBR(pix.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #eee", backgroundColor: "#f8f9fa" }}>
                  <td colSpan={3} style={{ padding: 15, textAlign: "right", fontWeight: 600 }}>
                    Soma Total PIX:
                  </td>
                  <td style={{ padding: 15, textAlign: "right", fontWeight: 700, color: "#0052cc" }}>
                    {formatarValorBR(valorTotalPix)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div style={{ marginTop: 25, display: "flex", gap: 15, alignItems: "center", justifyContent: "flex-end" }}>
              <span style={{ color: "#666" }}>Página {paginaAtual} de {totalPaginas}</span>
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                disabled={paginaAtual === 1}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Anterior
              </button>
              <button
                type="button"
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
          <p style={{ textAlign: "center", marginTop: 48, color: "#999" }}>
            Selecione as datas e clique em Pesquisar para buscar PIX.
          </p>
        )
      )}
    </div>
  )
}
