const Ajv = require('ajv');
const validateColor = require('is-color');

module.exports = {
  buildErrorMessage,
  createValidateFunction,
  createValidator
};

function buildErrorMessage(errors) {
  return errors.map(error =>
    (error.dataPath ? `${error.dataPath}: ${error.message}` : `${error.message}`)
  ).join('; ');
}

function createValidateFunction(schema) {
  const ajv = new Ajv({
    removeAdditional: true,
    useDefaults: true
  });

  ajv.addKeyword('color', {
    validate: function(isColor, data) {
      return isColor ? (typeof data === 'string' && validateColor(data)) : true;
    },
    errors: false
  });

  return ajv.compile(schema);
}

function createValidator(schema) {
  const validate = createValidateFunction(schema);

  return data => {
    const valid = validate(data);

    if (!valid) {
      return buildErrorMessage(validate.errors);
    }

    return null;
  };
}
