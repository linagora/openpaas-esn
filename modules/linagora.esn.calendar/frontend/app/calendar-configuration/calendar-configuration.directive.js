(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarConfiguration', calendarConfiguration);

  function calendarConfiguration() {
    var directive = {
      restrict: 'E',
      templateUrl: '/calendar/app/calendar-configuration/calendar-configuration.html',
      scope: {
        calendar: '=?',
        calendarHomeId: '='
      },
      replace: true,
      controller: CalendarConfigurationController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;
  }

  CalendarConfigurationController.$inject = [
    '$log',
    '$modal',
    '$scope',
    '$state',
    'screenSize',
    'uuid4',
    'CalendarCollectionShell',
    'calendarService',
    'notificationFactory',
    'CALENDAR_MODIFY_COMPARE_KEYS'
  ];

  function CalendarConfigurationController($log, $modal, $scope, $state, screenSize, uuid4, CalendarCollectionShell, calendarService, notificationFactory, CALENDAR_MODIFY_COMPARE_KEYS) {
    var vm = this;

    vm.newCalendar = !vm.calendar;
    vm.calendar = vm.calendar || {};
    vm.oldCalendar = {};
    vm.selectedTab = 'main';
    vm.submit = submit;
    vm.openDeleteConfirmationDialog = openDeleteConfirmationDialog;
    vm.delete = deleteCalendar;
    vm.cancel = cancel;
    vm.cancelMobile = cancelMobile;
    vm.getMainView = getMainView;
    vm.getDelegationView = getDelegationView;

    activate();

    ////////////

    function activate() {
      angular.copy(vm.calendar, vm.oldCalendar);
      if (vm.newCalendar) {
        vm.calendar.href = CalendarCollectionShell.buildHref(vm.calendarHomeId, uuid4.generate());
        vm.calendar.color = '#' + Math.random().toString(16).substr(-6);
      }
    }

    function _canSaveCalendar() {
      return !!vm.calendar.name && vm.calendar.name.length >= 1;
    }

    function _hasModifications(oldCalendar, newCalendar) {
      return CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    function submit() {
      if (!_canSaveCalendar()) {
        return;
      }

      var shell = CalendarCollectionShell.from(vm.calendar);

      if (vm.newCalendar) {
        calendarService.createCalendar(vm.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', vm.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        if (!_hasModifications(vm.oldCalendar, vm.calendar)) {
          if (screenSize.is('xs, sm')) {
            $state.go('calendar.list');
          } else {
            $state.go('calendar.main');
          }

          return;
        }
        calendarService.modifyCalendar(vm.calendarHomeId, shell)
          .then(function() {
            notificationFactory.weakInfo('Calendar - ', vm.calendar.name + ' has been modified.');
            $state.go('calendar.main');
          });
      }
    }

    function openDeleteConfirmationDialog() {
      vm.modal = $modal({
        templateUrl: '/calendar/app/calendar-configuration/calendar-configuration-delete-confirmation.html',
        controller: function($scope) {
          $scope.delete = function deleteCalendar() {
            $log.debug('Delete calendar not implemented yet');
          };
        },
        backdrop: 'static',
        placement: 'center'
      });
    }

    function deleteCalendar() {
      $log.debug('Delete calendar not implemented yet');
    }

    function cancel() {
      $state.go('calendar.main');
    }

    function cancelMobile() {
      $state.go('calendar.list');
    }

    function getMainView() {
      vm.selectedTab = 'main';
    }

    function getDelegationView() {
      vm.selectedTab = 'delegation';
    }
  }

})();
