const i18n = require('i18n');

module.exports = {
  getCatalog
};

function getCatalog(req, res) {
  return res.status(200).json(i18n.getCatalog());
}
