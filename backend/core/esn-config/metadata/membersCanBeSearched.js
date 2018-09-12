const { createValidator } = require('../validator/helper');

const schema = {
  type: 'boolean'
};

module.exports = {
  rights: {
    admin: 'rw',
    user: 'r'
  },
  validator: createValidator(schema)
};
