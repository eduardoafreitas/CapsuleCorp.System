# CapsuleCorp System

Ecossistema para autenticação, RBAC e monitoramento de telemetria de equipamentos de ressonância magnética.

API de autenticação desenvolvida em .NET 9, com foco em segurança, arquitetura limpa e integração com aplicações web modernas.

- .NET 9
- React + Vite + TypeScript
- PostgreSQL
- JWT + refresh tokens
- SignalR para telemetria em tempo real
- Entity Framework Core

## Projetos

| Projeto | Função |
| --- | --- |
| `CapsuleCorp.Auth` | API de autenticação, refresh token, usuários e roles |
| `CapsuleCorp.Monitor.API` | API de telemetria, histórico e SignalR hub |
| `CapsuleCorp.Simulator` | Simulador IoT de equipamentos MRI |
| `frontend` | SPA React com dashboard, RBAC e tema claro/escuro |
| `CapsuleCorp.Shared` | Modelos compartilhados |

## Como Executar

### Pré-requisitos

- .NET SDK instalado
- Node.js LTS
- PostgreSQL

### Backend

Configure as connection strings e chaves JWT em `appsettings.Development.json` dos projetos:

- `CapsuleCorp.Auth`
- `CapsuleCorp.Monitor.API`

Restaure e compile:

```bash
dotnet restore
dotnet build
```

Execute as APIs pelo Visual Studio, Rider ou terminal.

### Frontend

Na pasta `frontend`, configure as variáveis se necessário:

```env
VITE_API_URL=https://localhost:5001
VITE_MONITOR_API_URL=https://localhost:6001
VITE_MONITOR_HUB_URL=https://localhost:6001/telemetryHub
```

Execute:

```bash
npm install
npm run dev
```

### Simulador

Execute `CapsuleCorp.Simulator` para iniciar o envio contínuo de telemetria ao Monitor API.

## Autenticação e Roles

Roles seedadas:

- `Admin`
- `Editor`
- `Viewer`

Permissões atuais:

| Recurso | Roles |
| --- | --- |
| Dashboard de telemetria | Admin, Editor, Viewer |
| Teste de tela de conexão | Admin, Editor |
| Gestão de usuários e roles | Admin |

O front possui uma tela `Usuarios` para admins alterarem roles sem editar manualmente a tabela `UserRoles`. O usuário alterado deve refazer login para receber um JWT atualizado.

## Telemetria

Endpoints principais:

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | `/api/telemetria` | Recebe payload do simulador e transmite via SignalR |
| GET | `/api/telemetria` | Consulta histórico paginado |
| GET | `/api/telemetria/latest` | Retorna a última telemetria de cada equipamento |
| Hub | `/telemetryHub` | Canal SignalR para atualizações em tempo real |

O dashboard carrega primeiro `/api/telemetria/latest` e continua atualizando em tempo real pelo SignalR.

## Endpoints de Auth

| Método | Endpoint |
| --- | --- |
| POST | `/api/Auth/register` |
| POST | `/api/Auth/login` |
| POST | `/api/Auth/refresh` |
| POST | `/api/Auth/logout` |
| POST | `/api/Auth/revoke` |
| PUT | `/api/Auth/update-profile` |
| GET | `/api/Auth/me` |
| GET | `/api/admin/users` |
| PUT | `/api/admin/users/{userId}/roles` |

## Notas de Desenvolvimento

- O simulador ainda envia telemetria para `POST /api/telemetria` sem autenticação própria para não quebrar o fluxo local.
- Consultas de telemetria e SignalR exigem JWT válido.
- Se uma role for alterada, faça logout/login para atualizar as claims no token.
- O tema claro foi refatorado com tokens próprios de superfície, sombra, borda e contraste.
