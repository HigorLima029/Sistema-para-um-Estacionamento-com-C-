import type { Vagas, Veiculo, Saida, ErroApi } from './types'

const BASE_URL = 'http://localhost:5209/api'

async function tratarResposta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const erro: ErroApi = await res.json().catch(() => ({ mensagem: 'Erro inesperado.' }))
    throw new Error(erro.mensagem)
  }
  return res.json() as Promise<T>
}

export const api = {
  listarEstacionados: (): Promise<Veiculo[]> =>
    fetch(`${BASE_URL}/veiculos`).then((r) => tratarResposta(r)),

  listarHistorico: (): Promise<Veiculo[]> =>
    fetch(`${BASE_URL}/veiculos/historico`).then((r) => tratarResposta(r)),

  consultarVagas: (): Promise<Vagas> =>
    fetch(`${BASE_URL}/veiculos/vagas`).then((r) => tratarResposta(r)),

  adicionarVeiculo: (placa: string, modelo: string): Promise<Veiculo> =>
    fetch(`${BASE_URL}/veiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa, modelo }),
    }).then((r) => tratarResposta(r)),

  removerVeiculo: (placa: string): Promise<Saida> =>
    fetch(`${BASE_URL}/veiculos/${encodeURIComponent(placa)}`, {
      method: 'DELETE',
    }).then((r) => tratarResposta(r)),
}
