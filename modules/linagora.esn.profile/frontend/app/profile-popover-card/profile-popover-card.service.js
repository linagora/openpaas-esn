(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile').factory('profilePopoverCardService', profilePopoverCardService);

  function profilePopoverCardService(
    $rootScope,
    $compile,
    $modal,
    $log,
    _,
    uuid4,
    session,
    touchscreenDetectorService,
    matchmedia,
    ESN_MEDIA_QUERY_SM_XS
  ) {
    return {bind: bind};

    /**
     * Will bind a popover or a modale based on whether the device is a mobile and `showMobile` option is activated
     *
     * @param {Element|jQuery}element HTML element on which to append the popover card
     * @param {object} userObject The user of which to display the card.
     * @param {string=} userObject.id
     * @param {string=} userObject._id
     * @param {string=} userObject.email
     * @param {string=} userObject.preferredEmail
     * @param {string=} userObject.name
     * @param {string=} userObject.displayName
     * @param {object=} options
     * @param {string=} options.alternativeTitle Alternative `title` attribute to assign to element if user object is
     *   not correct
     * @param {string=} options.placement Placement of popover. Either one of 'top', 'left', 'bottom' or 'right'.
     *   Defaults to 'top'
     * @param {object=} options.scope Current scope. Used to hide popover on scope destroy
     * @param {string=} options.eventType Event on which to bind the popover display. Defaults to 'click' on mobile
     * @param {string|Element|jQuery=} options.hideOnElementScroll Element of which scroll event will be listened;
     *   popover will be hidden on this element's scroll screens and 'mouseenter' on desktop
     */
    function bind(element, userObject, options) {
      var user = _.assign({}, userObject);

      // Normalises between people and user objects
      if (user.id) user._id = user.id;
      if (user.email) user.preferredEmail = user.email;
      if (user.name) user.displayName = user.name;

      var defaultOpts = {
        alternativeTitle: undefined,
        eventType: touchscreenDetectorService.hasTouchscreen() ? 'click' : 'mouseover',
        placement: 'top',
        showMobile: false,
        scope: undefined,
        hideOnElementScroll: undefined
      };
      var opts = _.assign({}, defaultOpts, options || {});

      var popover;

      if (opts.showMobile && matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        popover = bindModal(element, user);
      } else if (!matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        popover = bindPopover(element, user, opts);
      }

      if (popover) $rootScope.$on('$stateChangeStart', popover.hide);

      return popover;
    }

    function bindPopover(element, user, options) {
      if (!_isUser(user)) {
        if (options.alternativeTitle) $(element).attr('title', options.alternativeTitle);
        return;
      }

      var popover = createPopover(element, user, options.placement);

      if (options.scope) options.scope.$on('$destroy', popover.hide);
      if (options.hideOnElementScroll) $(options.hideOnElementScroll).scroll(popover.hide);
      $(element).attr('title', undefined);
      $(element).css({cursor: 'pointer'});

      element.on(options.eventType, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        popover.show();
      });

      return popover;
    }

    function createPopover(element, user, placement) {
      var uuid = uuid4.generate();

      var popoverTemplate = [
        '<div class="profile-popover-card popover" data-profile-popover-card="' + uuid + '" role="tooltip">',
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
        return $('.profile-popover-card[data-profile-popover-card="' + uuid + '"]');
      };

      var timeoutedHide = _.debounce(_timeoutedHide, 150);
      var show = _.debounce(_show, 150);

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
        $('.profile-popover-card[data-profile-popover-card="' + uuid + '"]').popover('hide');
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

    /**
     * Same as bindPopover but displays a modal
     */
    function bindModal(element, user) {
      if (!_isUser(user)) return;

      var modal = createModal(user);
      var eventType = touchscreenDetectorService.hasTouchscreen() ? 'click' : 'mouseover';

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

    function _isUser(user) {
      return user._id && user.preferredEmail && user.displayName;
    }
  }
})(angular);
