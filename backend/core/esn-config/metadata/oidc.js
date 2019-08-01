const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    issuer_url: {
      type: 'string',
      format: 'uri'
    },
    client_id: {
      type: 'string',
      minLength: 1
    },
    client_secret: {
      type: 'string',
      minLength: 1
    }
  },
  required: [
    'issuer_url',
    'client_id',
    'client_secret'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
