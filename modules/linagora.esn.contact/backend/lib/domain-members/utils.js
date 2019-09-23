module.exports = dependencies => {
  const coreTechnicalUser = dependencies('technical-user');

  const TECHNICAL_USER_TYPE = 'dav';
  const TOKEN_TTL = 20000;

  return {
    getTechnicalUser,
    getTechnicalToken
  };

  function getTechnicalUser(domainId) {
    return new Promise((resolve, reject) => {
      coreTechnicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, domainId, (err, technicalUsers) => {
        if (err) return reject(err);

        return resolve(technicalUsers && technicalUsers[0]);
      });
    });
  }

  function getTechnicalToken(technicalUser) {
    return new Promise((resolve, reject) => {
      coreTechnicalUser.getNewToken(technicalUser, TOKEN_TTL, (err, data) => {
        if (err) return reject(err);

        if (!data) {
          return reject(new Error('Can not generate technical token'));
        }

        return resolve(data.token);
      });
    });
  }
};
