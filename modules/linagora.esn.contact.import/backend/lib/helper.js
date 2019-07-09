const TECHNICAL_USER_TYPE = 'dav';
const TOKEN_TTL = 20000;

module.exports = dependencies => {
  const technicalUser = dependencies('technical-user');
  const userModule = dependencies('user');
  const contactModule = dependencies('contact');
  const logger = dependencies('logger');
  const UserModel = dependencies('db').mongo.mongoose.model('User');

  return {
    cleanOutdatedContacts,
    getImporterOptions,
    initializeAddressBook
  };

  function initializeAddressBook(options) {
    function getCreationToken() {
      return new Promise((resolve, reject) => {
        userModule.getNewToken(options.user, TOKEN_TTL, (err, token) => {
          if (err) {
            return reject(err);
          }

          if (!token) {
            return reject(new Error('Can not generate user token for contact addressbook creation'));
          }

          return resolve(token);
        });
      });
    }

    const { username, provider, id } = options.account.data;
    const { user } = options;
    const addressbook = {
      id: id,
      'dav:name': `${username} contacts on ${provider}`,
      'carddav:description': `AddressBook for ${username} ${provider} contacts`,
      'dav:acl': ['dav:read'],
      type: provider
    };

    options.addressbook = addressbook;

    return getCreationToken()
      .then(token => {
        const contactClient = contactModule.lib.client({
          ESNToken: token.token,
          user
        });

        return contactClient.addressbookHome(user._id)
          .addressbook(addressbook.id)
          .get()
          .catch(() => {
            logger.debug('Creating import addressbook', addressbook);

            return contactClient.addressbookHome(user._id)
              .addressbook()
              .create(addressbook);
          });
      })
      .then(() => options);
  }

  function getImporterOptions(user, account) {
    return new Promise((resolve, reject) => {
      // In case of User virtual fields are missing, for example "preferredDomainId"
      // We need to initialize it again to get technical user from preferred domain ID
      user = user instanceof UserModel ? user : new UserModel(user).toObject({ virtuals: true });

      const options = { account, user };

      technicalUser.findByTypeAndDomain(TECHNICAL_USER_TYPE, user.preferredDomainId, (err, users) => {
        if (err) {
          return reject(err);
        }

        if (!users || !users.length) {
          return reject(new Error('Can not find technical user for contact import'));
        }

        technicalUser.getNewToken(users[0], TOKEN_TTL, (err, token) => {
          if (err) {
            return reject(err);
          }

          if (!token) {
            return reject(new Error('Can not generate token for contact import'));
          }

          options.esnToken = token.token;

          return resolve(options);
        });
      });
    });
  }

  /**
   * Remove outdated contacts from addressbook. We use `lastmodified` field of
   * vcard to detect followings removed from user Twitter account.
   * Note:
   * - Sabre use `lastmodified` timestamp in seconds
   * @param  {Object} options           Contains:
   *                                      + user
   *                                      + addressbook
   *                                      + esnToken
   * @param  {Number} contactSyncTimeStamp Timestamp in miliseconds
   * @return {Promise}                   Resolve a list of removed contact IDs
   */
  function cleanOutdatedContacts(options, contactSyncTimeStamp) {
    return contactModule.lib.client({
        ESNToken: options.esnToken,
        user: options.user
      })
      .addressbookHome(options.user._id)
      .addressbook(options.addressbook.id)
      .vcard()
      .removeMultiple({
        modifiedBefore: Math.round(contactSyncTimeStamp / 1000)
      })
      .then(ids => {
        logger.info('Cleaned %d outdated contacts', ids.length);

        return ids;
      }, err => {
        logger.error('Cannot clean outdated contacts due to error:', err);

        return Promise.reject(err);
      });
  }
};
