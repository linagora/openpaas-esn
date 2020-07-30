'use strict';

const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string'
    },
    type: {
      type: 'string'
    },
    icon: {
      type: 'object',
      properties: {
        type: {
          type: 'string'
        },
        data: {
          type: 'string'
        }
      },
      required: ['type', 'data'],
      additionalProperties: false
    },
    url: {
      type: 'string'
    },
    name: {
      type: 'object',
      properties: {
        en: {
          type: 'string'
        }
      },
      required: ['en']
    },
    weight: {
      type: 'integer'
    }
  },
  required: ['id', 'type', 'icon', 'url', 'name', 'weight']
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'rw',
    user: 'r'
  },
  validator: createValidator(schema)
};
