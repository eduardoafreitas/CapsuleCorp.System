# CapsuleCorp.System.API 💊

[![.NET 9](https://img.shields.io/badge/.NET-9.0-blueviolet)](https://dotnet.microsoft.com/download/dotnet/9.0)
[![EF Core](https://img.shields.io/badge/EF%20Core-9.0-blue)](https://learn.microsoft.com/ef/core/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

API de autenticação desenvolvida em .NET 9, com foco em segurança, arquitetura limpa e integração com aplicações web modernas.

## 🚀 Status do Projeto

O núcleo de autenticação está implementado e funcional, incluindo autenticação baseada em JWT, refresh tokens e gerenciamento de usuários.

## 🛠 Tecnologias Utilizadas

* .NET 9 (ASP.NET Core)
* Entity Framework Core 9
* PostgreSQL
* JWT Authentication
* BCrypt.Net
* Swagger (OpenAPI)

## 🏗 Arquitetura

O projeto segue princípios de Clean Architecture, com separação entre responsabilidades de API, serviços, modelos e persistência de dados.

Principais componentes:

* **Controllers** — exposição dos endpoints REST.
* **Services** — regras de negócio e autenticação.
* **Data** — contexto do Entity Framework e migrations.
* **Models / DTOs** — entidades e objetos de transferência de dados.

## 📋 Funcionalidades

* [x] Registro de usuários.
* [x] Login com JWT.
* [x] Refresh Token com rotação.
* [x] Revogação de tokens.
* [x] Atualização de perfil.
* [x] Consulta de usuário autenticado.
* [x] Persistência com Entity Framework Core.
* [x] Documentação Swagger.

## 🔒 Segurança

* Senhas protegidas com BCrypt.
* Autenticação baseada em JWT.
* Refresh Tokens persistidos em banco de dados.
* Endpoints protegidos por autorização.
* Suporte a cookies HttpOnly para integração com SPA.

## ⚙️ Como executar

### Pré-requisitos

* .NET 9 SDK
* PostgreSQL
* Visual Studio 2022 ou VS Code

### Executando o projeto

1. Clone o repositório:

```bash
git clone https://github.com/eduardoafreitas/CapsuleCorp.System.git
```

2. Configure a conexão com o banco de dados e as chaves JWT em `appsettings.Development.json`.

3. Execute as migrations:

```bash
dotnet ef database update
```

4. Inicie a aplicação:

```bash
dotnet run
```

5. Acesse o Swagger pela URL exibida no console.

## 📡 Principais Endpoints

| Método | Endpoint                 |
| ------ | ------------------------ |
| POST   | /api/Auth/register       |
| POST   | /api/Auth/login          |
| POST   | /api/Auth/refresh        |
| POST   | /api/Auth/revoke         |
| PUT    | /api/Auth/update-profile |
| GET    | /api/Auth/me             |

## 🤝 Contribuição

Contribuições são bem-vindas através de Pull Requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT.
