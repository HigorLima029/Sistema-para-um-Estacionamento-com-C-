export interface Veiculo {
  placa: string
  modelo: string
  horaEntrada: string
  horaSaida: string | null
  estacionado: boolean
}

export interface Vagas {
  vagasTotais: number
  vagasDisponiveis: number
  vagasOcupadas: number
}

export interface Saida {
  placa: string
  horaEntrada: string
  horaSaida: string
  tempoPermanecido: string
  valorCobrado: number
}

export interface ErroApi {
  mensagem: string
}
