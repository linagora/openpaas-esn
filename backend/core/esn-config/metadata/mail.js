const { buildErrorMessage, createValidateFunction } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    mail: {
      type: 'object',
      additionalProperties: false,
      properties: {
        noreply: {
          type: 'string',
          format: 'email'
        },
        feedback: {
          type: 'string',
          format: 'email'
        }
      },
      required: [
        'noreply',
        'feedback'
      ]
    },
    transport: {
      type: 'object',
      required: [
        'config'
      ]
    }
  },
  required: [
    'mail',
    'transport'
  ]
};
const gmailSchema = {
  additionalProperties: false,
  properties: {
    config: {
      type: 'object',
      additionalProperties: false,
      properties: {
        service: {
          type: 'string',
          enum: ['gmail']
        },
        auth: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              minLength: 1
            },
            pass: {
              type: 'string',
              minLength: 1
            }
          },
          required: [
            'user',
            'pass'
          ]
        }
      },
      required: [
        'auth'
      ]
    }
  }
};
const localSchema = {
  additionalProperties: false,
  properties: {
    module: {
      type: 'string',
      minLength: 1
    },
    config: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dir: {
          type: 'string',
          minLength: 1
        },
        browser: {
          type: 'boolean'
        }
      },
      required: [
        'dir',
        'browser'
      ]
    }
  }
};
const smtpSchema = {
  additionalProperties: false,
  properties: {
    config: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          minLength: 1
        },
        secure: {
          type: 'boolean'
        },
        tls: {
          type: 'object',
          additionalProperties: false,
          properties: {
            rejectUnauthorized: {
              type: 'boolean'
            }
          },
          required: [
            'rejectUnauthorized'
          ]
        },
        port: {
          type: 'integer'
        },
        auth: {
          type: 'object',
          additionalProperties: false,
          properties: {
            user: {
              type: 'string'
            },
            pass: {
              type: 'string'
            }
          }
        }
      },
      required: [
        'host',
        'secure',
        'tls',
        'port'
      ]
    }
  }
};
const validate = createValidateFunction(schema);

module.exports = {
  validator
};

function validator(data) {
  let transportValidate;
  const valid = validate(data);

  if (!valid) {
    return buildErrorMessage(validate.errors);
  }

  transportValidate = createValidateFunction(smtpSchema);

  if (data.transport.config.service) {
    transportValidate = createValidateFunction(gmailSchema);
  }

  if (data.transport.module || data.transport.module === '') {
    transportValidate = createValidateFunction(localSchema);
  }

  if (!transportValidate(data.transport)) {
    return buildErrorMessage(transportValidate.errors);
  }

  return null;
}
