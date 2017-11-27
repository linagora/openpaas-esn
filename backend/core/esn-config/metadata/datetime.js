const Ajv = require('ajv');
const validatorHelper = require('../validator/helper');

const schema = {
  type: 'object',
  properties: {
    dateFormat: {
      type: 'string',
      maxLength: 225
    },
    timeFormat: {
      type: 'string',
      maxLength: 225
    },
    use24hourFormat: {
      type: 'boolean'
    }
  },
  required: ['dateFormat', 'timeFormat', 'use24hourFormat'],
  additionalProperties: false
};
const ajv = new Ajv();
const validate = ajv.compile(schema);

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'rw'
  },
  validator
};

function validator(data) {
  const valid = validate(data);

  if (!valid) {
    return validatorHelper.buildErrorMessage(validate.errors);
  }

  return null;
}
