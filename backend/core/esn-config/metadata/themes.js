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
            minLength: 1
          }
        },
        required: ['key', 'value'],
        additionalProperties: false
      }
    },
    logos: {
      type: 'object',
      properties: {
        desktop: {
          type: 'string'
        },
        mobile: {
          type: 'string'
        }
      },
      required: ['desktop', 'mobile']
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
