const themes = require('../../core/themes');
const logger = require('../../core/logger');

module.exports = {
  saveTheme,
  getTheme
};

function saveTheme(req, res) {
  const theme = req.body;

  themes
    .saveTheme(req.domain._id, theme)
    .then(() => res.status(200).send())
    .catch(err => {
      const msg = 'Error while saving themes';

      logger.error(msg, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
}

function getTheme(req, res) {
  themes
    .getTheme(req.domain._id)
    .then(config => {
      const colors = {};

      config.colors &&
        config.colors.forEach(color => {
          colors[color.key] = color.value;
        });
      res.status(200).send({ logos: config.logos, colors });
    })
    .catch(err => {
      const msg = 'Error while getting themes';

      logger.error(msg, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details: msg
        }
      });
    });
}
