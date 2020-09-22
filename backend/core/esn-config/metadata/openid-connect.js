const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    issuer_url: {
      type: 'string',
      format: 'uri'
    },
    clients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          // optional, will override the top level one
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
        }
      }
    }
  },
  required: [
    'clients'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
