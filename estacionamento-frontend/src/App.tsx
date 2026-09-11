import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import type { Vagas, Veiculo, Saida } from './types'
import './App.css'

function formatarDataHora(iso: string): string {
  const data = new Date(iso)
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function tempoDecorrido(iso: string, agora: number): string {
  const entrada = new Date(iso).getTime()
  const diffMs = Math.max(0, agora - entrada)
  const horas = Math.floor(diffMs / 3_600_000)
  const minutos = Math.floor((diffMs % 3_600_000) / 60_000)
  if (horas === 0) {
    return `${minutos} min`
  }
  return `${horas}h ${minutos.toString().padStart(2, '0')}min`
}

function calcularValorEstimado(horaEntradaIso: string, agoraMs: number): number {
  const entradaMs = new Date(horaEntradaIso).getTime()
  const duracaoHoras = Math.max(0, (agoraMs - entradaMs) / 3_600_000)
  if (duracaoHoras <= 1) return 8.0
  const horasAdicionais = Math.ceil(duracaoHoras - 1)
  return 8.0 + horasAdicionais * 4.0
}

export default function App() {
  const [vagas, setVagas] = useState<Vagas | null>(null)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [historico, setHistorico] = useState<Veiculo[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'patio' | 'historico'>('patio')
  const [busca, setBusca] = useState('')
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [recibo, setRecibo] = useState<Saida | null>(null)
  const [veiculoParaRemover, setVeiculoParaRemover] = useState<Veiculo | null>(null)
  const [agora, setAgora] = useState(Date.now())
  const [offline, setOffline] = useState(false)

  const carregarDados = async () => {
    try {
      const [v, lista, hist] = await Promise.all([
        api.consultarVagas(),
        api.listarEstacionados(),
        api.listarHistorico().catch(() => []),
      ])
      setVagas(v)
      setVeiculos(lista)
      setHistorico(hist)
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }

  useEffect(() => {
    carregarDados()
    const poll = setInterval(carregarDados, 6000)
    const relogio = setInterval(() => setAgora(Date.now()), 10_000)
    return () => {
      clearInterval(poll)
      clearInterval(relogio)
    }
  }, [])

  const vagasTotais = vagas?.vagasTotais ?? 20
  const vagasOcupadas = vagas?.vagasOcupadas ?? veiculos.length
  const vagasDisponiveis = vagas?.vagasDisponiveis ?? (vagasTotais - vagasOcupadas)
  const vagasLotado = vagasDisponiveis <= 0

  const percentualOcupacao = useMemo(() => {
    if (vagasTotais === 0) return 0
    return Math.min(100, Math.round((vagasOcupadas / vagasTotais) * 100))
  }, [vagasTotais, vagasOcupadas])

  const statusCor = useMemo(() => {
    if (percentualOcupacao >= 90) return 'vermelho'
    if (percentualOcupacao >= 60) return 'amarelo'
    return 'verde'
  }, [percentualOcupacao])

  const mensagemStatus = useMemo(() => {
    if (vagasLotado) return 'Pátio 100% LOTADO! Entradas bloqueadas até que haja uma saída.'
    if (percentualOcupacao >= 90) return `Atenção: Quase lotado! Apenas ${vagasDisponiveis} vaga(s) restante(s).`
    if (percentualOcupacao >= 60) return `Pátio movimentado com ${vagasOcupadas} vagas em uso.`
    if (vagasOcupadas > 0) return `Operação normal: ${vagasDisponiveis} vagas livres disponíveis.`
    return 'Pátio totalmente livre! Todas as 20 vagas disponíveis para novos clientes.'
  }, [vagasLotado, percentualOcupacao, vagasDisponiveis, vagasOcupadas])

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)

    const placaLimpa = placa.trim().toUpperCase()
    const modeloLimpo = modelo.trim()

    if (!placaLimpa || !modeloLimpo) {
      setErro('Por favor, informe a placa e o modelo do veículo.')
      return
    }

    if (placaLimpa.length < 7) {
      setErro('A placa deve ter pelo menos 7 caracteres (Padrão Mercosul ou Tradicional).')
      return
    }

    setCarregando(true)
    try {
      await api.adicionarVeiculo(placaLimpa, modeloLimpo)
      setSucesso(`Veículo ${placaLimpa} (${modeloLimpo}) estacionado com sucesso!`)
      setPlaca('')
      setModelo('')
      await carregarDados()
      setTimeout(() => setSucesso(null), 4000)
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

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8)
    setPlaca(valor)
  }

  const veiculosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return veiculos
    return veiculos.filter(
      (v) => v.placa.toLowerCase().includes(termo) || v.modelo.toLowerCase().includes(termo)
    )
  }, [veiculos, busca])

  const historicoFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return historico
    return historico.filter(
      (v) => v.placa.toLowerCase().includes(termo) || v.modelo.toLowerCase().includes(termo)
    )
  }, [historico, busca])

  const preencherModeloRapido = (nome: string) => {
    setModelo(nome)
  }

  return (
    <div className="pagina">
      {/* ---------- HEADER PRINCIPAL COM STATUS DA API ---------- */}
      <header className="cabecalho-principal">
        <div className="cabecalho-principal__marca">
          <div className="marca-icone" aria-hidden>
            <span>🅿️</span>
          </div>
          <div>
            <h1 className="marca-titulo">PÁTIO CENTRAL</h1>
            <p className="marca-subtitulo">Sistema Inteligente de Controle de Estacionamento</p>
          </div>
        </div>

        <div className="cabecalho-principal__status">
          <div className={`status-conexao ${offline ? 'status-conexao--offline' : 'status-conexao--online'}`}>
            <span className="status-conexao__ponto" />
            <span>{offline ? 'API Offline (localhost:5209)' : 'Servidor Conectado'}</span>
          </div>
          <div className="relogio-digital">
            <span>{new Date(agora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
            <span className="relogio-separador">•</span>
            <span className="relogio-hora">{new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {/* ---------- ALERTA DE OFFLINE SE NECESSÁRIO ---------- */}
      {offline && (
        <div className="aviso-offline" role="alert">
          <span className="aviso-offline__icone">⚠️</span>
          <div>
            <strong>Atenção: Não foi possível comunicar com a API backend.</strong>
            <p>Verifique se o backend está executando no terminal com <code>dotnet run</code> dentro da pasta <code>EstacionamentoApi</code>.</p>
          </div>
        </div>
      )}

      {/* ---------- DASHBOARD COM CARDS KPI & STATUS DO PÁTIO ---------- */}
      <section className="dashboard-topo" aria-label="Resumo do Estacionamento">
        <div className="kpi-grid">
          {/* CARD 1: VAGAS DISPONÍVEIS */}
          <div className={`kpi-card ${vagasLotado ? 'kpi-card--alerta' : 'kpi-card--destaque'}`}>
            <div className="kpi-card__icone">🟢</div>
            <div className="kpi-card__conteudo">
              <span className="kpi-card__label">VAGAS LIVRES</span>
              <div className="kpi-card__numero">{vagasDisponiveis}</div>
              <span className="kpi-card__sub">{vagasLotado ? 'Estacionamento lotado' : 'Disponíveis para entrada'}</span>
            </div>
          </div>

          {/* CARD 2: VEÍCULOS NO PÁTIO */}
          <div className="kpi-card">
            <div className="kpi-card__icone">🚗</div>
            <div className="kpi-card__conteudo">
              <span className="kpi-card__label">VEÍCULOS NO PÁTIO</span>
              <div className="kpi-card__numero">{vagasOcupadas}</div>
              <span className="kpi-card__sub">de {vagasTotais} vagas totais</span>
            </div>
          </div>

          {/* CARD 3: TAXA DE OCUPAÇÃO */}
          <div className="kpi-card">
            <div className="kpi-card__icone">📊</div>
            <div className="kpi-card__conteudo">
              <span className="kpi-card__label">OCUPAÇÃO DO PÁTIO</span>
              <div className="kpi-card__numero">{percentualOcupacao}%</div>
              <span className="kpi-card__sub">Capacidade em uso</span>
            </div>
          </div>

          {/* CARD 4: TABELA DE TARIFAS */}
          <div className="kpi-card kpi-card--tarifa">
            <div className="kpi-card__icone">🏷️</div>
            <div className="kpi-card__conteudo">
              <span className="kpi-card__label">TABELA DE COBRANÇA</span>
              <div className="tarifa-valores">
                <span className="tarifa-destaque">R$ 8,00 <small>(1ª hora)</small></span>
                <span className="tarifa-separador">+</span>
                <span className="tarifa-destaque">R$ 4,00 <small>(hora adicional)</small></span>
              </div>
              <span className="kpi-card__sub">Cálculo automático por permanência</span>
            </div>
          </div>
        </div>

        {/* BARRA DE CAPACIDADE AMPLA E COM MENSAGEM CONVERSACIONAL */}
        <div className="barra-capacidade-container">
          <div className="barra-capacidade-info">
            <div className="barra-capacidade-status">
              <span className={`badge-status badge-status--${statusCor}`} />
              <span className="barra-capacidade-frase">{mensagemStatus}</span>
            </div>
            <span className="barra-capacidade-proporcao">
              {vagasOcupadas} / {vagasTotais} vagas ocupadas
            </span>
          </div>
          <div className="barra-progresso">
            <div
              className={`barra-progresso__preenchimento barra-progresso__preenchimento--${statusCor}`}
              style={{ width: `${percentualOcupacao}%` }}
            />
          </div>
        </div>
      </section>

      {/* ---------- ÁREA DE TRABALHO: 2 COLUNAS CLARAS E INTUITIVAS ---------- */}
      <main className="area-trabalho">
        {/* COLUNA ESQUERDA: PASSO 1 - ENTRADA DE VEÍCULOS */}
        <section className="painel-card painel-entrada">
          <div className="painel-card__cabecalho">
            <span className="passo-etiqueta">PASSO 1</span>
            <h2 className="painel-card__titulo">Registrar Entrada de Veículo</h2>
            <p className="painel-card__descricao">
              Digite a placa e o modelo para emitir o ticket de entrada e iniciar o cálculo do tempo.
            </p>
          </div>

          <form onSubmit={handleAdicionar} className="formulario-entrada">
            {/* CAMPO DE PLACA COM ESTILO VEICULAR MERCOSUL */}
            <div className="campo-grupo">
              <label htmlFor="input-placa" className="campo-rotulo">
                <span>Placa do Veículo</span>
                <span className="rotulo-ajuda">Mercosul ou Tradicional</span>
              </label>

              <div className="placa-veicular-container">
                <div className="placa-veicular-faixa">
                  <span className="placa-pais">BRASIL</span>
                  <span className="placa-bandeira">🇧🇷</span>
                </div>
                <input
                  id="input-placa"
                  value={placa}
                  onChange={handlePlacaChange}
                  placeholder="ABC1D23"
                  maxLength={8}
                  className="placa-veicular-input"
                  autoComplete="off"
                  disabled={vagasLotado}
                />
              </div>
            </div>

            {/* CAMPO DE MODELO */}
            <div className="campo-grupo">
              <label htmlFor="input-modelo" className="campo-rotulo">
                <span>Modelo do Veículo</span>
                <span className="rotulo-ajuda">Marca e modelo</span>
              </label>
              <input
                id="input-modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Honda Civic, Fiat Uno, Corolla..."
                className="input-padrao"
                disabled={vagasLotado}
              />

              {/* SUGESTÕES RÁPIDAS DE CATEGORIAS */}
              <div className="atalhos-modelo">
                <span className="atalhos-label">Preenchimento rápido:</span>
                <div className="atalhos-botoes">
                  {['Toyota Corolla', 'Honda Civic', 'Chevrolet Onix', 'Jeep Compass', 'Moto Honda'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="botao-atalho"
                      onClick={() => preencherModeloRapido(item)}
                      disabled={vagasLotado}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FEEDBACK DE ERRO OU SUCESSO */}
            {erro && (
              <div className="mensagem-alerta mensagem-alerta--erro" role="alert">
                <span>❌</span>
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="mensagem-alerta mensagem-alerta--sucesso" role="status">
                <span>✅</span>
                <span>{sucesso}</span>
              </div>
            )}

            {/* BOTÃO PRINCIPAL DE EMISSÃO */}
            <button
              type="submit"
              className="botao-acao-primario"
              disabled={carregando || vagasLotado}
            >
              {vagasLotado ? (
                '🚫 Estacionamento Lotado (Sem Vagas)'
              ) : carregando ? (
                '⏳ Emitindo Ticket de Entrada...'
              ) : (
                '🎟️ Emitir Ticket de Entrada'
              )}
            </button>
          </form>

          {/* GUIA DE APOIO RÁPIDO AO OPERADOR */}
          <div className="guia-operador">
            <h4 className="guia-operador__titulo">💡 Dicas do Operador</h4>
            <ul className="guia-operador__lista">
              <li>O valor é calculado automaticamente pela permanência.</li>
              <li>Ao sair, o comprovante fiscal pode ser impresso em 1 clique.</li>
              <li>A tolerância e os valores seguem a tabela padrão do pátio.</li>
            </ul>
          </div>
        </section>

        {/* COLUNA DIREITA: PASSO 2 - MONITORAMENTO DO PÁTIO E HISTÓRICO */}
        <section className="painel-card painel-monitoramento">
          <div className="painel-card__cabecalho">
            <span className="passo-etiqueta">PASSO 2</span>
            <div className="monitoramento-header">
              <div>
                <h2 className="painel-card__titulo">Controle do Pátio</h2>
                <p className="painel-card__descricao">
                  Acompanhe os carros estacionados em tempo real ou consulte o histórico completo.
                </p>
              </div>

              {/* CONTROLES DE ABAS */}
              <div className="abas-navegacao">
                <button
                  type="button"
                  className={`aba-item ${abaAtiva === 'patio' ? 'aba-item--ativa' : ''}`}
                  onClick={() => setAbaAtiva('patio')}
                >
                  <span>🚗 Pátio Ativo</span>
                  <span className="aba-contador">{veiculos.length}</span>
                </button>
                <button
                  type="button"
                  className={`aba-item ${abaAtiva === 'historico' ? 'aba-item--ativa' : ''}`}
                  onClick={() => setAbaAtiva('historico')}
                >
                  <span>📋 Histórico Geral</span>
                  <span className="aba-contador">{historico.length}</span>
                </button>
              </div>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="barra-pesquisa-container">
              <span className="pesquisa-icone">🔍</span>
              <input
                type="text"
                placeholder="Pesquisar veículo por placa ou modelo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pesquisa-input"
              />
              {busca && (
                <button
                  type="button"
                  className="pesquisa-limpar"
                  onClick={() => setBusca('')}
                  title="Limpar filtro"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          {/* CONTEÚDO DA ABA SELECIONADA */}
          <div className="painel-conteudo">
            {abaAtiva === 'patio' ? (
              /* ABA 1: VEÍCULOS NO PÁTIO */
              veiculosFiltrados.length === 0 ? (
                <div className="estado-vazio">
                  <div className="estado-vazio__icone">🚗</div>
                  <h3 className="estado-vazio__titulo">
                    {busca ? `Nenhum veículo encontrado para "${busca}"` : 'Nenhum veículo estacionado no momento'}
                  </h3>
                  <p className="estado-vazio__descricao">
                    {busca
                      ? 'Tente buscar por outro termo ou limpe o campo de busca.'
                      : 'O pátio está com todas as vagas disponíveis. Utilize o formulário do Passo 1 para registrar uma entrada.'}
                  </p>
                </div>
              ) : (
                <div className="grade-tickets-moderna">
                  {veiculosFiltrados.map((v) => {
                    const valorEstimado = calcularValorEstimado(v.horaEntrada, agora)
                    return (
                      <article className="ticket-card" key={v.placa}>
                        <div className="ticket-card__header">
                          <div className="ticket-card__placa-tag">
                            <span className="ticket-card__placa-texto">{v.placa}</span>
                          </div>
                          <div className="ticket-card__horario">
                            <span className="horario-label">Entrada:</span>
                            <span className="horario-valor">{formatarHora(v.horaEntrada)}</span>
                          </div>
                        </div>

                        <div className="ticket-card__corpo">
                          <div className="ticket-card__veiculo-info">
                            <span className="veiculo-icone">🚘</span>
                            <span className="ticket-card__modelo">{v.modelo}</span>
                          </div>

                          <div className="ticket-card__tempo-box">
                            <span className="tempo-label">TEMPO NO PÁTIO</span>
                            <span className="tempo-valor">⏱️ {tempoDecorrido(v.horaEntrada, agora)}</span>
                          </div>

                          <div className="ticket-card__valor-box">
                            <span className="valor-label">VALOR ACUMULADO</span>
                            <span className="valor-destaque">
                              {valorEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>

                        <div className="ticket-card__rodape">
                          <button
                            type="button"
                            className="botao-ticket-saida"
                            onClick={() => setVeiculoParaRemover(v)}
                          >
                            🚪 Registrar Saída & Cobrar
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )
            ) : (
              /* ABA 2: HISTÓRICO GERAL */
              historicoFiltrado.length === 0 ? (
                <div className="estado-vazio">
                  <div className="estado-vazio__icone">📜</div>
                  <h3 className="estado-vazio__titulo">
                    {busca ? `Nenhum histórico encontrado para "${busca}"` : 'Nenhum histórico registrado'}
                  </h3>
                  <p className="estado-vazio__descricao">
                    As movimentações de entrada e saída concluídas serão listadas aqui para consulta.
                  </p>
                </div>
              ) : (
                <div className="tabela-historico-container">
                  <table className="tabela-historico">
                    <thead>
                      <tr>
                        <th>Placa</th>
                        <th>Modelo</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoFiltrado.map((v, i) => (
                        <tr key={`${v.placa}-${v.horaEntrada}-${i}`}>
                          <td>
                            <span className="historico-placa-badge">{v.placa}</span>
                          </td>
                          <td className="historico-modelo-texto">{v.modelo}</td>
                          <td className="historico-data-texto">{formatarDataHora(v.horaEntrada)}</td>
                          <td className="historico-data-texto">
                            {v.horaSaida ? formatarDataHora(v.horaSaida) : '—'}
                          </td>
                          <td>
                            {v.horaSaida ? (
                              <span className="badge-saida-concluida">Saída Finalizada</span>
                            ) : (
                              <span className="badge-saida-ativo">No Pátio</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </section>
      </main>

      {/* ---------- MODAL DE CONFIRMAÇÃO DE SAÍDA ---------- */}
      {veiculoParaRemover && (
        <div className="modal-sobreposicao" role="dialog" aria-modal="true" aria-label="Confirmar Saída">
          <div className="modal-dialogo-confirmacao">
            <div className="modal-dialogo-confirmacao__icone">⚠️</div>
            <h3 className="modal-dialogo-confirmacao__titulo">Confirmar Saída do Veículo</h3>
            <p className="modal-dialogo-confirmacao__texto">
              Você está prestes a registrar a saída do veículo de placa:
            </p>
            <div className="confirmacao-destaque">
              <span className="confirmacao-placa">{veiculoParaRemover.placa}</span>
              <span className="confirmacao-modelo">{veiculoParaRemover.modelo}</span>
            </div>
            <p className="confirmacao-aviso">
              O tempo de permanência será encerrado e o comprovante com o valor final será emitido.
            </p>

            <div className="modal-dialogo-confirmacao__acoes">
              <button
                type="button"
                className="botao-confirmar-saida"
                onClick={() => {
                  const placaAlvo = veiculoParaRemover.placa
                  setVeiculoParaRemover(null)
                  handleRemover(placaAlvo)
                }}
              >
                ✅ Sim, Finalizar Saída
              </button>
              <button
                type="button"
                className="botao-cancelar"
                onClick={() => setVeiculoParaRemover(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL DE RECIBO / CUPOM FISCAL DE SAÍDA ---------- */}
      {recibo && <ReciboModal saida={recibo} onFechar={() => setRecibo(null)} />}
    </div>
  )
}

/* ---------- COMPONENTE DE RECIBO CUPOM FISCAL ---------- */
function ReciboModal({ saida, onFechar }: { saida: Saida; onFechar: () => void }) {
  const valorFormatado = saida.valorCobrado.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="modal-sobreposicao" role="dialog" aria-modal="true" aria-label="Comprovante de Saída">
      <div className="cupom-fiscal">
        <div className="cupom-fiscal__cabecalho">
          <span className="cupom-fiscal__logo">🅿️ PÁTIO CENTRAL</span>
          <p className="cupom-fiscal__subtitulo">COMPROVANTE DE ESTACIONAMENTO</p>
          <span className="cupom-fiscal__data">{new Date().toLocaleString('pt-BR')}</span>
        </div>

        <div className="cupom-fiscal__separador" />

        <div className="cupom-fiscal__dados">
          <div className="cupom-linha">
            <span className="cupom-chave">PLACA DO VEÍCULO:</span>
            <span className="cupom-valor cupom-valor--destaque">{saida.placa}</span>
          </div>
          <div className="cupom-linha">
            <span className="cupom-chave">ENTRADA:</span>
            <span className="cupom-valor">{formatarHora(saida.horaEntrada)}</span>
          </div>
          <div className="cupom-linha">
            <span className="cupom-chave">SAÍDA:</span>
            <span className="cupom-valor">{formatarHora(saida.horaSaida)}</span>
          </div>
          <div className="cupom-linha">
            <span className="cupom-chave">TEMPO PERMANECIDO:</span>
            <span className="cupom-valor cupom-valor--destaque">{saida.tempoPermanecido}</span>
          </div>
        </div>

        <div className="cupom-fiscal__separador" />

        <div className="cupom-fiscal__total">
          <span className="cupom-total-label">TOTAL PAGO:</span>
          <span className="cupom-total-valor">{valorFormatado}</span>
        </div>

        <div className="cupom-fiscal__separador" />

        <div className="cupom-fiscal__rodape-msg">
          <p>Obrigado pela preferência!</p>
          <p>Tenha uma excelente viagem e dirija com segurança.</p>
          <div className="cupom-codigo-barras" aria-hidden>
            ||||| | |||| ||| |||||| || |||| ||||| |||||||
          </div>
        </div>

        <div className="cupom-fiscal__acoes">
          <button type="button" className="botao-imprimir-cupom" onClick={handleImprimir}>
            🖨️ Imprimir Comprovante
          </button>
          <button type="button" className="botao-fechar-cupom" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
