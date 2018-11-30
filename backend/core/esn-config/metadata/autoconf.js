const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    preferences: {
      type: 'array',
      minItems: 1,
      items: {
        required: [
          'value',
          'name'
        ],
        additionalProperties: false,
        properties: {
          overwrite: {
            type: 'boolean'
          },
          value: {
            type: 'boolean'
          },
          name: {
            type: 'string',
            enum: [
              'app.update.enabled',
              'extensions.update.enabled',
              'extensions.cardbook.firstOpen',
              'extensions.cardbook.exclusive',
              'extensions.cardbook.firstRun'
            ]
          }
        }
      }
    },
    addons: {
      type: 'array',
      minItems: 1,
      items: {
        required: [
          'name',
          'id'
        ],
        additionalProperties: false,
        properties: {
          versions: {
            type: 'array',
            minItems: 1,
            maxItems: 2,
            items: {
              required: [
                'version'
              ],
              additionalProperties: false,
              properties: {
                platforms: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    required: [
                      'url',
                      'platform'
                    ],
                    additionalProperties: false,
                    properties: {
                      account: {
                        type: 'boolean'
                      },
                      url: {
                        type: 'string',
                        format: 'uri'
                      },
                      platform: {
                        type: 'string',
                        minLength: 1
                      }
                    }
                  }
                },
                minAppVersion: {
                  type: 'string',
                  minLength: 1
                },
                maxAppVersion: {
                  type: 'string',
                  minLength: 1
                },
                version: {
                  type: 'string',
                  minLength: 1
                }
              }
            }
          },
          name: {
            type: 'string',
            minLength: 1
          },
          id: {
            type: 'string',
            minLength: 1
          }
        }
      }
    },
    accounts: {
      type: 'array',
      minItems: 0,
      items: {
        required: [
          'imap',
          'smtp',
          'identities'
        ],
        additionalProperties: false,
        properties: {
          imap: {
            type: 'object',
            additionalProperties: false,
            properties: {
              prettyName: {
                type: 'string',
                enum: ['OpenPaas (<%= user.preferredEmail %>)']
              },
              hostName: {
                type: 'string',
                minLength: 1
              },
              username: {
                type: 'string',
                enum: ['<%= user.preferredEmail %>']
              },
              port: {
                type: 'integer'
              },
              socketType: {
                type: 'string',
                enum: ['1', '2', '3']
              }
            },
            required: [
              'prettyName',
              'hostName',
              'username',
              'port',
              'socketType'
            ]
          },
          smtp: {
            type: 'object',
            additionalProperties: false,
            properties: {
              description: {
                type: 'string',
                enum: ['OpenPaas SMTP (<%= user.preferredEmail %>)']
              },
              hostname: {
                type: 'string',
                minLength: 1
              },
              username: {
                type: 'string',
                enum: ['<%= user.preferredEmail %>']
              },
              port: {
                type: 'integer'
              },
              socketType: {
                type: 'string',
                enum: ['1', '2', '3']
              }
            },
            required: [
              'description',
              'hostname',
              'username',
              'port',
              'socketType'
            ]
          },
          identities: {
            type: 'array',
            minItems: 1,
            items: {
              required: [
                'identityName',
                'email',
                'fullName',
                'organization',
                'autoQuote',
                'replyOnTop',
                'sigBottom',
                'sigOnForward',
                'sigOnReply',
                'attachSignature',
                'htmlSigText',
                'htmlSigFormat',
                'fccFolder',
                'draftFolder'
              ],
              additionalProperties: false,
              properties: {
                identityName: {
                  type: 'string',
                  enum: ['Default (<%= user.preferredEmail %>)']
                },
                email: {
                  type: 'string',
                  enum: ['<%= user.preferredEmail %>']
                },
                fullName: {
                  type: 'string',
                  enum: ['<%= user.firstname %> <%= user.lastname %>']
                },
                organization: {
                  type: 'string'
                },
                autoQuote: {
                  type: 'boolean'
                },
                replyOnTop: {
                  type: 'string',
                  minLength: 1
                },
                sigBottom: {
                  type: 'boolean'
                },
                sigOnForward: {
                  type: 'boolean'
                },
                sigOnReply: {
                  type: 'boolean'
                },
                attachSignature: {
                  type: 'boolean'
                },
                htmlSigText: {
                  type: 'string'
                },
                htmlSigFormat: {
                  type: 'boolean'
                },
                fccFolder: {
                  type: 'string',
                  enum: ['%serverURI%/Sent']
                },
                draftFolder: {
                  type: 'string',
                  enum: ['%serverURI%/Drafts']
                }
              }
            }
          }
        }
      }
    }
  },
  required: [
    'preferences',
    'addons',
    'accounts'
  ]
};

module.exports = {
  rights: {
    admin: 'rw'
  },
  validator: createValidator(schema)
};
