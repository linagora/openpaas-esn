const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    algorithm: {
      type: 'string',
      minLength: 1
    },
    publicKey: {
      type: 'string',
      minLength: 1
    },
    privateKey: {
      type: 'string',
      minLength: 1
    }
  },
  required: [
    'algorithm',
    'publicKey',
    'privateKey'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
