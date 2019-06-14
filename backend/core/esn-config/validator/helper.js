const Ajv = require('ajv');

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
