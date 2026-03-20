import { useState } from "react"
import { apiUrl } from "../api"

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
    <div>
      <div className="page-header">
        <h3 className="page-title">Consultar PIX recebidos</h3>
      </div>
      <p className="text-muted mb-4">
        Filtre os recebimentos por período para ver detalhes de cada PIX e o valor total no intervalo.
      </p>

      <div className="row align-items-end mb-4">
        <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
          <div className="form-group mb-0">
            <label htmlFor="pix-inicio">Data início</label>
            <input
              id="pix-inicio"
              type="date"
              className="form-control"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
          <div className="form-group mb-0">
            <label htmlFor="pix-fim">Data fim</label>
            <input
              id="pix-fim"
              type="date"
              className="form-control"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-auto">
          <button type="button" className="btn btn-primary" onClick={buscarPix} disabled={loading}>
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="cp-alert cp-alert-danger" role="alert">
          {erro}
        </div>
      )}

      {pixList.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>CPF/CNPJ</th>
                  <th>Nome</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pixPaginado.map((pix, i) => (
                  <tr key={i}>
                    <td>{formatarDataHora(pix.horario)}</td>
                    <td>{pix.cpf}</td>
                    <td>{pix.nome}</td>
                    <td className="text-right font-weight-bold text-success">{formatarValorBR(pix.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-secondary font-weight-bold">
                  <td colSpan={3} className="text-right">
                    Soma total PIX
                  </td>
                  <td className="text-right text-primary">{formatarValorBR(valorTotalPix)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="d-flex align-items-center justify-content-end flex-wrap mt-3">
              <span className="text-muted mr-3 mb-2 mb-sm-0">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mr-2"
                onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                disabled={paginaAtual === 1}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && <p className="text-center text-muted mt-5">Selecione as datas e clique em Pesquisar para buscar PIX.</p>
      )}
    </div>
  )
}
