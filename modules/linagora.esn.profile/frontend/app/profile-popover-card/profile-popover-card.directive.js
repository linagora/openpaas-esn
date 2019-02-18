/**
 * profile-popover-card attribute must be provided a user object.
 * profile-popover-card-show-mobile attribute must be provided a boolean
 * See https://ci.linagora.com/linagora/lgs/openpaas/esn/merge_requests/654
 */
(function(angular) {
  angular.module('linagora.esn.profile').directive('profilePopoverCard', profilePopoverCard);

  function profilePopoverCard(
    profilePopoverCardService,
    touchscreenDetectorService,
    matchmedia,
    ESN_MEDIA_QUERY_SM_XS
  ) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attrs) {
      var showMobile = attrs.profilePopoverCardShowMobile !== undefined;

      if (!showMobile && matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        return;
      }

      var user = JSON.parse(attrs.profilePopoverCard);
      var alternativeTitle = attrs.profilePopoverCardAlternativeTitle;
      var hideOnElementScroll = attrs.profilePopoverCardHideOnElementScroll;

      var options = {
        placement: getPopoverPosition(attrs),
        alternativeTitle: alternativeTitle,
        scope: scope,
        showMobile: showMobile,
        hideOnElementScroll: hideOnElementScroll
      };

      profilePopoverCardService.bind(element, user, options);

      function getPopoverPosition(attrs) {
        if (attrs.bottom) return 'bottom';
        if (attrs.left) return 'left';
        if (attrs.right) return 'right';

        return 'top';
      }
    }
  }
})(angular);
