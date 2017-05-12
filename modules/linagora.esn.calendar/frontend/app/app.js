(function() {
  'use strict';

  angular.module('esn.calendar', [
    'uuid4',
    'ng.deviceDetector',
    'naturalSort',
    'ngTouch',
    'restangular',
    'mgcrea.ngStrap.datepicker',
    'mgcrea.ngStrap.aside',
    'mgcrea.ngStrap.modal',
    'materialAdmin',
    'AngularJstz',
    'angularMoment',
    'esn.media.query',
    'linagora.esn.graceperiod',
    'op.dynamicDirective',
    'esn.router',
    'esn.core',
    'esn.header',
    'esn.authentication',
    'esn.form.helper',
    'esn.ical',
    'esn.calMoment',
    'esn.community',
    'esn.notification',
    'esn.widget.helper',
    'esn.lodash-wrapper',
    'esn.aggregator',
    'esn.provider',
    'esn.search',
    'esn.highlight',
    'esn.module-registry',
    'esn.configuration'
  ]);
})();
