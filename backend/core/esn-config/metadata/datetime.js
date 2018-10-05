const { buildErrorMessage, createValidateFunction } = require('../validator/helper');
const { isSupportedTimeZone } = require('../../../helpers/datetime');

const schema = {
  type: 'object',
  properties: {
    use24hourFormat: {
      type: 'boolean'
    },
    timeZone: {
      type: 'string'
    }
  },
  required: ['use24hourFormat'],
  additionalProperties: false
};
const validate = createValidateFunction(schema);

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'rw'
  },
  validator,
  default: {
    timeZone: 'GMT'
  }
};

function validator(datetime) {
  const valid = validate(datetime);

  if (!valid) {
    return buildErrorMessage(validate.errors);
  }

  return _validateDatetime(datetime);
}

function _validateDatetime(datetime) {
  if (datetime.timeZone && !isSupportedTimeZone(datetime.timeZone)) {
    return `time zone "${datetime.timeZone}" is not supported`;
  }

  return null;
}
