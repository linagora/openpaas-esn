const { createValidator } = require('../validator/helper');

const schema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: [
      'configuration',
      'usage',
      'name'
    ],
    properties: {
      configuration: {
        type: 'object',
        additionalProperties: false,
        properties: {
          mapping: {
            type: 'object',
            additionalProperties: false,
            properties: {
              firstname: {
                type: 'string',
                minLength: 1
              },
              lastname: {
                type: 'string',
                minLength: 1
              },
              email: {
                type: 'string',
                minLength: 1
              },
              description: {
                type: 'string',
                minLength: 1
              },
              main_phone: {
                type: 'string',
                minLength: 1
              },
              office_location: {
                type: 'string',
                minLength: 1
              },
              building_location: {
                type: 'string',
                minLength: 1
              },
              service: {
                type: 'string',
                minLength: 1
              },
              job_title: {
                type: 'string',
                minLength: 1
              }
            }
          },
          url: {
            type: 'string',
            minLength: 1
          },
          searchBase: {
            type: 'string',
            minLength: 1
          },
          searchFilter: {
            type: 'string',
            minLength: 1
          },
          adminDn: {
            type: 'string'
          },
          adminPassword: {
            type: 'string'
          }
        },
        required: [
          'mapping',
          'url',
          'searchBase',
          'searchFilter'
        ]
      },
      usage: {
        type: 'object',
        additionalProperties: false,
        properties: {
          auth: {
            type: 'boolean'
          },
          search: {
            type: 'boolean'
          }
        },
        required: [
          'auth',
          'search'
        ]
      },
      name: {
        type: 'string',
        minLength: 1
      }
    }
  }
};

module.exports = {
  rights: {
    admin: 'rw'
  },
  validator: createValidator(schema)
};
