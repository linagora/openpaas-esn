const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    frontend: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: {
          type: 'string',
          format: 'uri'
        }
      },
      required: [
        'url'
      ]
    },
    backend: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: {
          type: 'string',
          format: 'uri'
        }
      },
      required: [
        'url'
      ]
    }
  },
  required: [
    'frontend',
    'backend'
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
