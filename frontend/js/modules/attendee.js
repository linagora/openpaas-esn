'use strict';

angular.module('esn.attendee', [
  'esn.lodash-wrapper'
])

  .run(function($templateCache) {
    /**
     * Override the auto-complete template provided by ngTagsInput
     * so as to warn users when more results are indeed available in the search request
     */
    $templateCache.put('ngTagsInput/auto-complete.html',
      '<div class=\'autocomplete\' ng-if=\'suggestionList.visible\'>' +
        '<ul class=\'suggestion-list\'>' +
          '<li class=\'suggestion-item\' ng-repeat=\'item in suggestionList.items track by $index\' ng-class=\'{selected: item == suggestionList.selected}\' ng-click=\'addSuggestionByIndex($index)\' ng-mouseenter=\'suggestionList.select($index)\'>' +
          '<ti-autocomplete-match data=\'item\'></ti-autocomplete-match></li>' +
          '<li class=\'autocomplete-information\' ng-if=\'(suggestionList.items.length === options.maxResultsToShow)\'>' +
            // TODO i18n
            'Please refine your search to find more accurate results' +
          '</li>' +
        '</ul>' +
      '</div>'
    );
  })

  .constant('DEFAULT_TEMPLATE_URL', '/views/modules/auto-complete/user-auto-complete')

  .factory('attendeeService', function($q, _, DEFAULT_TEMPLATE_URL) {
    var providers = [];

    function addProvider(provider) {
      if (provider && provider.searchAttendee) {
        if (!provider.templateUrl) {
          provider.templateUrl = DEFAULT_TEMPLATE_URL;
        }

        provider.search = function(query, limit) {
          return provider.searchAttendee(query, limit).then(function(attendees) {
            return attendees.map(function(attendee) {
              return angular.extend(attendee, { templateUrl: provider.templateUrl });
            });
          });
        };

        providers.push(provider);
      }
    }

    function getAttendeeCandidates(query, limit) {
      return $q.all(providers.map(function(provider) {
        return provider.search(query, limit);
      }))
      .then(function(arrays) {
        return arrays.reduce(function(resultArray, currentArray) {
          return resultArray.concat(currentArray);
        }, []);
      })
      .then(function(attendees) {
        return _.uniq(attendees, false, function(attendee) {
          return attendee.email || attendee.displayName;
        });
      });
    }

    return {
      addProvider: addProvider,
      getAttendeeCandidates: getAttendeeCandidates
    };
  });
