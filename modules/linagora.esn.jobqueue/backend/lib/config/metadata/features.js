module.exports = dependencies => {
  const { createValidator } = dependencies('esn-config').validator.helper;

  const schema = {
    type: 'object',
    properties: {
      isUserInterfaceEnabled: {
        type: 'boolean'
      }
    }
  };

  return {
    default: {
      isUserInterfaceEnabled: false
    },
    rights: {
      padmin: 'rw',
      admin: 'r',
      user: 'r'
    },
    validator: createValidator(schema)
  };
};
