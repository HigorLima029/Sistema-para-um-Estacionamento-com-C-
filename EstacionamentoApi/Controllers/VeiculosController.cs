using EstacionamentoApi.Models;
using EstacionamentoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace EstacionamentoApi.Controllers
{
    [ApiController]
    [Route("api/veiculos")]
    public class VeiculosController : ControllerBase
    {
        private readonly EstacionamentoService _service;

        public VeiculosController(EstacionamentoService service)
        {
            _service = service;
        }

        // GET /api/veiculos
        [HttpGet]
        public ActionResult<IEnumerable<VeiculoResponse>> ListarEstacionados()
        {
            var veiculos = _service.ListarEstacionados()
                .Select(v => new VeiculoResponse(v.Placa, v.Modelo, v.HoraEntrada, v.HoraSaida, v.HoraSaida is null));

            return Ok(veiculos);
        }

        // GET /api/veiculos/historico
        [HttpGet("historico")]
        public ActionResult<IEnumerable<VeiculoResponse>> ListarHistorico()
        {
            var veiculos = _service.ListarHistorico()
                .Select(v => new VeiculoResponse(v.Placa, v.Modelo, v.HoraEntrada, v.HoraSaida, v.HoraSaida is null));

            return Ok(veiculos);
        }

        // GET /api/veiculos/vagas
        [HttpGet("vagas")]
        public ActionResult<VagasResponse> ConsultarVagas()
        {
            return Ok(new VagasResponse(_service.VagasTotais, _service.VagasDisponiveis, _service.VagasOcupadas));
        }

        // POST /api/veiculos
        [HttpPost]
        public ActionResult<VeiculoResponse> AdicionarVeiculo([FromBody] NovoVeiculoRequest request)
        {
            var (sucesso, mensagem, veiculo) = _service.AdicionarVeiculo(request.Placa, request.Modelo);

            if (!sucesso || veiculo is null)
                return Conflict(new ErroResponse(mensagem));

            var response = new VeiculoResponse(veiculo.Placa, veiculo.Modelo, veiculo.HoraEntrada, veiculo.HoraSaida, true);
            return CreatedAtAction(nameof(ListarEstacionados), response);
        }

        // DELETE /api/veiculos/{placa}
        [HttpDelete("{placa}")]
        public ActionResult<SaidaResponse> RemoverVeiculo(string placa)
        {
            var (sucesso, mensagem, veiculo, valorCobrado) = _service.RemoverVeiculo(placa);

            if (!sucesso || veiculo is null)
                return NotFound(new ErroResponse(mensagem));

            var tempo = veiculo.HoraSaida!.Value - veiculo.HoraEntrada;
            var response = new SaidaResponse(
                veiculo.Placa,
                veiculo.HoraEntrada,
                veiculo.HoraSaida!.Value,
                EstacionamentoService.FormatarTempo(tempo),
                valorCobrado
            );

            return Ok(response);
        }
    }
}
