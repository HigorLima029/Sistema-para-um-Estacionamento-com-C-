namespace EstacionamentoApi.Models
{
    public class Veiculo
    {
        public string Placa { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public DateTime HoraEntrada { get; set; }
        public DateTime? HoraSaida { get; set; }

        public Veiculo() { }

        public Veiculo(string placa, string modelo)
        {
            Placa = placa.ToUpper().Trim();
            Modelo = modelo.Trim();
            HoraEntrada = DateTime.Now;
        }
    }
}
