(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSettingsMainController', contactAddressbookSettingsMainController);

  function contactAddressbookSettingsMainController(
    _,
    CONTACT_ADDRESSBOOK_PUBLIC_RIGHT,
    CONTACT_SHARING_SHARE_ACCESS,
    CONTACT_SHARING_SUBSCRIPTION_TYPE
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.canUpdatePublicRight = canUpdatePublicRight;

    function $onInit() {
      self.publicRights = Object.keys(CONTACT_ADDRESSBOOK_PUBLIC_RIGHT).map(function(right) {
        return {
          value: CONTACT_ADDRESSBOOK_PUBLIC_RIGHT[right].value,
          title: CONTACT_ADDRESSBOOK_PUBLIC_RIGHT[right].longLabel
        };
      });

      _initShareOwner();
    }

    function canUpdatePublicRight() {
      return !self.addressbook.isSubscription;
    }

    function _initShareOwner() {
      if (self.addressbook.subscriptionType !== CONTACT_SHARING_SUBSCRIPTION_TYPE.delegation) {
        return;
      }

      _getShareOwner(self.addressbook.source.sharees)
        .getUser()
        .then(function(user) {
          self.shareOwner = user;
        });
    }

    function _getShareOwner(sharees) {
      return _.find(sharees, { access: CONTACT_SHARING_SHARE_ACCESS.SHAREDOWNER });
    }
  }
})(angular);
