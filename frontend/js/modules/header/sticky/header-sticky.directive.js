(function(angular) {
  'use strict';

  angular.module('esn.header')
    .directive('esnHeaderSticky', directive);

  function directive(
    $compile,
    matchmedia,
    ESN_MEDIA_QUERY_SM_XS,
    ESN_MEDIA_QUERY_MD,
    ESN_HEADER_HEIGHT_MD,
    ESN_HEADER_HEIGHT_XL,
    ESN_SUBHEADER_HEIGHT_XS,
    ESN_SUBHEADER_HEIGHT_MD
  ) {
    return {
      restrict: 'A',
      terminal: true,
      priority: 1000,
      link: link
    };

    function link(scope, element) {
      var offset;

       if (matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
         offset = ESN_SUBHEADER_HEIGHT_XS;
       } else if (matchmedia.is(ESN_MEDIA_QUERY_MD)) {
         offset = ESN_HEADER_HEIGHT_MD + ESN_SUBHEADER_HEIGHT_MD;
       } else {
         offset = ESN_HEADER_HEIGHT_XL + ESN_SUBHEADER_HEIGHT_MD;
       }

      // https://stackoverflow.com/a/19228302
      element.attr('hl-sticky', '');
      element.attr('offset-top', offset);
      element.removeAttr('esn-header-sticky');
      $compile(element)(scope);
    }
  }
})(angular);
