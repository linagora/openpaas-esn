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
  const msg = 'Error while saving themes';

  themes
    .saveTheme(req.domain._id, theme)
    .then(() => res.status(200).send())
    .catch(catchError(res, msg));
}

function getTheme(req, res) {
  const msg = 'Error while getting themes';

  themes
    .getTheme(req.domain._id)
    .then(theme => {
      const colors = {};
      const logos = {};

      theme.colors &&
        theme.colors.forEach(color => {
          colors[color.key] = color.value;
        });

      theme.logos && Object.keys(theme.logos).forEach(function(key) {
        logos[key] = theme.logos[key];
      });

      res.status(200).send({ logos, colors });
    })
    .catch(catchError(res, msg));
}

function getLogo(req, res) {
  const msg = 'Error while the logo resource';

  getLogosPathname(req, 'logo')
    .then(url => res.redirect(url))
    .catch(catchError(res, msg));
}

function getFavicon(req, res) {
  const msg = 'Error while favicon resource';

  getLogosPathname(req, 'favicon')
    .then(url => res.redirect(url))
    .catch(catchError(res, msg));
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

function getLogosPathname(req, type) {
  const promises = [themes.getTheme(req.domain._id), getUrl(req.user)];

  return Promise.all(promises).then(result => {
    const theme = result[0];
    const url = result[1];

    if (Object.keys(theme).length === 0 || !theme.logos || !theme.logos[type]) {
      return `${url}${defaultThemesFiles[type]}`;
    }

    return `${url}/api/files/${theme.logos[type]}`;
  });
}

function catchError(res, message) {
  return err => {
    logger.error(message, err);

    res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details: message
      }
    });
  };
}
