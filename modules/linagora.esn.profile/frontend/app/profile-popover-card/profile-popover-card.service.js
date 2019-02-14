(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile').factory('profilePopoverCardService', profilePopoverCardService);

  function profilePopoverCardService(
    $rootScope,
    $compile,
    $modal,
    $log,
    _,
    session,
    touchscreenDetectorService
  ) {
    return {
      bindPopover: bindPopover,
      bindModal: bindModal
    };

    /**
     * @param element HTML element on which to append the popover card
     * @param {Object} user The user of which to display the card.
     * @param {String} eventType Type of event that will be listened on element (mainly 'click' or 'mouseenter')
     * @param {String} placement Placement of the popover. Either 'bottom', 'left', 'right' or 'top'. Optionnal, 'top'
     *   by default
     */
    function bindPopover(element, user, eventType, placement) {
      var popover = createPopover(element, user, placement);

      if (!popover) return;

      element.on(eventType, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        popover.show();
      });

      return popover;
    }

    /**
     * Same as bindPopover but displays a modal
     */
    function bindModal(element, user, eventType) {
      var modal = createModal(user);

      element.on(eventType, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        modal.show();
      });

      return modal;
    }

    function createModal(user) {
      var scope = angular.extend($rootScope.$new(true), {
        user: user,
        isCurrentUser: user._id === session.user._id
      });

      var modal = $modal({
        templateUrl: '/profile/app/profile-popover-card/profile-popover-content/profile-popover-modal.html',
        scope: scope,
        show: false
      });

      return {
        show: modal.show,
        hide: modal.hide
      };
    }

    function createPopover(element, userObject, placement) {
      var user = _.assign({}, userObject);

      if (
        !user.id && !user._id ||
        !user.email && !user.preferredEmail ||
        !user.name && !user.displayName) return;

      if (user.id) user._id = user.id;
      if (user.email) user.preferredEmail = user.email;
      if (user.name) user.displayName = user.name;

      placement = placement || 'top';

      var popoverTemplate = [
        '<div class="profile-popover-card popover" data-profile-popover-card="' + user._id + '" role="tooltip">',
        '  <div class="arrow"></div>',
        '  <div class="popover-content"></div>',
        '</div>'
      ].join('');

      var scope = angular.extend($rootScope.$new(true), {
        user: user,
        isCurrentUser: user._id === session.user._id,
        hideComponent: hide
      });

      var template = $compile(
        '<profile-popover-content user="user" is-current-user="isCurrentUser" hide-component="hideComponent()"/>')(
        scope);

      var $popoverOrigin = $(element).popover({
        content: template,
        placement: placement,
        container: 'body',
        trigger: 'manual',
        html: true,
        template: popoverTemplate
      });

      var $popover = function() {
        return $('.profile-popover-card[data-profile-popover-card="' + user._id + '"]');
      };

      var timeoutedHide = _.debounce(_timeoutedHide, 500);
      var show = _.debounce(_show, 500);

      if (touchscreenDetectorService.hasTouchscreen()) {
        $('body').on('click', function(evt) {
          var $evt = $(evt.target);

          if (!$evt.hasClass('.profile-popover-card') && $evt.parents('.profile-popover-card').length === 0) {
            evt.preventDefault();
            evt.stopPropagation();
            hide();
          }
        });
      }

      function _show() {
        // Verifies that the popover the user is trying to open is not the same one as already opened
        if ($popover().is(':visible')) return;

        $('.profile-popover-card').popover('hide');
        $popoverOrigin.popover('show');
        $('body').on('mousemove', timeoutedHide);
      }

      function hide() {
        $('.profile-popover-card').popover('hide');
      }

      function _timeoutedHide() {
        if (!$('.profile-popover-card:hover').length && !$popoverOrigin.is(':hover')) {
          hide();
          $('body').off('mousemove', timeoutedHide);
        }
      }

      return {
        show: show,
        hide: hide
      };
    }
  }
})(angular);
