const VALID_HTTP_STATUS = {
  GET: [200],
  PUT: [200, 201, 204],
  POST: [200, 201],
  DELETE: [204],
  PROPFIND: [200],
  PROPPATCH: [204]
};

let davServerUrl;

module.exports = (dependencies, options = {}) => {
  const davServerUtils = dependencies('davserver').utils;
  const logger = dependencies('logger');

  davServerUrl = davServerUrl || options.davServerUrl;

  return {
    checkResponse,
    getDavEndpoint
  };

  function getDavEndpoint(user) {
    return new Promise(resolve => {
      if (davServerUrl) {
        return resolve(davServerUrl);
      }

      return davServerUtils.getDavEndpoint(user, davEndpoint => {
          davServerUrl = davEndpoint; // cache to be reused

          return resolve(davEndpoint);
      });
    });
  }

  function checkResponse(deferred, method, errMsg) {
    const status = VALID_HTTP_STATUS[method];

    return (err, response, body) => {
      if (err) {
        logger.error(errMsg, err);

        return deferred.reject(err);
      }

      if (status && status.indexOf(response.statusCode) < 0) {
        logger.error('Bad HTTP status', response.statusCode, body);

        return deferred.reject({ response, body });
      }

      return deferred.resolve({ response, body });
    };
  }
};

