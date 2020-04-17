const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    colors: {
      type: 'array',
      minItems: 0,
      items: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            minLength: 1
          },
          value: {
            type: 'string',
            minLength: 1,
            color: true
          }
        },
        required: ['key', 'value'],
        additionalProperties: false
      }
    },
    logos: {
      type: 'object',
      properties: {
        logo: {
          type: 'string'
        },
        favicon: {
          type: 'string'
        }
      },
      required: ['logo', 'favicon'],
      additionalProperties: false
    }
  },
  required: ['colors', 'logos']
};

module.exports = {
  rights: {
    admin: 'rw'
  },
  validator: createValidator(schema)
};
