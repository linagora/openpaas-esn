(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact').directive('contactUserVirtualShowUserProfileItem', contactUserVirtualShowUserProfileItem);

  function contactUserVirtualShowUserProfileItem() {
    return {
      replace: true,
      restrict: 'E',
      templateUrl: '/contact/app/addressbook/virtual/user/menu-items/user-virtual-show-profile-item.html'
    };
  }

})(angular);
