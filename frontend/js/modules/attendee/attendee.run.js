(function(angular) {
  'use strict';

  angular.module('esn.attendee').run(runBlock);

  function runBlock($templateCache) {
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
      '</div>');
  }
})(angular);
