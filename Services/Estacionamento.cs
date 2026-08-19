using EstacionamentoApp.Models;

namespace EstacionamentoApp.Services
{
    /// <summary>
    /// Gerencia as operações do estacionamento: entrada, saída (com cobrança) e listagem.
    /// </summary>
    public class Estacionamento
    {
        private readonly List<Veiculo> _veiculos = new();
        private readonly int _vagasTotais;

        // Regras de cobrança (ajuste conforme a necessidade do lab)
        private const decimal ValorPrimeiraHora = 8.00m;
        private const decimal ValorHoraAdicional = 4.00m;

        public Estacionamento(int vagasTotais = 20)
        {
            _vagasTotais = vagasTotais;
        }

        public int VagasDisponiveis => _vagasTotais - _veiculos.Count(v => v.HoraSaida is null);

        /// <summary>
        /// Adiciona um veículo ao estacionamento.
        /// </summary>
        public bool AdicionarVeiculo(string placa, string modelo, out string mensagem)
        {
            placa = placa.ToUpper().Trim();

            if (string.IsNullOrWhiteSpace(placa))
            {
                mensagem = "Placa inválida.";
                return false;
            }

            if (VagasDisponiveis <= 0)
            {
                mensagem = "Estacionamento lotado. Não há vagas disponíveis.";
                return false;
            }

            if (_veiculos.Any(v => v.Placa == placa && v.HoraSaida is null))
            {
                mensagem = $"O veículo de placa {placa} já está estacionado.";
                return false;
            }

            var veiculo = new Veiculo(placa, modelo);
            _veiculos.Add(veiculo);
            mensagem = $"Veículo {placa} adicionado com sucesso às {veiculo.HoraEntrada:HH:mm:ss}.";
            return true;
        }

        /// <summary>
        /// Remove um veículo do estacionamento e calcula o valor a ser cobrado.
        /// </summary>
        public bool RemoverVeiculo(string placa, out string mensagem, out decimal valorCobrado)
        {
            placa = placa.ToUpper().Trim();
            valorCobrado = 0;

            var veiculo = _veiculos.FirstOrDefault(v => v.Placa == placa && v.HoraSaida is null);

            if (veiculo is null)
            {
                mensagem = $"Nenhum veículo com a placa {placa} foi encontrado estacionado.";
                return false;
            }

            veiculo.HoraSaida = DateTime.Now;
            valorCobrado = CalcularValor(veiculo.HoraEntrada, veiculo.HoraSaida.Value);

            var tempoTotal = veiculo.HoraSaida.Value - veiculo.HoraEntrada;
            mensagem = $"Veículo {placa} removido. Tempo estacionado: {FormatarTempo(tempoTotal)}. " +
                       $"Valor cobrado: {valorCobrado:C2}";
            return true;
        }

        /// <summary>
        /// Lista todos os veículos atualmente estacionados.
        /// </summary>
        public List<Veiculo> ListarVeiculosEstacionados()
        {
            return _veiculos.Where(v => v.HoraSaida is null).ToList();
        }

        /// <summary>
        /// Lista o histórico completo (estacionados e que já saíram).
        /// </summary>
        public List<Veiculo> ListarHistorico()
        {
            return _veiculos.ToList();
        }

        /// <summary>
        /// Calcula o valor cobrado com base no tempo permanecido.
        /// Primeira hora com valor fixo; horas adicionais (fração vira hora cheia) com valor por hora.
        /// </summary>
        private decimal CalcularValor(DateTime entrada, DateTime saida)
        {
            var duracao = saida - entrada;

            if (duracao.TotalMinutes <= 0)
                return ValorPrimeiraHora;

            if (duracao.TotalHours <= 1)
                return ValorPrimeiraHora;

            var horasAdicionais = Math.Ceiling(duracao.TotalHours - 1);
            return ValorPrimeiraHora + (decimal)horasAdicionais * ValorHoraAdicional;
        }

        private static string FormatarTempo(TimeSpan tempo)
        {
            return $"{(int)tempo.TotalHours}h {tempo.Minutes}min";
        }
    }
}
