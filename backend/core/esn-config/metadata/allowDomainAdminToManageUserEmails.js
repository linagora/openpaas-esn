const { createValidator } = require('../validator/helper');

const schema = {
  type: 'boolean'
};

module.exports = {
  rights: {
    padmin: 'rw',
    admin: 'r'
  },
  validator: createValidator(schema)
};
