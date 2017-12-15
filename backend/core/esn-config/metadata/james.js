const { createValidator } = require('../validator/helper');

const schema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      format: 'uri'
    }
  },
  required: [
    'url'
  ]
};

module.exports = {
  rights: {
    padmin: 'rw'
  },
  validator: createValidator(schema)
};
