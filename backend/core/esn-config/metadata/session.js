const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  properties: {
    secret: {
      type: 'string',
      minLength: 1
    },
    cookie: {
      type: 'object',
      properties: {
        maxAge: {
          type: 'integer'
        }
      },
      additionalProperties: false,
      required: [
        'maxAge'
      ]
    }
  },
  additionalProperties: false,
  required: [
    'secret',
    'cookie'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  pubsub: true,
  validator: createValidator(schema)
};
