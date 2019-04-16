const logger = require('../../core/logger');
const { generate } = require('../../core/themes/css');

module.exports = {
  getCss
};

function getCss(req, res) {
  if (!req.params || !req.params.app) {
    return res.status(404).json({ error: { status: 404, message: 'Not Found', details: 'No app defined'}});
  }

  const domainId = req.user && req.user.domains && req.user.domains.length && req.user.domains[0].domain_id;

  generate(req.params.app, domainId)
    .then(generated => {
      res.set('Content-Type', 'text/css');
      res.send(generated.css);
    })
    .catch(err => {
      logger.error('Less compilation failed', err);

      return res.status(500).json({
        error: {
          status: 500,
          message: 'Server Error',
          details: 'Less compilation failed'
        }
      });
    });
}
