module.exports = dependencies => {
  const client = require('../client')(dependencies);
  const { token } = dependencies('auth');

  return ({ term, context, pagination, excludes }) => {
    const userId = String(context.user._id);
    const options = {
      user: context.user,
      search: term,
      limit: pagination.limit,
      bookNames: [],
      excludeIds: excludes.map(tuple => tuple.id).filter(Boolean)
    };

    return getClientOptions(context)
      .then(clientOptions => client(clientOptions).addressbookHome(userId).search(options))
      .then(result => result.results);
  };

  function getClientOptions({ user }) {
    return new Promise((resolve, reject) => {
      token.getNewToken({ user: user._id }, (err, token) => {
        if (err) {
          return reject(err);
        }

        resolve({ ESNToken: token.token });
      });
    });
  }
};
