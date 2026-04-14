const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const HORARIO_INICIO = 8; // 08:00
const HORARIO_FIM = 20; // 20:00
const INTERVALO_MIN = 30; // Slots a cada 30 minutos

// ID do banhista de demonstracao
const getDemoBanhistaId = async () => {
  if (process.env.DEMO_BANHISTA_ID) {
    return process.env.DEMO_BANHISTA_ID;
  }
  const result = await query('SELECT id FROM banhistas WHERE ativo = true LIMIT 1');
  if (result.rows.length === 0) {
    throw new AppError('Nenhum estabelecimento disponivel', 500);
  }
  return result.rows[0].id;
};

const listarServicos = async () => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante
     FROM servicos
     WHERE banhista_id = $1 AND ativo = true
     ORDER BY nome ASC`,
    [banhistaId]
  );

  return result.rows.map(row => ({
    id: row.id,
    nome: row.nome,
    duracaoMin: row.duracao_min,
    precoPequeno: parseFloat(row.preco_pequeno) || 0,
    precoMedio: parseFloat(row.preco_medio) || 0,
    precoGrande: parseFloat(row.preco_grande) || 0,
    precoGigante: parseFloat(row.preco_gigante) || 0
  }));
};

const obterServico = async (servicoId) => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT id, nome, duracao_min, preco_pequeno, preco_medio, preco_grande, preco_gigante
     FROM servicos
     WHERE id = $1 AND banhista_id = $2 AND ativo = true`,
    [servicoId, banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const row = result.rows[0];
  return {
    id: row.id,
    nome: row.nome,
    duracaoMin: row.duracao_min,
    precoPequeno: parseFloat(row.preco_pequeno) || 0,
    precoMedio: parseFloat(row.preco_medio) || 0,
    precoGrande: parseFloat(row.preco_grande) || 0,
    precoGigante: parseFloat(row.preco_gigante) || 0
  };
};

const calcularDisponibilidade = async (data, servicoId) => {
  const banhistaId = await getDemoBanhistaId();

  // Buscar duracao do servico
  const servicoResult = await query(
    'SELECT duracao_min FROM servicos WHERE id = $1 AND banhista_id = $2 AND ativo = true',
    [servicoId, banhistaId]
  );

  if (servicoResult.rows.length === 0) {
    throw new AppError('Servico nao encontrado', 404);
  }

  const duracaoServico = servicoResult.rows[0].duracao_min;

  // Buscar agendamentos do dia (exceto cancelados)
  const dataInicio = new Date(data);
  dataInicio.setHours(0, 0, 0, 0);

  const dataFim = new Date(data);
  dataFim.setHours(23, 59, 59, 999);

  const agendamentosResult = await query(
    `SELECT data_hora, duracao_min
     FROM agendamentos
     WHERE banhista_id = $1
       AND data_hora >= $2
       AND data_hora <= $3
       AND status != 'cancelado'
     ORDER BY data_hora ASC`,
    [banhistaId, dataInicio.toISOString(), dataFim.toISOString()]
  );

  const agendamentos = agendamentosResult.rows;

  // Gerar slots disponiveis
  const slots = [];
  const dataBase = new Date(data);

  for (let hora = HORARIO_INICIO; hora < HORARIO_FIM; hora++) {
    for (let min = 0; min < 60; min += INTERVALO_MIN) {
      const slotInicio = new Date(dataBase);
      slotInicio.setHours(hora, min, 0, 0);

      const slotFim = new Date(slotInicio);
      slotFim.setMinutes(slotFim.getMinutes() + duracaoServico);

      // Verificar se slot termina antes do horario de fechamento
      if (slotFim.getHours() > HORARIO_FIM || (slotFim.getHours() === HORARIO_FIM && slotFim.getMinutes() > 0)) {
        continue;
      }

      // Verificar conflitos com agendamentos existentes
      const temConflito = agendamentos.some(a => {
        const agendInicio = new Date(a.data_hora);
        const agendFim = new Date(agendInicio);
        agendFim.setMinutes(agendFim.getMinutes() + a.duracao_min);

        // Conflito existe se os intervalos se sobrepoem
        return slotInicio < agendFim && slotFim > agendInicio;
      });

      if (!temConflito) {
        const horaFormatada = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push({
          hora: horaFormatada,
          dataHora: slotInicio.toISOString()
        });
      }
    }
  }

  return {
    data: data,
    servicoId: servicoId,
    duracaoMin: duracaoServico,
    slots: slots
  };
};

const obterInfoEstabelecimento = async () => {
  const banhistaId = await getDemoBanhistaId();

  const result = await query(
    `SELECT nome_negocio, telefone
     FROM banhistas
     WHERE id = $1`,
    [banhistaId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Estabelecimento nao encontrado', 404);
  }

  return {
    nome: result.rows[0].nome_negocio || 'Agendaumento',
    telefone: result.rows[0].telefone
  };
};

module.exports = {
  listarServicos,
  obterServico,
  calcularDisponibilidade,
  obterInfoEstabelecimento
};
