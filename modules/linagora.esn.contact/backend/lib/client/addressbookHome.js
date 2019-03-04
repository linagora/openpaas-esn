module.exports = (dependencies, options) => {
  const {
    ESNToken,
    user,
    davServerUrl
  } = options;

  return addressbookHome => {
    const addressbook = require('./addressbook')(dependencies, {
      ESNToken,
      addressbookHome,
      user,
      davServerUrl
    });

    return {
      addressbook
    };
  };
};
