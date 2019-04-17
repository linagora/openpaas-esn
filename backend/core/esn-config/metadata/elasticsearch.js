const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    host: {
      type: 'string',
      format: 'uri'
    }
  },
  required: [
    'host'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
