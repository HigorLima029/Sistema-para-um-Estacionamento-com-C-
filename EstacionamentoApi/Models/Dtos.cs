namespace EstacionamentoApi.Models
{
    public record NovoVeiculoRequest(string Placa, string Modelo);

    public record VeiculoResponse(
        string Placa,
        string Modelo,
        DateTime HoraEntrada,
        DateTime? HoraSaida,
        bool Estacionado
    );

    public record SaidaResponse(
        string Placa,
        DateTime HoraEntrada,
        DateTime HoraSaida,
        string TempoPermanecido,
        decimal ValorCobrado
    );

    public record VagasResponse(int VagasTotais, int VagasDisponiveis, int VagasOcupadas);

    public record ErroResponse(string Mensagem);
}
