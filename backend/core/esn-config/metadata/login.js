const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    failure: {
      type: 'object',
      additionalProperties: false,
      properties: {
        size: {
          type: 'integer',
          minimum: 1
        }
      },
      required: [
        'size'
      ]
    },
    resetpassword: {
      type: 'boolean'
    }
  },
  required: [
    'failure',
    'resetpassword'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
