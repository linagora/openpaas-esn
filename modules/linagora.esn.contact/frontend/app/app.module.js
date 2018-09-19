(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact', [
    'esn.router',
    'restangular',
    'esn.alphalist',
    'mgcrea.ngStrap.datepicker',
    'mgcrea.ngStrap.alert',
    'uuid4',
    'mgcrea.ngStrap.helpers.dateParser',
    'mgcrea.ngStrap.helpers.dateFormatter',
    'linagora.esn.graceperiod',
    'linagora.esn.davproxy',
    'esn.search',
    'esn.scroll',
    'esn.multi-input',
    'esn.attendee',
    'esn.header',
    'esn.form.helper',
    'esn.sidebar',
    'op.dynamicDirective',
    'esn.url',
    'esn.aggregator',
    'esn.cache',
    'esn.highlight',
    'esn.provider',
    'esn.module-registry',
    'esn.datetime',
    'esn.i18n',
    'esn.user',
    'linagora.esn.dav.import',
    'esn.user-configuration'
  ]);
})(angular);
