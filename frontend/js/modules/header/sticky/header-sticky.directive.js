(function(angular) {
  'use strict';

  angular.module('esn.header')
    .directive('esnHeaderSticky', directive);

  function directive(
    $compile,
    matchmedia,
    SM_XS_MEDIA_QUERY,
    ESN_HEADER_HEIGHT_MD,
    ESN_SUBHEADER_HEIGHT_XS,
    SUB_HEADER_HEIGHT_IN_PX
  ) {
    return {
      restrict: 'A',
      terminal: true,
      priority: 1000,
      link: link
    };

    function link(scope, element) {
      var offset = matchmedia.is(SM_XS_MEDIA_QUERY) ? ESN_SUBHEADER_HEIGHT_XS : ESN_HEADER_HEIGHT_MD + SUB_HEADER_HEIGHT_IN_PX;

      // https://stackoverflow.com/a/19228302
      element.attr('hl-sticky', '');
      element.attr('offset-top', offset);
      element.removeAttr('esn-header-sticky');
      $compile(element)(scope);
    }
  }
})(angular);
