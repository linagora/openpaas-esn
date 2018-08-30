const { createValidator } = require('../validator/helper');

const schema = {
  type: 'array',
  minItems: 0,
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1
      },
      enabled: {
        type: 'boolean'
      }
    },
    required: ['id'],
    additionalProperties: false
  }
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'r'
  },
  validator: createValidator(schema)
};
