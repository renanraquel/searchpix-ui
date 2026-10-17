# SearchPix UI — RR Solutions

Interface web da plataforma SearchPix, com painel de fidelização para estabelecimentos e páginas públicas para clientes. Consome a API do repositório [searchpix](https://github.com/renanraquel/searchpix).

## Funcionalidades

- Painel autenticado para produtos, clientes, lançamento de pontos, resgates e parâmetros do estabelecimento.
- Consulta PIX para estabelecimentos habilitados.
- Gerenciamento de carrossel e página de exibição para TV.
- Cadastro público de clientes, consulta de saldo/recompensas e resgates.
- Leitura/envio de QR Code de NFC-e do Paraná para pontuação via API.
- Páginas de planos, cadastro de lojistas e confirmação de e-mail.
- Módulo de designações para administradores: pessoas, programação semanal e lembretes.

## Stack e organização

React 19, Vite 7, React Router 7, JavaScript/JSX, Tailwind CSS e tema Connect Plus baseado em Bootstrap. O ESLint faz a análise estática.

```text
src/App.jsx              Rotas e controle de acesso da interface
src/api.js               URL da API, autenticação e helpers HTTP
src/pages/               Telas públicas e administrativas
src/components/          Componentes compartilhados
src/constants/           Configurações, incluindo habilitação PIX
src/styles/              Ajustes visuais do tema
connect-plus-1.0.0/       Template e assets usados pela aplicação
public/                  Arquivos estáticos
```

O projeto principal é o `package.json` na raiz. Não é necessário instalar separadamente o projeto de exemplo dentro de `connect-plus-1.0.0` para executar a interface.

## Desenvolvimento local

Requisitos: Node.js compatível com Vite 7 (`20.19+` ou `22.12+`) e npm. Node 24 foi utilizado na preparação do ambiente. Para usar as funcionalidades de negócio, inicie também a API Go.

Na raiz deste repositório:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

O `.env.local` é ignorado pelo Git. Ajuste a URL da API conforme o ambiente:

```dotenv
VITE_API_URL=http://localhost:8080
```

Por padrão, o Vite usa a porta `5173`. Para executar em um ambiente remoto/container:

```bash
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

A URL da API é acessada pelo navegador: em acesso remoto, configure uma origem da API que seja alcançável pelo navegador do usuário.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `VITE_API_URL` | Origem da API, sem barra final. Padrão: `http://localhost:8080`. |
| `VITE_PUBLIC_UI_ORIGIN` | Origem usada para gerar links públicos; sem override, usa a origem atual do navegador. |
| `VITE_PIX_MODULE_TENANT_SLUGS` | Slugs habilitados para PIX, separados por vírgula; padrão `ibimassas`. Alinhe com `PIX_MODULE_TENANT_SLUGS` na API. |

Variáveis `VITE_*` são incorporadas ao código entregue ao navegador e não devem conter segredos. Reinicie o servidor de desenvolvimento após alterações; em produção, gere um novo build.

## Principais páginas

| Rota | Finalidade |
| --- | --- |
| `/login` | Entrada no painel |
| `/produtos`, `/clientes`, `/pontos` | Operações de fidelização |
| `/resgates`, `/resgates/efetuar` | Histórico e resgate no balcão |
| `/parametros-sistema` | Configuração do estabelecimento |
| `/pix` | Consulta PIX para tenant habilitado |
| `/carrossel` | Gerenciamento de conteúdo para TV |
| `/designacoes/irmaos`, `/designacoes`, `/designacoes/lembretes` | Módulo administrativo de designações |
| `/cadastro`, `/resgatar` | Cadastro e acesso público do cliente |
| `/pontos-nota`, `/pontos-nota/enviar` | Fluxo público de pontuação por NFC-e |
| `/carrossel-tv` | Exibição pública de carrossel |
| `/precos`, `/precos/como-comecar` | Apresentação de planos e orientações |
| `/precos/cadastro-lojista`, `/precos/verificar-email` | Cadastro e confirmação de lojista |

Links públicos como `/pontos-nota?tenant=ibimassas` e `/carrossel-tv?tenant=ibimassas` selecionam o estabelecimento pelo slug. O resgate público também utiliza o CPF do cliente.

O frontend guarda token JWT, tenant e usuário em `localStorage` e envia o token no cabeçalho `Authorization`. A API aplica a autorização das operações; a exibição condicional de telas não substitui essa validação.

## Build e validação

```bash
npm run build
npm run preview
npm run lint
```

O build gera `dist/`. `preview` serve para conferir o build localmente. Não há script de testes automatizados de frontend no projeto.

Na preparação do ambiente, o build passou com avisos sobre assets de imagem do tema e CSS legado. O lint identificou problemas existentes tanto no template `connect-plus-1.0.0` quanto em componentes de `src`; esses problemas precisam ser tratados separadamente.

Para validar o fluxo completo, execute a API, faça login com um usuário de desenvolvimento e confira uma operação autenticada, como a listagem de produtos. O backend cria dados iniciais por seed; consulte o README da API para esse primeiro acesso e para configurar integrações opcionais.

## Publicação

Publique o conteúdo de `dist/` em hospedagem estática, com fallback das rotas para `index.html`, pois a aplicação utiliza `BrowserRouter`. Configure `VITE_API_URL` antes do build para apontar para a API do ambiente de destino.

Credenciais BB, SMTP, banco e R2 pertencem exclusivamente à configuração do backend.
