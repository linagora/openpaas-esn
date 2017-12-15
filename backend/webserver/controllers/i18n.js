const i18n = require('@linagora/i18n-node');

module.exports = {
  getCatalog
};

function getCatalog(req, res) {
  return res.status(200).json(i18n.getCatalog());
}
