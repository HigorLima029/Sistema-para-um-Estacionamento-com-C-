import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import type { Vagas, Veiculo, Saida } from './types'
import './App.css'

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function tempoDecorrido(iso: string, agora: number): string {
  const entrada = new Date(iso).getTime()
  const diffMs = Math.max(0, agora - entrada)
  const horas = Math.floor(diffMs / 3_600_000)
  const minutos = Math.floor((diffMs % 3_600_000) / 60_000)
  return `${horas}h ${minutos.toString().padStart(2, '0')}min`
}

export default function App() {
  const [vagas, setVagas] = useState<Vagas | null>(null)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [recibo, setRecibo] = useState<Saida | null>(null)
  const [agora, setAgora] = useState(Date.now())
  const [offline, setOffline] = useState(false)

  const carregarDados = async () => {
    try {
      const [v, lista] = await Promise.all([api.consultarVagas(), api.listarEstacionados()])
      setVagas(v)
      setVeiculos(lista)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }

  useEffect(() => {
    carregarDados()
    const poll = setInterval(carregarDados, 8000)
    const relogio = setInterval(() => setAgora(Date.now()), 30_000)
    return () => {
      clearInterval(poll)
      clearInterval(relogio)
    }
  }, [])

  const vagasLotado = vagas !== null && vagas.vagasDisponiveis <= 0

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!placa.trim() || !modelo.trim()) {
      setErro('Preencha placa e modelo do veículo.')
      return
    }

    setCarregando(true)
    try {
      await api.adicionarVeiculo(placa, modelo)
      setPlaca('')
      setModelo('')
      await carregarDados()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível registrar a entrada.')
    } finally {
      setCarregando(false)
    }
  }

  const handleRemover = async (placaVeiculo: string) => {
    setErro(null)
    try {
      const saida = await api.removerVeiculo(placaVeiculo)
      setRecibo(saida)
      await carregarDados()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível registrar a saída.')
    }
  }

  const vagasTexto = useMemo(() => {
    if (!vagas) return '—'
    return String(vagas.vagasDisponiveis).padStart(2, '0')
  }, [vagas])

  return (
    <div className="pagina">
      <header className="letreiro">
        <div className="letreiro__marca">
          <span className="letreiro__ponto" aria-hidden />
          PÁTIO CENTRAL
        </div>
        <div className={`letreiro__vagas ${vagasLotado ? 'letreiro__vagas--lotado' : ''}`}>
          <span className="letreiro__numero">{vagasTexto}</span>
          <span className="letreiro__label">{vagasLotado ? 'LOTADO' : 'VAGAS LIVRES'}</span>
        </div>
      </header>

      {offline && (
        <div className="aviso aviso--offline" role="alert">
          Não foi possível falar com a API em <code>localhost:5209</code>. Confirme se o backend
          está rodando (<code>dotnet run</code> dentro de <code>EstacionamentoApi</code>).
        </div>
      )}

      <main className="conteudo">
        <section className="painel painel--entrada">
          <h2 className="painel__titulo">Registrar entrada</h2>
          <form onSubmit={handleAdicionar} className="formulario">
            <label className="campo">
              <span>Placa</span>
              <input
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC1D23"
                maxLength={8}
                className="campo__input campo__input--mono"
              />
            </label>
            <label className="campo">
              <span>Modelo</span>
              <input
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Honda Civic"
                className="campo__input"
              />
            </label>
            {erro && <p className="erro">{erro}</p>}
            <button type="submit" className="botao botao--primario" disabled={carregando || vagasLotado}>
              {vagasLotado ? 'Sem vagas' : carregando ? 'Registrando…' : 'Emitir ticket de entrada'}
            </button>
          </form>
        </section>

        <section className="painel painel--lista">
          <h2 className="painel__titulo">
            Veículos no pátio <span className="painel__contagem">({veiculos.length})</span>
          </h2>

          {veiculos.length === 0 ? (
            <p className="vazio">Nenhum veículo estacionado no momento.</p>
          ) : (
            <div className="grade-tickets">
              {veiculos.map((v) => (
                <article className="ticket" key={v.placa}>
                  <div className="ticket__topo">
                    <span className="ticket__placa">{v.placa}</span>
                    <span className="ticket__hora">entrada {formatarHora(v.horaEntrada)}</span>
                  </div>
                  <p className="ticket__modelo">{v.modelo}</p>
                  <p className="ticket__decorrido">{tempoDecorrido(v.horaEntrada, agora)} no pátio</p>
                  <button className="botao botao--saida" onClick={() => handleRemover(v.placa)}>
                    Registrar saída
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {recibo && <Recibo saida={recibo} onFechar={() => setRecibo(null)} />}
    </div>
  )
}

function Recibo({ saida, onFechar }: { saida: Saida; onFechar: () => void }) {
  const valorFormatado = saida.valorCobrado.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="sobreposicao" role="dialog" aria-modal="true" aria-label="Comprovante de saída">
      <div className="cupom">
        <p className="cupom__cabecalho">PÁTIO CENTRAL</p>
        <p className="cupom__subcabecalho">comprovante de saída</p>
        <div className="cupom__linha-tracejada" />
        <dl className="cupom__dados">
          <div>
            <dt>Placa</dt>
            <dd className="mono">{saida.placa}</dd>
          </div>
          <div>
            <dt>Entrada</dt>
            <dd>{formatarHora(saida.horaEntrada)}</dd>
          </div>
          <div>
            <dt>Saída</dt>
            <dd>{formatarHora(saida.horaSaida)}</dd>
          </div>
          <div>
            <dt>Tempo</dt>
            <dd>{saida.tempoPermanecido}</dd>
          </div>
        </dl>
        <div className="cupom__linha-tracejada" />
        <div className="cupom__total">
          <span>Total</span>
          <span className="mono">{valorFormatado}</span>
        </div>
        <button className="botao botao--primario cupom__fechar" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}
