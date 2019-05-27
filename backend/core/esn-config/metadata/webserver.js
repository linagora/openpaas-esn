const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  properties: {
    proxy: {
      type: 'object',
      additionalProperties: false,
      properties: {
        trust: {
          type: 'boolean'
        }
      }
    },
    maxAge: {
      type: 'string'
    }
  },
  required: [
    'proxy'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  pubsub: true,
  validator: createValidator(schema)
};
