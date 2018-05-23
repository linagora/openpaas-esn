(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .controller('contactAddressbookSettingsDelegationController', contactAddressbookSettingsDelegationController);

  function contactAddressbookSettingsDelegationController(
    $q,
    _,
    esnI18nService,
    ContactSharee,
    CONTACT_SHARING_SHARE_ACCESS,
    CONTACT_SHARING_SHARE_ACCESS_CHOICES
  ) {
    var self = this;

    self.$onInit = $onInit;
    self.onAddingUser = onAddingUser;
    self.onAddBtnClick = onAddBtnClick;
    self.onRemoveShareeClick = onRemoveShareeClick;
    self.hasVisibleSharee = hasVisibleSharee;
    self.isVisibbleSharee = isVisibbleSharee;

    function $onInit() {
      self.newUsers = [];
      self.CONTACT_SHARING_SHARE_ACCESS_CHOICES = CONTACT_SHARING_SHARE_ACCESS_CHOICES;
      self.selectedAccess = CONTACT_SHARING_SHARE_ACCESS.READ;

      _processSharees(self.sharees);
    }

    function onAddingUser($tags) {
      return !self.sharees.some(function(sharee) {
          return isVisibbleSharee(sharee) && $tags._id === sharee.userId;
        });
    }

    function onAddBtnClick() {
      self.newUsers.forEach(function(user) {
        _.remove(self.sharees, { userId: user._id });
        self.sharees.unshift(ContactSharee.fromUser(user, self.selectedAccess));
      });

      _resetForm();
    }

    function onRemoveShareeClick(sharee) {
      sharee.access = CONTACT_SHARING_SHARE_ACCESS.NOACCESS;
    }

    function hasVisibleSharee() {
      return self.sharees.some(isVisibbleSharee);
    }

    function isVisibbleSharee(sharee) {
      return [CONTACT_SHARING_SHARE_ACCESS.READ, CONTACT_SHARING_SHARE_ACCESS.READWRITE].indexOf(sharee.access) > -1;
    }

    function _processSharees(sharees) {
      self.status = 'loading';

      // to load user information of all sharees
      $q.all(sharees.map(function(sharee) {
        return sharee.getUser();
      }))
      .then(function() {
        self.status = 'loaded';
      })
      .catch(function() {
        self.status = 'error';
      });
    }

    function _resetForm() {
      self.newUsers = [];
      self.selectedAccess = CONTACT_SHARING_SHARE_ACCESS.READ;
    }
  }
})(angular);