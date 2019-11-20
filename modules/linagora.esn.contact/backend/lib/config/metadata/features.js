module.exports = dependencies => {
  const { createValidator } = dependencies('esn-config').validator.helper;

  const schema = {
    type: 'object',
    properties: {
      isSharingAddressbookEnabled: {
        type: 'boolean'
      },
      isDomainMembersAddressbookEnabled: {
        type: 'boolean'
      }
    }
  };

  return {
    rights: {
      padmin: 'rw',
      admin: 'rw',
      user: 'r'
    },
    pubsub: true,
    validator: createValidator(schema)
  };
};
