namespace EstacionamentoApp.Models
{
    /// <summary>
    /// Representa um veículo estacionado.
    /// </summary>
    public class Veiculo
    {
        public string Placa { get; set; }
        public string Modelo { get; set; }
        public DateTime HoraEntrada { get; set; }
        public DateTime? HoraSaida { get; set; }

        public Veiculo(string placa, string modelo)
        {
            Placa = placa.ToUpper().Trim();
            Modelo = modelo.Trim();
            HoraEntrada = DateTime.Now;
        }

        public override string ToString()
        {
            var status = HoraSaida is null ? "Estacionado" : "Saiu";
            return $"Placa: {Placa} | Modelo: {Modelo} | Entrada: {HoraEntrada:dd/MM/yyyy HH:mm:ss} | Status: {status}";
        }
    }
}
