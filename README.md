# Sistema de Estacionamento

Projeto de LAB desenvolvido em **C# / .NET** para gerenciar veículos em um estacionamento.

## Funcionalidades

- ✅ Adicionar veículo (entrada)
- ✅ Remover veículo (saída), calculando e exibindo o valor cobrado pelo período
- ✅ Listar veículos atualmente estacionados
- ✅ Listar histórico completo (entradas e saídas)
- ✅ Controle de vagas disponíveis

## Regras de cobrança

- Primeira hora (ou fração): **R$ 8,00**
- Cada hora adicional (ou fração): **R$ 4,00**

> Essas regras estão centralizadas em `Services/Estacionamento.cs` e podem ser ajustadas facilmente.

## Estrutura do projeto

```
EstacionamentoApp/
├── Models/
│   └── Veiculo.cs          # Entidade que representa o veículo
├── Services/
│   └── Estacionamento.cs   # Regras de negócio (adicionar, remover, listar, cobrança)
├── Program.cs              # Menu interativo no console
├── EstacionamentoApp.csproj
└── .gitignore
```

## Como executar

Pré-requisito: [.NET 8 SDK](https://dotnet.microsoft.com/download) instalado.

```bash
# Clonar o repositório
git clone <url-do-seu-repositorio>
cd EstacionamentoApp

# Rodar o projeto
dotnet run
```

## Como subir para o GitHub

```bash
git init
git add .
git commit -m "Estrutura inicial do sistema de estacionamento"
git branch -M main
git remote add origin <url-do-seu-repositorio>
git push -u origin main
```

## Possíveis evoluções

- Persistência em banco de dados (SQLite/SQL Server) ao invés de lista em memória
- Testes unitários (xUnit) para a classe `Estacionamento`
- API REST (ASP.NET Core) expondo as mesmas operações
- Diferentes tipos de veículo com tarifas distintas (carro, moto, caminhão)
