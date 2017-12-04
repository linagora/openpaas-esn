const Ajv = require('ajv');
const moment = require('moment');
const validatorHelper = require('../validator/helper');

const TIME_FORMAT = 'H:m';
const schema = {
  type: 'array',
  minItems: 1,
  maxItems: 1,
  items: {
    type: 'object',
    properties: {
      start: {
        type: 'string'
      },
      end: {
        type: 'string'
      },
      daysOfWeek: {
        type: 'array',
        uniqueItems: true,
        items: {
          type: 'integer',
          minimum: 0,
          maximum: 6
        }
      }
    },
    required: ['start', 'end', 'daysOfWeek'],
    additionalProperties: false
  }
};
const ajv = new Ajv({ removeAdditional: true });
const validate = ajv.compile(schema);

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'rw'
  },
  validator
};

function validator(businessHours) {
  const valid = validate(businessHours);

  if (!valid) {
    return validatorHelper.buildErrorMessage(validate.errors);
  }

  return validateBusinessHour(businessHours[0]);
}

function validateBusinessHour(businessHour) {
  const startObj = moment(businessHour.start, TIME_FORMAT, true);
  const endObj = moment(businessHour.end, TIME_FORMAT, true);

  if (!startObj.isValid()) {
    return `start must be in time format: ${TIME_FORMAT}`;
  }

  if (!endObj.isValid()) {
    return `end must be in time format: ${TIME_FORMAT}`;
  }

  if (!startObj.isBefore(endObj)) {
    return 'start time must be before the end time';
  }

  return null;
}
