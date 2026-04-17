const service = require('./adminAuth.service');

async function login(req, res, next) {
  try {
    const result = await service.login(req.body.email, req.body.senha);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
