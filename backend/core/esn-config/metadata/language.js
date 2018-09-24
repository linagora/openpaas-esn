const { buildErrorMessage, createValidateFunction } = require('../validator/helper');
const i18n = require('../../../core/i18n');
const validate = createValidateFunction({
  type: 'string'
});

module.exports = {
  rights: {
    admin: 'rw',
    user: 'rw'
  },
  validator,
  default: 'en'
};

function validator(language) {
  const valid = validate(language);

  if (!valid) {
    return buildErrorMessage(validate.errors);
  }

  const supportedLanguages = i18n.getLocales();

  if (supportedLanguages.indexOf(language) === -1) {
    return `'${language}' is not a supported language`;
  }

  return null;
}
