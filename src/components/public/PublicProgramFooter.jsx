import { Link } from "react-router-dom"

/** Rodapé público: botão roxo (indigo, mesmo tom de “Cadastrar nota”) → `/pontos-nota?tenant=…` */
export function PublicProgramFooterBootstrap({ tenantSlug }) {
  const to = `/pontos-nota?tenant=${encodeURIComponent(tenantSlug)}`
  return (
    <div className="mt-4 pt-3 border-top text-center">
      <Link to={to} className="btn btn-lg btn-block public-footer-voltar-hub">
        Voltar
      </Link>
    </div>
  )
}
