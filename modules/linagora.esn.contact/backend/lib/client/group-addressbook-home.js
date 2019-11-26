const Q = require('q');
const davClient = require('../dav-client').rawClient;
const { parsePrincipal } = require('../helper');

module.exports = dependencies => {
  return {
    getGroupAddressbookHomes
  };

  function getGroupAddressbookHomes(user, options) {
    const { davServerUrl, ESNToken } = options;
    const { getDavEndpoint, checkResponse } = require('./utils')(dependencies, { davServerUrl });

    return getDavEndpoint(user)
      .then(davEndpoint => `${davEndpoint}/principals/users/${user._id}`)
      .then(url => {
        const deferred = Q.defer();
        const method = 'PROPFIND';

        davClient({
          method,
          headers: {
            ESNToken,
            accept: 'application/json'
          },
          url,
          json: true
        }, checkResponse(deferred, method, 'Error while getting user principals'));

        return deferred.promise;
      })
      .then(({ body }) => {
        const groupMembership = body['group-membership'];

        if (!Array.isArray(groupMembership) || !groupMembership.length) return [];

        return groupMembership.map(groupPrincipal => {
          const parsedPrincipal = parsePrincipal(groupPrincipal);

          return parsedPrincipal && parsedPrincipal.id;
        }).filter(Boolean);
      });
  }
};
