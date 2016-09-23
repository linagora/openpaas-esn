(function() {
  'use strict';

  angular.module('esn.calendar')
         .directive('calendarColorPickerToggler', calendarColorPickerToggler);

  function calendarColorPickerToggler() {
    var directive = {
      restrict: 'A',
      scope: {
        color: '='
      },
      link: link,
      controller: CalendarColorPickerTogglerController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    ////////////

    function link(scope, element, attrs, vm) { // eslint-disable-line
      element.bind('click', function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        vm.openModal();
      });
    }
  }

  CalendarColorPickerTogglerController.$inject = [
    '$modal',
    'CALENDAR_LIST_OF_COLORS'
  ];

  function CalendarColorPickerTogglerController($modal, CALENDAR_LIST_OF_COLORS) {
    var vm = this;

    vm.CALENDAR_LIST_OF_COLORS = CALENDAR_LIST_OF_COLORS;
    vm.colorKeys = Object.keys(CALENDAR_LIST_OF_COLORS);
    vm.set = set;
    vm.select = select;
    vm.isSelected = isSelected;
    vm.openModal = openModal;

    ////////////

    function set() {
      if (vm.selected) {
        vm.color = vm.CALENDAR_LIST_OF_COLORS[vm.selected];
      }
    }

    function select(color) {
      vm.selected = color;
    }

    function isSelected(color) {
      return vm.selected === color;
    }

    function openModal() {
      var colorHex = vm.color.toUpperCase();

      vm.selected = undefined;
      angular.forEach(CALENDAR_LIST_OF_COLORS, function(value, key) {
        if (colorHex === value) {
          vm.selected = key;
        }
      });

      $modal({
        templateUrl: '/calendar/app/components/calendar-color-picker/calendar-color-picker.html',
        controller: function($scope) {
          angular.extend($scope, vm);
        },
        backdrop: 'static',
        placement: 'center'
      });
    }
  }

  angular.module('esn.calendar')
    .constant('CALENDAR_LIST_OF_COLORS', {
      red: '#F44336',
      pink: '#E91E63',
      purple: '#9C27B0',
      indigo: '#3F51B5',
      blue: '#2196F3',
      teal: '#009688',
      green: '#4CAF50',
      amber: '#FFC107',
      orange: '#FF9800',
      brown: '#795548'
    });

})();
