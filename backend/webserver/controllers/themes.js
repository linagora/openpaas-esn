const themes = require('../../core/themes');
const logger = require('../../core/logger');
const configHelper = require('../../helpers/config');

const defaultThemesFiles = {
  logo: '/images/white-logo.svg',
  favicon: '/images/logo-tiny.png'
};

module.exports = {
  saveTheme,
  getTheme,
  getLogo,
  getFavicon
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
    .then(theme => {
      const colors = {};
      const logos = {};

      theme.colors &&
        theme.colors.forEach(color => {
          colors[color.key] = color.value;
        });

        configHelper.getBaseUrl(req.user, (err, url) => {
          if (err) {
            const msg = 'Error while getting themes';

            logger.error(msg, err);

            return res.status(500).json({
              error: {
                code: 500,
                message: 'Server Error',
                details: msg
              }
            });
          }

          theme.logos && Array.from(theme.logos).forEach(type => {
            logos[type] = `${url}/api/files/${theme.logos[type]}`;
          });

          res.status(200).send({ logos, colors });
        });
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

function getBaseUrlFiles(req, type) {
  return themes
    .getTheme(req.domain._id)
    .then(theme => getUrl(req.user)
      .then(url => {
        if (!theme.logos[type]) {
          return `${url}${defaultThemesFiles.type}`;
        }
        return `${url}/api/files/${theme.logos[type]}`;
    }));
}

function getUrl(user) {
  return new Promise((resolve, reject) => {
    configHelper.getBaseUrl(user, (err, url) => {
      if (err) {
        return reject(err);
      }
      resolve(url);
    });
  });
}

function getLogo(req, res) {
  getBaseUrlFiles(req, 'logo')
    .then(url => res.redirect(url))
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

function getFavicon(req, res) {
  getBaseUrlFiles(req, 'favicon')
    .then(url => res.redirect(url))
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
