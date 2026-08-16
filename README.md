# PsiAngel

PsiAngel é um sistema de Gestão de Pacientes voltado para psicólogos, projetado para auxiliar na administração de sessões, perfis de pacientes e integração de autenticação simplificada através do Google.

## ✨ Funcionalidades

- **Autenticação Segura e Intuitiva:** 
  - Login rápido e seguro utilizando integração com o Google (OAuth 2.0).
  - Fluxo de logout simplificado e intuitivo.
- **Gestão de Pacientes:**
  - Cadastro completo de pacientes com informações pessoais e clínicas.
  - Validações cadastrais rigorosas, garantindo a integridade e precisão dos dados informados no sistema.
  - Listagem, visualização de prontuários e edição de perfis de pacientes de forma eficiente e centralizada.
- **Design Moderno:** Interface de usuário interativa, agradável e totalmente responsiva.
- **Segurança e Privacidade:** Comunicação criptografada via HTTPS em todo o projeto, e proteção de rotas através de autenticação por JWT (JSON Web Tokens).

---

## 🛠️ Especificações Técnicas (Tech Stack)

O projeto é dividido em duas aplicações principais (Backend e Frontend), conteinerizadas utilizando Docker.

### Backend
- **Framework:** ASP.NET Core 10.0
- **Linguagem:** C#
- **Banco de Dados:** PostgreSQL 16
- **ORM:** Entity Framework Core (Npgsql)
- **Autenticação:** JWT (JSON Web Tokens)
- **Documentação da API:** OpenAPI (Swagger) e Scalar

### Frontend
- **Framework:** React 19
- **Linguagem:** TypeScript
- **Bundler:** Vite 8 (com HTTPS habilitado)
- **Roteamento:** React Router DOM v7
- **Autenticação Externa:** Google OAuth (`@react-oauth/google`)

### Infraestrutura
- **Contêineres:** Docker e Docker Compose
- **Servidor Web:** Kestrel (Backend) com suporte a HTTPS

---

## 📋 Pré-requisitos

Para executar este projeto na sua máquina local, você precisará ter instalado:

- [Docker](https://www.docker.com/products/docker-desktop) e [Docker Compose](https://docs.docker.com/compose/install/)
- [SDK do .NET 10.0](https://dotnet.microsoft.com/download) (necessário para gerar os certificados de desenvolvimento locais e gerenciar migrações do banco de dados)

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e subir toda a infraestrutura do PsiAngel via Docker.

### 1. Configuração das Variáveis de Ambiente

Na raiz do projeto, existe um arquivo chamado `.env.example`. Ele serve como um template com as chaves necessárias e sempre será versionado (commitado) no Git.

Para configurar o seu ambiente local:
1. Copie o arquivo `.env.example` e renomeie a cópia para `.env`. 
2. **Atenção:** O arquivo `.env` conterá seus segredos e senhas e **NUNCA** deve ser commitado (ele já deve estar listado no seu `.gitignore`).

Preencha os valores no seu novo arquivo `.env`. O conteúdo obrigatório é:
```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=suasenha
POSTGRES_DB=PsiAngeldb

ENCRYPTION_TOKENS_KEY=sua_chave_de_criptografia_base64
JWT_SECRET=sua_chave_secreta_jwt
JWT_ISSUER=PsiAngelBackend
JWT_AUDIENCE=PsiAngelFrontend

VITE_API_URL=https://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=seu_client_id_do_google
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
CERTIFICATE_PASSWORD=sua_senha_segura
```

### 2. Configuração do Certificado HTTPS para o Backend

Como a aplicação exige comunicação segura (HTTPS), o backend no ASP.NET Core precisa de um certificado de desenvolvedor válido que será montado para dentro do contêiner Docker.

No seu terminal (Windows PowerShell), gere o certificado exportando para a pasta local da sua máquina executando:
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.aspnet\https"
dotnet dev-certs https -ep "$env:USERPROFILE\.aspnet\https\psiangel.pfx" -p "sua_senha_segura"
```
*(Certifique-se de que a senha utilizada acima seja a mesma definida na variável `CERTIFICATE_PASSWORD` do seu arquivo `.env`).*


### 3. Subindo a Infraestrutura com Docker

Após configurar as variáveis de ambiente e o certificado HTTPS, construa e suba os contêineres executando:

```powershell
docker-compose up -d --build
```

Os seguintes serviços serão iniciados:
- **db:** Banco de dados PostgreSQL (exposto na porta `5433`).
- **api:** Backend .NET (exposto na porta `5001`).
- **frontend:** Frontend React+Vite (exposto na porta `5173`).



## 🌐 Acessando a Aplicação

- **Frontend:** Abra seu navegador e acesse [https://localhost:5173](https://localhost:5173). 
  *(Obs: Como é um certificado local de desenvolvimento, o navegador exibirá um alerta de "Conexão não segura". Clique em Avançado > Continuar / Ir para localhost para ignorar esse aviso).*
- **Backend API (Swagger/Scalar):** Acesse [https://localhost:5001/scalar](https://localhost:5001/scalar) para visualizar a documentação interativa da API.

---

## 🧪 Testes Automatizados

O projeto conta com testes automatizados para garantir a integridade e qualidade do código.

### Backend (xUnit & Moq)
Os testes do backend estão localizados na pasta `/Backend.Tests`. Para executá-los, utilize:
```powershell
cd Backend.Tests
dotnet test
```

### Frontend (Vitest & React Testing Library)
Os testes do frontend utilizam o Vitest. O projeto utiliza o `bun` como gerenciador de pacotes. Para executá-los, utilize:
```powershell
cd Frontend
bun run test
# ou para abrir a interface gráfica do Vitest:
bun run test:ui
```

---

## 📁 Estrutura do Projeto

- `/Backend`: Contém o código fonte do backend em ASP.NET Core (Controllers, Models, DTOs, DbContext).
- `/Frontend`: Contém o código fonte do frontend em React + TypeScript.
- `docker-compose.yml`: Orquestração dos serviços.
- `.env`: Configurações sensíveis (não versionado).
