(function(angular) {
  'use strict';

  angular.module('esn.profile-popover-card')
    .factory('profilePopoverCardService', profilePopoverCardService);

  function profilePopoverCardService(
    $rootScope,
    $compile,
    $modal,
    $log,
    $timeout,
    _,
    uuid4,
    session,
    touchscreenDetectorService,
    matchmedia,
    ESN_MEDIA_QUERY_SM_XS
  ) {
    var delayedFnIds = [];
    var functions = {
      bind: bind,
      _bind: _bind,
      bindPopover: bindPopover,
      _createScope: _createScope,
      createPopover: createPopover,
      showPopover: _.debounce(_showPopover, 100, { leading: true, trailing: false }),
      bindModal: bindModal,
      createModal: createModal,
      _isUser: _isUser,
      _normalizeUser: _normalizeUser,
      _get: _get
    };

    return {
      bind: functions.bind,
      functions: functions
    };

    /**
     * Will bind a popover or a modale based on whether the device is a mobile and `showMobile` option is activated
     *
     * @param {Element|jQuery|String}element HTML element on which to append the popover card
     * @param {object} userObject The user of which to display the card.
     * @param {string=} userObject.id
     * @param {string=} userObject._id
     * @param {string=} userObject.email
     * @param {string=} userObject.preferredEmail
     * @param {string=} userObject.name
     * @param {string=} userObject.displayName
     *
     * In case your user object is asynchronously population, you may want a dynamic binding, in which case,
     * you can pass the scope property defining the user to watch and a property of the user object that
     * will be observed to indicate that the user is complete.
     *
     * For instance, profile-popover-card='{ source: "ctrl.attendee", property: "id" }' will asynchronously
     * bind the popover when scope.ctrl.attendee is a correct user by using scope.$watch('ctrl.attendee.id').
     *
     * @param {string=} userObject.source
     * @param {string=} userObject.property
     *
     * @param {object=} options
     * @param {string=} options.placement Placement of popover. Either one of 'top', 'left', 'bottom' or 'right'.
     *   Defaults to 'top'
     * @param {object=} options.parentScope Current scope. Used to hide popover on scope destroy
     * @param {string=} options.eventType Event on which to bind the popover display. Defaults to 'click' on mobile
     * @param {string|Element|jQuery=} options.hideOnElementScroll Element of which scroll event will be listened;
     *   popover will be hidden on this element's scroll screens and 'mouseenter' on desktop
     *
     * see https://ci.linagora.com/linagora/lgs/openpaas/esn/merge_requests/777
     */
    function bind(element, userObject, options) {
      if (!userObject.source && !userObject.property) {
        return functions._bind(element, functions._createScope(userObject), options);
      }

      var watchExp = userObject.source + '.' + userObject.property;

      var whenReady = function(unwatch) {
        var user = functions._get(options.parentScope, userObject.source);
        var watchedProperty = functions._get(options.parentScope, watchExp);

        if (watchedProperty !== undefined) {
          var scope = functions._createScope(user);

          functions._bind(element, scope, options);
          unwatch();

          options.parentScope.$watch(userObject.source, _.partial($timeout, function() {
            var newValue = functions._get(options.parentScope, userObject.source);

            scope.user = functions._normalizeUser(newValue);
          }));
        }
      };

      var unwatch = options.parentScope.$watch(watchExp, function() {
        whenReady(unwatch);
      });
    }

    function _bind(element, scope, options) {
      var defaultOpts = {
        eventType: touchscreenDetectorService.hasTouchscreen() ? 'click' : 'mouseover',
        placement: 'top',
        showMobile: false,
        parentScope: undefined,
        hideOnElementScroll: undefined
      };
      var opts = _.assign({}, defaultOpts, options || {});

      var popover;

      if (opts.showMobile && matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        popover = functions.bindModal(element, scope);
      } else if (!matchmedia.is(ESN_MEDIA_QUERY_SM_XS)) {
        popover = functions.bindPopover(element, scope, opts);
      }

      if (popover) $rootScope.$on('$stateChangeStart', popover.hide);

      return popover;
    }

    function bindPopover(element, scope, options) {
      var popover = functions.createPopover(element, scope, options.placement);

      if (options.parentScope) options.parentScope.$on('$destroy', popover.hide);
      if (options.hideOnElementScroll) $(options.hideOnElementScroll).scroll(popover.hide);
      $(element).attr('title', undefined);
      $(element).css({ cursor: 'pointer' });

      element.on(options.eventType, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        popover.show();
      });

      return popover;
    }

    function createPopover(element, scope, placement) {
      var uuid = uuid4.generate();

      var popoverTemplate = [
        '<div class="profile-card-container profile-popover-card popover" data-profile-popover-card="' + uuid + '" role="tooltip">',
        '  <div class="arrow"></div>',
        '  <div class="popover-content"></div>',
        '</div>'
      ].join('');

      scope.hideComponent = hide;

      var template = $compile('<profile-popover-content user="user" is-current-user="isCurrentUser" object-type="objectType" hide-component="hideComponent()" />')(scope);

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

      var timeoutedHide = _.debounce(_timeoutedHide, 100);

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

      function hide() {
        $('.profile-popover-card[data-profile-popover-card="' + uuid + '"]').popover('hide');
      }

      function _timeoutedHide() {
        if (!$('.profile-popover-card:hover').length && !$popoverOrigin.is(':hover')) {
          hide();
          $('body').off('mousemove', timeoutedHide);
        }
      }

      function show() {
        functions.showPopover($popover, $popoverOrigin, timeoutedHide);
      }

      return {
        show: show,
        hide: hide
      };
    }

    function _showPopover($popover, $popoverOrigin, timeoutedHide) {
      // Verifies that the popover the user is trying to open is not the same one as already opened
      if ($popover().is(':visible')) return;

      var promise = $timeout(function() {
        var promises = angular.copy(delayedFnIds);

        delayedFnIds.length = 0;
        promises.forEach(function(promise) {
          $timeout.cancel(promise);
        });
        $('.profile-popover-card').popover('hide');
        $popoverOrigin.popover('show');
        $('body').on('mousemove', timeoutedHide);
      }, 300);

      delayedFnIds.push(promise);
    }

    /**
     * Same as bindPopover but displays a modal
     */
    function bindModal(element, scope) {
      if (!functions._isUser(scope.user)) return;

      var modal = functions.createModal(scope);
      var eventType = touchscreenDetectorService.hasTouchscreen() ? 'click' : 'mouseover';

      element.on(eventType, function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        modal.show();
      });

      return modal;
    }

    function createModal(scope) {
      var modal = $modal({
        templateUrl: '/views/modules/profile-popover-card/profile-popover-content/profile-popover-modal.html',
        scope: scope,
        show: false
      });

      return {
        show: modal.show,
        hide: modal.hide
      };
    }

    function _isUser(user) {
      if (!user) return undefined;

      return user.preferredEmail || user.email;
    }

    function _normalizeUser(userObject) {
      var user = _.assign({}, userObject);

      // Normalises between people and user objects
      if (user.id) user._id = user.id;
      if (user.email) user.preferredEmail = user.email;
      if (!user.displayName) user.displayName = user.preferredEmail;
      if (user.name) user.displayName = user.name;
      if (!user.objectType) user.objectType = 'email';

      return user;
    }

    /**
     * >>> _get({prop1: {prop2: {prop3: {prop4: 'val'}}}}, 'prop1.prop2.prop3.prop4')
     *     'val'
     * >>> _get({prop1: 'val'}, 'prop1.prop2.prop3.prop4')
     *     undefined
     */
    function _get(object, properties) {
      if (properties === undefined) return properties;

      var propertyList = properties;

      if (!_.isArray(propertyList)) propertyList = properties.toString().split('.');

      if (propertyList.length === 0) {
        return object;
      }

      if (object && object[propertyList[0]] !== undefined) {
        return functions._get(object[propertyList[0]], propertyList.slice(1));
      }

      return undefined;
    }

    function _createScope(user) {
      var normalizedUser = functions._normalizeUser(user);

      return angular.extend($rootScope.$new(true), {
        user: normalizedUser,
        objectType: normalizedUser.objectType,
        isCurrentUser: normalizedUser._id === session.user._id
      });
    }
  }
})(angular);
