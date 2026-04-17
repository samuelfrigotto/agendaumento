const service = require('./financeiro.service');

function parseMesAno(req) {
  const now = new Date();
  return {
    mes:  parseInt(req.query.mes)  || now.getMonth() + 1,
    ano:  parseInt(req.query.ano)  || now.getFullYear(),
  };
}

async function resumo(req, res, next) {
  try {
    const data = await service.resumo(parseMesAno(req));
    res.json(data);
  } catch (err) { next(err); }
}

async function listarServicos(req, res, next) {
  try {
    const { mes, ano } = parseMesAno(req);
    const data = await service.listarServicos({
      mes, ano,
      status: req.query.status,
      pagina: +req.query.pagina || 1,
      limite: +req.query.limite || 50,
    });
    res.json(data);
  } catch (err) { next(err); }
}

async function tendenciaMensal(req, res, next) {
  try {
    const data = await service.tendenciaMensal();
    res.json(data);
  } catch (err) { next(err); }
}

async function porServico(req, res, next) {
  try {
    const data = await service.porServico(parseMesAno(req));
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { resumo, listarServicos, tendenciaMensal, porServico };
