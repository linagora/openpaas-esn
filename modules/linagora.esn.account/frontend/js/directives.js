'use strict';

angular.module('linagora.esn.account')
  .directive('controlcenterMenuAccount', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.accounts', 'mdi-database', 'Accounts')
    };
  })
  .directive('fabAccountDropup', function() {
    return {
      restrict: 'E',
      templateUrl: '/account/views/partials/fab.html',
      link: function($scope, $element) {

        function getModal() {
          return angular.element($element[0].querySelector('.modal-accounts-list'));
        }

        $scope.hide = function() {
          var e = getModal();
          if (!e) {
            return;
          }

          if (e.hasClass('active')) {
            e.removeClass('active');
          }
        };

        $scope.onClick = function() {
          var e = getModal();
          if (!e) {
            return;
          }

          if (e.hasClass('active')) {
            e.removeClass('active');
          } else {
            e.addClass('active');
          }
        };
      }
    };
  })
  .directive('accountDisplayer', function() {
    return {
      restrict: 'E',
      templateUrl: '/account/views/partials/account-displayer.html',
      scope: {
        account: '='
      }
    };
  })

  .directive('accountMenuItem', function(oauthStrategyRegistry) {
    function link(scope, elem, attr) {
      scope.openAccount = oauthStrategyRegistry.get(attr.type);
    }
    return {
      replace: true,
      restrict: 'E',
      scope: {},
      templateUrl: function(elem, attr) {
        return '/account/views/providers/' + attr.type + '/add-account-item.html';
      },
      link: link
    };
  })

  .directive('socialAccount', function() {
    return {
      replace: true,
      restrict: 'E',
      scope: {
        account: '='
      },
      templateUrl: function(elem, attr) {
        return '/account/views/providers/' + attr.type + '/account.html';
      },
      controller: 'socialAccountController'
    };
  });
