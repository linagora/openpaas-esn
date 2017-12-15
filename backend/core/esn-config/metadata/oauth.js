const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    facebook: {
      type: 'object',
      additionalProperties: false,
      properties: {
        client_secret: {
          type: 'string',
          minLength: 1
        },
        client_id: {
          type: 'string',
          minLength: 1
        },
        usage: {
          type: 'object',
          additionalProperties: false,
          properties: {
            account: {
              type: 'boolean'
            }
          },
          required: [
            'account'
          ]
        }
      },
      required: [
        'client_secret',
        'client_id'
      ]
    },
    google: {
      type: 'object',
      additionalProperties: false,
      properties: {
        usage: {
          type: 'object',
          additionalProperties: false,
          properties: {
            account: {
              type: 'boolean'
            }
          },
          required: [
            'account'
          ]
        },
        client_secret: {
          type: 'string',
          minLength: 1
        },
        client_id: {
          type: 'string',
          minLength: 1
        }
      },
      required: [
        'client_secret',
        'client_id'
      ]
    },
    github: {
      type: 'object',
      additionalProperties: false,
      properties: {
        client_secret: {
          type: 'string',
          minLength: 1
        },
        client_id: {
          type: 'string',
          minLength: 1
        },
        usage: {
          type: 'object',
          additionalProperties: false,
          properties: {
            account: {
              type: 'boolean'
            }
          },
          required: [
            'account'
          ]
        }
      },
      required: [
        'client_secret',
        'client_id'
      ]
    },
    twitter: {
      type: 'object',
      additionalProperties: false,
      properties: {
        consumer_secret: {
          type: 'string',
          minLength: 1
        },
        consumer_key: {
          type: 'string',
          minLength: 1
        },
        usage: {
          type: 'object',
          additionalProperties: false,
          properties: {
            account: {
              type: 'boolean'
            }
          },
          required: [
            'account'
          ]
        }
      },
      required: [
        'consumer_secret',
        'consumer_key'
      ]
    }
  }
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  pubsub: true,
  validator: createValidator(schema)
};
