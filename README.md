# Sistema de Estacionamento — Full Stack

Backend em **ASP.NET Core Web API** (.NET 8) + front-end em **React + TypeScript + Vite**.

## Estrutura

```
.
├── EstacionamentoApi/          # Backend (Web API)
│   ├── Controllers/
│   │   └── VeiculosController.cs
│   ├── Models/
│   │   ├── Veiculo.cs
│   │   └── Dtos.cs
│   ├── Services/
│   │   └── EstacionamentoService.cs
│   └── Program.cs
│
└── estacionamento-frontend/    # Frontend (React)
    └── src/
        ├── App.tsx
        ├── App.css
        ├── api.ts
        └── types.ts
```

## Como rodar

### 1. Backend (API)

Pré-requisito: [.NET 8 SDK](https://dotnet.microsoft.com/download).

```bash
cd EstacionamentoApi
dotnet restore
dotnet run
```

A API sobe em `http://localhost:5209`. O Swagger fica disponível em `http://localhost:5209/swagger`.

### 2. Frontend (React)

Pré-requisito: [Node.js 18+](https://nodejs.org/).

Em outro terminal:

```bash
cd estacionamento-frontend
npm install
npm run dev
```

O front sobe em `http://localhost:5173` e já está configurado (CORS + URL da API) para conversar com o backend.

> Rode os dois ao mesmo tempo (dois terminais abertos) para o sistema funcionar de ponta a ponta.

## Endpoints da API

| Método | Rota                     | Descrição                                  |
|--------|---------------------------|---------------------------------------------|
| GET    | `/api/veiculos`           | Lista veículos atualmente estacionados      |
| GET    | `/api/veiculos/historico` | Lista todo o histórico (entradas e saídas)  |
| GET    | `/api/veiculos/vagas`     | Retorna vagas totais/ocupadas/disponíveis   |
| POST   | `/api/veiculos`           | Registra entrada `{ placa, modelo }`        |
| DELETE | `/api/veiculos/{placa}`   | Registra saída e retorna o valor cobrado    |

## Regras de cobrança

- Primeira hora (ou fração): **R$ 8,00**
- Cada hora adicional (ou fração): **R$ 4,00**

Ajustável em `EstacionamentoApi/Services/EstacionamentoService.cs`.

## Identidade visual do front-end

O front usa uma linguagem visual de pátio de estacionamento real:
- **Letreiro** no topo mostrando vagas disponíveis, como um painel luminoso de garagem
- **Tickets** com recorte lateral (como um bilhete de estacionamento) para cada veículo no pátio
- **Comprovante** de saída no estilo cupom fiscal, com valor cobrado e tempo permanecido


