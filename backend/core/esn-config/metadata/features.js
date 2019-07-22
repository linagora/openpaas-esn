const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    'control-center:password': {
      type: 'boolean'
    },
    'header:user-notification': {
      type: 'boolean'
    },
    'header:fullscreen': {
      type: 'boolean'
    }
  },
  required: [
    'control-center:password',
    'header:user-notification',
    'header:fullscreen'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'r'
  },
  validator: createValidator(schema)
};
