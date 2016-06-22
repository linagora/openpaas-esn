'use strict';

angular.module('esn.timeline', [
  'op.dynamicDirective',
  'linagora.esn.controlcenter',
  'esn.http',
  'esn.infinite-list',
  'openpaas-logo'])

  .constant('DEFAULT_TIMELINE_ELEMENT', '/views/modules/timeline/default-timeline-element.html')

  .config(function(dynamicDirectiveServiceProvider) {
    var timelineControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(
      true, 'controlcenter-menu-timeline', { priority: -1 });
    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', timelineControlCenterMenu);
  })

  .directive('controlcenterMenuTimeline', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.timeline', 'mdi-timelapse', 'Timeline')
    };
  })

  .factory('esnTimelineAPI', function(esnRestangular) {

    function getUserTimelineEntries(options) {
      return esnRestangular.all('timelineentries').getList(options);
    }

    return {
      getUserTimelineEntries: getUserTimelineEntries
    };
  })

  .directive('esnTimelineEntryDisplayer', function() {
    return {
      restrict: 'E',
      scope: {
        entry: '='
      },
      templateUrl: '/views/modules/timeline/timeline-entry-displayer.html'
    };
  })

  .factory('esnTimelineEntryProviders', function() {

    var providers = {};

    function register(provider) {
      if (!provider || !provider.verb) {
        return;
      }

      if (!providers[provider.verb]) {
        providers[provider.verb] = [];
      }
      providers[provider.verb].push(provider);
    }

    function get(verb) {
      return providers[verb] || [];
    }

    return {
      get: get,
      register: register
    };
  })

  .factory('esnTimelineEntriesHelper', function($q, esnTimelineEntryProviders, DEFAULT_TIMELINE_ELEMENT) {

    function getProvidersForTimelineEntry(entry) {

      return esnTimelineEntryProviders.get(entry.verb).filter(function(provider) {
        if (angular.isFunction(provider.canHandle)) {
          return provider.canHandle(entry);
        }
        return true;
      });
    }

    function denormalizeAPIResponse(entries) {
      return $q.when(entries.data.map(function(entry) {
        var providers = getProvidersForTimelineEntry(entry);
        entry.templateUrl = providers.length ? providers[0].templateUrl : DEFAULT_TIMELINE_ELEMENT;
        return entry;
      }));

    }

    return {
      getProvidersForTimelineEntry: getProvidersForTimelineEntry,
      denormalizeAPIResponse: denormalizeAPIResponse
    };

  })

  .controller('esnTimelineEntriesController', function($scope, $log, esnTimelineAPI, esnTimelineEntriesHelper, usSpinnerService) {

    var offset = 0;
    var limit = 10;
    var running = false;
    var spinnerKey = 'timelineEntrySpinner';
    $scope.timelineEntries = [];

    $scope.loadNext = function loadNext() {
      if (running) {
        return;
      }
      usSpinnerService.spin(spinnerKey);

      var options = {
        offset: offset,
        limit: limit
      };
      running = true;

      esnTimelineAPI.getUserTimelineEntries(options)
        .then(esnTimelineEntriesHelper.denormalizeAPIResponse)
        .then(function(denormalized) {
          Array.prototype.push.apply($scope.timelineEntries, denormalized);
          offset += limit;
        })
        .catch(function(err) {
          $log.error('Can not get timeline entries', err);
        }).finally(function() {
          running = false;
          usSpinnerService.stop(spinnerKey);
        });
    };
  });
