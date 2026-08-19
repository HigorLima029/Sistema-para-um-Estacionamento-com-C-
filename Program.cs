using EstacionamentoApp.Services;

var estacionamento = new Estacionamento(vagasTotais: 20);

bool executando = true;

while (executando)
{
    ExibirMenu();
    var opcao = Console.ReadLine();

    switch (opcao)
    {
        case "1":
            AdicionarVeiculo();
            break;
        case "2":
            RemoverVeiculo();
            break;
        case "3":
            ListarVeiculos();
            break;
        case "4":
            ListarHistorico();
            break;
        case "0":
            executando = false;
            Console.WriteLine("Encerrando o sistema. Até logo!");
            break;
        default:
            Console.WriteLine("Opção inválida. Tente novamente.");
            break;
    }

    if (executando)
    {
        Console.WriteLine("\nPressione ENTER para continuar...");
        Console.ReadLine();
    }
}

void ExibirMenu()
{
    Console.Clear();
    Console.WriteLine("=== SISTEMA DE ESTACIONAMENTO ===");
    Console.WriteLine($"Vagas disponíveis: {estacionamento.VagasDisponiveis}");
    Console.WriteLine("----------------------------------");
    Console.WriteLine("1 - Adicionar veículo");
    Console.WriteLine("2 - Remover veículo (calcular valor)");
    Console.WriteLine("3 - Listar veículos estacionados");
    Console.WriteLine("4 - Listar histórico completo");
    Console.WriteLine("0 - Sair");
    Console.Write("Escolha uma opção: ");
}

void AdicionarVeiculo()
{
    Console.WriteLine("\n--- Adicionar Veículo ---");
    Console.Write("Placa: ");
    var placa = Console.ReadLine() ?? "";
    Console.Write("Modelo: ");
    var modelo = Console.ReadLine() ?? "";

    var sucesso = estacionamento.AdicionarVeiculo(placa, modelo, out var mensagem);
    Console.WriteLine(sucesso ? $"✔ {mensagem}" : $"✘ {mensagem}");
}

void RemoverVeiculo()
{
    Console.WriteLine("\n--- Remover Veículo ---");
    Console.Write("Placa: ");
    var placa = Console.ReadLine() ?? "";

    var sucesso = estacionamento.RemoverVeiculo(placa, out var mensagem, out var valor);
    Console.WriteLine(sucesso ? $"✔ {mensagem}" : $"✘ {mensagem}");
}

void ListarVeiculos()
{
    Console.WriteLine("\n--- Veículos Estacionados ---");
    var veiculos = estacionamento.ListarVeiculosEstacionados();

    if (veiculos.Count == 0)
    {
        Console.WriteLine("Nenhum veículo estacionado no momento.");
        return;
    }

    foreach (var v in veiculos)
        Console.WriteLine(v);
}

void ListarHistorico()
{
    Console.WriteLine("\n--- Histórico Completo ---");
    var veiculos = estacionamento.ListarHistorico();

    if (veiculos.Count == 0)
    {
        Console.WriteLine("Nenhum registro encontrado.");
        return;
    }

    foreach (var v in veiculos)
        Console.WriteLine(v);
}
