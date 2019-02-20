'use strict';

/* global chai: false */
/* global sinon: true */

var expect = chai.expect;

describe('The profilePopoverCardService service', function() {
  var $rootScope, userObject, profilePopoverCardService, element;
  var touchscreenDetectorService = {hasTouchscreen: sinon.stub()};
  var stubbedModalRes = {show: sinon.spy(), hide: sinon.spy()};
  var $modal = sinon.stub().returns(stubbedModalRes);
  var matchmedia;
  var scope;

  beforeEach(function() {
    scope = {$watch: angular.noop, $on: angular.noop};
    matchmedia = {is: angular.noop};
    element = {on: sinon.spy()};

    module('linagora.esn.profile', function($provide) {
      $provide.value('$modal', $modal);
      $provide.value('touchscreenDetectorService', touchscreenDetectorService);
      $provide.value('matchmedia', matchmedia);
      $provide.value('ESN_MEDIA_QUERY_SM_XS', '(max-width: 767px), (min-width: 768px) and (max-width: 991px)');
    });

    inject(function(_$rootScope_, _profilePopoverCardService_) {
      $rootScope = _$rootScope_;
      profilePopoverCardService = _profilePopoverCardService_;
    });

    userObject = {
      name: 'Karl Marx',
      email: 'karl-marx@proletarian.people',
      id: '0764a32c-686c-45d7-8034-2b53f080226c'
    };
  });

  describe('bind', function() {
    afterEach(function() {
      try {
        profilePopoverCardService.functions._bind.reset();
      } catch (_) {} // eslint-disable-line
    });

    it('should call `_bind` when passed a user object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      profilePopoverCardService.bind(element, userObject, {scope: scope});
      expect(profilePopoverCardService.functions._bind).to.have.been.calledWith(element, userObject, {scope: scope});
    });

    it('should start watching the scope when passed a dynamic reference object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.spy(scope, '$watch');
      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {scope: scope});
      expect(scope.$watch).to.to.have.been.calledWith('user.id', sinon.match.func);
    });

    it('should not call _bind if the watched object is not a user object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.spy(scope, '$watch');
      sinon.stub(profilePopoverCardService.functions, '_isUser').returns(false);
      scope.user = {};

      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {scope: scope});

      var callback = scope.$watch.getCall(0).args[1];

      callback();

      expect(profilePopoverCardService.functions._bind).not.to.have.been.called;
    });

    it('should call _bind if the watched object is not a user object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.stub(profilePopoverCardService.functions, '_isUser').returns(true);
      sinon.stub(scope, '$watch').returns(angular.noop);

      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {scope: scope});

      var callback = scope.$watch.getCall(0).args[1];

      callback();

      expect(profilePopoverCardService.functions._bind).to.have.been.calledWith(element, scope.user, {scope: scope});
    });
  });

  describe('_bind', function() {
    it('should bind a popover when displaying on desktop', function() {
      sinon.stub(matchmedia, 'is').returns(false);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      profilePopoverCardService.functions._bind(element, userObject, {scope: scope});
      expect(profilePopoverCardService.functions.bindPopover).to.have.been
        .calledWith(element, profilePopoverCardService.functions._normalizeUser(userObject));
      expect(profilePopoverCardService.functions.bindModal).not.to.have.been.called;
    });

    it('should bind a modal when displaying on mobile and showMobile option is true', function() {
      sinon.stub(matchmedia, 'is').returns(true);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      profilePopoverCardService.functions._bind(element, userObject, {scope: scope, showMobile: true});
      expect(profilePopoverCardService.functions.bindPopover).not.to.have.been.called;
      expect(profilePopoverCardService.functions.bindModal).to.have.been
        .calledWith(element, profilePopoverCardService.functions._normalizeUser(userObject));
    });

    it('should not bind when displaying on mobile and showMobile option is false', function() {
      sinon.stub(matchmedia, 'is').returns(true);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      var popover = profilePopoverCardService.functions
        ._bind(element, userObject, {scope: scope, showMobile: false});
      expect(profilePopoverCardService.functions.bindPopover).not.to.have.been.called;
      expect(profilePopoverCardService.functions.bindModal).not.to.have.been.called;
      expect(popover).to.be.undefined;
    });

    it('should listen for route changes', function() {
      sinon.spy($rootScope, '$on');
      var popover = profilePopoverCardService.functions
        ._bind(element, userObject, {scope: scope, showMobile: false});

      expect($rootScope.$on).to.have.been.calledWith('$stateChangeStart', popover.hide);
    });
  });

  describe('bindPopover', function() {
    it('should not bind popover if no correct user was provided', function() {
      var popover = profilePopoverCardService.functions.bindPopover(element, undefined, {});
      expect(popover).to.be.undefined;
    });

    it('should set the title attribute to an element if alternativeTitle option is provided', function() {
      profilePopoverCardService.functions.bindPopover('body', undefined, {alternativeTitle: 'Karl Marx'});
      expect($('body').attr('title')).to.eql('Karl Marx');
    });

    it('should create a popover', function() {
      sinon.spy(profilePopoverCardService.functions, 'createPopover');
      profilePopoverCardService.functions.bindPopover(element, userObject, {scope: scope, placement: 'top'});
      expect(profilePopoverCardService.functions.createPopover).to.have.been.calledWith(element, userObject, 'top');

      profilePopoverCardService.functions.createPopover.reset();
    });

    it('should start listening for scope\'s $destroy event', function() {
      sinon.stub(profilePopoverCardService.functions, 'createPopover')
        .returns({show: angular.noop, hide: angular.noop});
      sinon.spy(scope, '$on');

      profilePopoverCardService.functions.bindPopover(element, userObject, {scope: scope});
      expect(scope.$on).to.have.been.calledWith('$destroy', angular.noop);
    });
  });

  describe('bindModal', function() {
    var event;
    before(function() {
      event = {preventDefault: sinon.spy(), stopPropagation: sinon.spy()};
    });

    it('should return undefined with bad user object', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns();
      var targetModal = profilePopoverCardService.functions.bindModal(element, undefined, {scope: scope});
      expect(targetModal).to.be.undefined;
    });

    it('should create a modal', function() {
      sinon.spy(profilePopoverCardService.functions, 'createModal');
      profilePopoverCardService.functions.bindModal(element, userObject, {scope: scope});
      expect(profilePopoverCardService.functions.createModal).to.have.been.calledWith(userObject);
    });

    it('should bind the correct event', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns();
      touchscreenDetectorService.hasTouchscreen.returns(true);
      profilePopoverCardService.functions.bindModal(element, userObject, {scope: scope});
      expect(element.on).to.have.been.calledWith('click', sinon.match.func);

      touchscreenDetectorService.hasTouchscreen.returns(false);
      profilePopoverCardService.functions.bindModal(element, userObject, {scope: scope});
      expect(element.on).to.have.been.calledWith('mouseover', sinon.match.func);
    });

    it('should show the modal when the event is fired', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns(stubbedModalRes);
      profilePopoverCardService.functions.bindModal(element, userObject, {scope: scope});
      element.on.lastCall.args[1](event);

      expect(event.stopPropagation).to.have.been.called;
      expect(event.preventDefault).to.have.been.called;
      expect(stubbedModalRes.show).to.have.been.called;
    });
  });

  describe('createModal', function() {
    it('should create a modal', function() {
      var targetModal = profilePopoverCardService.functions.createModal(userObject);

      expect($modal).to.have.been.calledWith(sinon.match.has('show', false));
      expect(targetModal).to.eql({
        show: stubbedModalRes.show,
        hide: stubbedModalRes.hide
      });
    });
  });

  describe('_normalizeUser', function() {
    it('should normalize between user and people objects', function() {
      expect(profilePopoverCardService.functions._normalizeUser(userObject)).to.eql({
        name: 'Karl Marx',
        displayName: 'Karl Marx',
        email: 'karl-marx@proletarian.people',
        preferredEmail: 'karl-marx@proletarian.people',
        id: '0764a32c-686c-45d7-8034-2b53f080226c',
        _id: '0764a32c-686c-45d7-8034-2b53f080226c'
      });
    });
  });

  describe('_get', function() {
    it('should correctly walk through the object hierarchy', function() {
      expect(
        profilePopoverCardService.functions._get({prop1: {prop2: {prop3: {prop4: 'val'}}}}, 'prop1.prop2.prop3.prop4'))
        .to.eq('val');
      expect(profilePopoverCardService.functions._get({prop1: 'val'}, 'prop1.prop2.prop3.prop4')).to.be.undefined;
      expect(profilePopoverCardService.functions._get({prop1: 'val'}, undefined)).to.be.undefined;
      expect(profilePopoverCardService.functions._get(undefined, 'prop1.prop2.prop3.prop4')).to.be.undefined;
    });
  });
});
