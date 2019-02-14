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
      var user = JSON.parse(attrs.profilePopoverCard);
      var showMobile = attrs.profilePopoverCardShowMobile !== undefined;
      var alternativeTitle = attrs.profilePopoverCardAlternativeTitle;
      var eventType = touchscreenDetectorService.hasTouchscreen() ? 'click' : 'mouseenter';

      if (showMobile && matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        return profilePopoverCardService.bindModal(element, user, eventType);
      }

      if (!showMobile && matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        return;
      }

      var popover = profilePopoverCardService.bindPopover(element, user, eventType, getPopoverPosition(attrs));
      if (popover) {
        scope.$on('$destroy', popover.hide);
      } else if (alternativeTitle) {
        $(element).attr('title', alternativeTitle);
      }

      function getPopoverPosition(attrs) {
        if (attrs.bottom) return 'bottom';
        if (attrs.left) return 'left';
        if (attrs.right) return 'right';

        return 'top';
      }
    }
  }
})(angular);
