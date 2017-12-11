const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  properties: {
    base_url: {
      type: 'string',
      format: 'uri'
    }
  },
  required: [
    'base_url'
  ]
};

module.exports = {
  validator: createValidator(schema)
};
