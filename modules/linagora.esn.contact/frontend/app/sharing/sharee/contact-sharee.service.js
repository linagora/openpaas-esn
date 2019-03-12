(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactSharee', ContactShareeFactory);

  function ContactShareeFactory(
    $q,
    userAPI,
    userUtils,
    contactAddressbookParser,
    CONTACT_SHARING_INVITE_STATUS
  ) {
    function ContactSharee(jsonData) {
      if (!jsonData.href) {
        throw new Error('href cannot be null');
      }

      if (!angular.isDefined(jsonData.access)) { // access can be zero
        throw new Error('access cannot be null');
      }

      if (!jsonData.inviteStatus) {
        throw new Error('inviteStatus cannot be null');
      }

      if (!jsonData.userId) {
        throw new Error('userId cannot be null');
      }

      this.href = jsonData.href;
      this.access = jsonData.access;
      this.inviteStatus = jsonData.inviteStatus;
      this.userId = jsonData.userId;

      // optional
      this.user = jsonData.user;
    }

    ContactSharee.prototype.getUser = function() {
      var self = this;

      if (self.user) {
        return $q.when(self.user);
      }

      return userAPI.user(self.userId)
        .then(function(response) {
          self.user = {
            id: self.userId,
            displayName: userUtils.displayNameOf(response.data),
            email: response.data.preferredEmail
          };

          return self.user;
        });
    };

    ContactSharee.fromSharee = function(shareeInfo) {
      return new ContactSharee({
        href: shareeInfo.href,
        access: shareeInfo.access,
        inviteStatus: shareeInfo.inviteStatus,
        userId: contactAddressbookParser.parsePrincipalPath(shareeInfo.principal).id
      });
    };

    ContactSharee.fromUser = function(user, access) {
      var userEmail = user.preferredEmail || user.email;

      return new ContactSharee({
        href: 'mailto:' + userEmail,
        access: access,
        inviteStatus: CONTACT_SHARING_INVITE_STATUS.NORESPONSE,
        userId: user._id,
        user: {
          id: user._id,
          displayName: userUtils.displayNameOf(user),
          email: userEmail
        }
      });
    };

    return ContactSharee;
  }
})(angular);
