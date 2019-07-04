/**
 * profile-popover-card attribute must be provided a user object.
 * profile-popover-card-show-mobile attribute must be provided a boolean
 * See https://ci.linagora.com/linagora/lgs/openpaas/esn/merge_requests/654
 */
(function(angular) {
  angular.module('esn.profile-popover-card').directive('profilePopoverCard', profilePopoverCard);

  function profilePopoverCard(
    $parse,
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

      var user = $parse(attrs.profilePopoverCard)(scope);
      var hideOnElementScroll = attrs.profilePopoverCardHideOnElementScroll;
      var placement = attrs.profilePopoverCardPlacement || 'top';

      var options = {
        placement: placement,
        parentScope: scope,
        showMobile: showMobile,
        hideOnElementScroll: hideOnElementScroll
      };

      profilePopoverCardService.bind(element, user, options);
    }
  }
})(angular);
