using EstacionamentoApi.Models;

namespace EstacionamentoApi.Services
{
    /// <summary>
    /// Gerencia as operações do estacionamento: entrada, saída (com cobrança) e listagem.
    /// Registrado como Singleton para manter o estado em memória durante a vida da aplicação.
    /// </summary>
    public class EstacionamentoService
    {
        private readonly List<Veiculo> _veiculos = new();
        private readonly object _lock = new();
        public int VagasTotais { get; } = 20;

        private const decimal ValorPrimeiraHora = 8.00m;
        private const decimal ValorHoraAdicional = 4.00m;

        public int VagasOcupadas
        {
            get { lock (_lock) return _veiculos.Count(v => v.HoraSaida is null); }
        }

        public int VagasDisponiveis => VagasTotais - VagasOcupadas;

        public (bool sucesso, string mensagem, Veiculo? veiculo) AdicionarVeiculo(string placa, string modelo)
        {
            lock (_lock)
            {
                placa = (placa ?? string.Empty).ToUpper().Trim();
                modelo = (modelo ?? string.Empty).Trim();

                if (string.IsNullOrWhiteSpace(placa))
                    return (false, "A placa é obrigatória.", null);

                if (string.IsNullOrWhiteSpace(modelo))
                    return (false, "O modelo é obrigatório.", null);

                if (VagasDisponiveis <= 0)
                    return (false, "Estacionamento lotado. Não há vagas disponíveis.", null);

                if (_veiculos.Any(v => v.Placa == placa && v.HoraSaida is null))
                    return (false, $"O veículo de placa {placa} já está estacionado.", null);

                var veiculo = new Veiculo(placa, modelo);
                _veiculos.Add(veiculo);
                return (true, $"Veículo {placa} adicionado com sucesso.", veiculo);
            }
        }

        public (bool sucesso, string mensagem, Veiculo? veiculo, decimal valorCobrado) RemoverVeiculo(string placa)
        {
            lock (_lock)
            {
                placa = (placa ?? string.Empty).ToUpper().Trim();
                var veiculo = _veiculos.FirstOrDefault(v => v.Placa == placa && v.HoraSaida is null);

                if (veiculo is null)
                    return (false, $"Nenhum veículo com a placa {placa} foi encontrado estacionado.", null, 0);

                veiculo.HoraSaida = DateTime.Now;
                var valor = CalcularValor(veiculo.HoraEntrada, veiculo.HoraSaida.Value);
                return (true, "Saída registrada com sucesso.", veiculo, valor);
            }
        }

        public List<Veiculo> ListarEstacionados()
        {
            lock (_lock) return _veiculos.Where(v => v.HoraSaida is null).OrderBy(v => v.HoraEntrada).ToList();
        }

        public List<Veiculo> ListarHistorico()
        {
            lock (_lock) return _veiculos.OrderByDescending(v => v.HoraEntrada).ToList();
        }

        private decimal CalcularValor(DateTime entrada, DateTime saida)
        {
            var duracao = saida - entrada;

            if (duracao.TotalHours <= 1)
                return ValorPrimeiraHora;

            var horasAdicionais = Math.Ceiling(duracao.TotalHours - 1);
            return ValorPrimeiraHora + (decimal)horasAdicionais * ValorHoraAdicional;
        }

        public static string FormatarTempo(TimeSpan tempo)
        {
            return $"{(int)tempo.TotalHours}h {tempo.Minutes}min";
        }
    }
}
