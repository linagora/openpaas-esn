'use strict';

/* global chai: false */
/* global sinon: true */

var expect = chai.expect;

describe('The profilePopoverCardService service', function() {
  var $rootScope, userObject, contactUserObject, externalUserObject, profilePopoverCardService, element;
  var touchscreenDetectorService = {hasTouchscreen: sinon.stub()};
  var stubbedModalRes = {show: sinon.spy(), hide: sinon.spy()};
  var $modal = sinon.stub().returns(stubbedModalRes);
  var matchmedia;
  var scope, parentScope;

  beforeEach(function() {
    parentScope = {$watch: angular.noop, $on: angular.noop};
    matchmedia = {is: angular.noop};
    element = {on: sinon.spy()};

    module('esn.profile-popover-card', function($provide) {
      $provide.value('$modal', $modal);
      $provide.value('$state', {go: sinon.stub()});
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
      id: '5d0ba10c291d3c6435e90c5e',
      objectType: 'user'
    };

    contactUserObject = {
      name: 'Peter Parker',
      email: 'Peter-Parker@avengers.ny',
      id: '0764a32c-686c-45d7-8034-2b53f080226c',
      objectType: 'contact'
    };

    externalUserObject = {
      name: 'Bruce Wayne',
      email: 'Bruce-Wayne@becauseImBatman.com'
    };

    scope = {
      user: profilePopoverCardService.functions._normalizeUser(userObject),
      isCurrentUser: false
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
      profilePopoverCardService.bind(element, userObject, {parentScope: parentScope});
      expect(profilePopoverCardService.functions._bind).to.have.been
        .calledWith(
          element,
          sinon.match.has('user').and(sinon.match.has('isCurrentUser')),
          {parentScope: parentScope}
        );
    });

    it('should start watching the parentScope when passed a dynamic reference object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.spy(parentScope, '$watch');
      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {parentScope: parentScope});
      expect(parentScope.$watch).to.to.have.been.calledWith('user.id', sinon.match.func);
    });

    it('should not call _bind if the watched object is not a user object', function() {
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.spy(parentScope, '$watch');
      sinon.stub(profilePopoverCardService.functions, '_isUser').returns(false);
      parentScope.user = {};

      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {parentScope: parentScope});

      var callback = parentScope.$watch.getCall(0).args[1];

      callback();

      expect(profilePopoverCardService.functions._bind).not.to.have.been.called;
    });

    it('should call _bind if the watched object is not a user object', function() {
      parentScope.user = userObject;
      sinon.spy(profilePopoverCardService.functions, '_bind');
      sinon.stub(profilePopoverCardService.functions, '_isUser').returns(true);
      sinon.stub(parentScope, '$watch').returns(angular.noop);

      profilePopoverCardService.bind(element, {source: 'user', property: 'id'}, {parentScope: parentScope});

      var callback = parentScope.$watch.getCall(0).args[1];

      callback();

      expect(profilePopoverCardService.functions._bind).to.have.been
        .calledWith(element, sinon.match.has('user').and(sinon.match.has('isCurrentUser')), {parentScope: parentScope});
    });
  });

  describe('_bind', function() {
    it('should bind a popover when displaying on desktop', function() {
      sinon.stub(matchmedia, 'is').returns(false);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      profilePopoverCardService.functions._bind(element, scope, {parentScope: parentScope});
      expect(profilePopoverCardService.functions.bindPopover).to.have.been.calledWith(element, scope);
      expect(profilePopoverCardService.functions.bindModal).not.to.have.been.called;
    });

    it('should bind a modal when displaying on mobile and showMobile option is true', function() {
      sinon.stub(matchmedia, 'is').returns(true);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      profilePopoverCardService.functions._bind(element, scope, {parentScope: parentScope, showMobile: true});
      expect(profilePopoverCardService.functions.bindPopover).not.to.have.been.called;
      expect(profilePopoverCardService.functions.bindModal).to.have.been
        .calledWith(element, scope);
    });

    it('should not bind when displaying on mobile and showMobile option is false', function() {
      sinon.stub(matchmedia, 'is').returns(true);
      sinon.spy(profilePopoverCardService.functions, 'bindModal');
      sinon.spy(profilePopoverCardService.functions, 'bindPopover');

      var popover = profilePopoverCardService.functions
        ._bind(element, scope, {parentScope: parentScope, showMobile: false});
      expect(profilePopoverCardService.functions.bindPopover).not.to.have.been.called;
      expect(profilePopoverCardService.functions.bindModal).not.to.have.been.called;
      expect(popover).to.be.undefined;
    });

    it('should listen for route changes', function() {
      sinon.spy($rootScope, '$on');
      var popover = profilePopoverCardService.functions
        ._bind(element, scope, {parentScope: parentScope, showMobile: false});

      expect($rootScope.$on).to.have.been.calledWith('$stateChangeStart', popover.hide);
    });
  });

  describe('bindPopover', function() {
    it('should not bind popover if no correct user was provided', function() {
      var popover = profilePopoverCardService.functions.bindPopover(element, {user: undefined}, {});
      expect(popover).to.be.undefined;
    });

    it('should create a popover', function() {
      sinon.spy(profilePopoverCardService.functions, 'createPopover');
      profilePopoverCardService.functions.bindPopover(element, scope, {parentScope: parentScope, placement: 'top'});
      expect(profilePopoverCardService.functions.createPopover).to.have.been.calledWith(element, scope, 'top');

      profilePopoverCardService.functions.createPopover.reset();
    });

    it('should start listening for parentScope\'s $destroy event', function() {
      sinon.stub(profilePopoverCardService.functions, 'createPopover')
        .returns({show: angular.noop, hide: angular.noop});
      sinon.spy(parentScope, '$on');

      profilePopoverCardService.functions.bindPopover(element, scope, {parentScope: parentScope});
      expect(parentScope.$on).to.have.been.calledWith('$destroy', angular.noop);
    });
  });

  describe('bindModal', function() {
    var event;
    before(function() {
      event = {preventDefault: sinon.spy(), stopPropagation: sinon.spy()};
    });

    it('should return undefined with bad user object', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns();
      var targetModal = profilePopoverCardService.functions.bindModal(
        element, {user: undefined}, {parentScope: parentScope});
      expect(targetModal).to.be.undefined;
    });

    it('should create a modal', function() {
      sinon.spy(profilePopoverCardService.functions, 'createModal');
      profilePopoverCardService.functions.bindModal(element, scope, {parentScope: parentScope});
      expect(profilePopoverCardService.functions.createModal).to.have.been.calledWith(scope);
    });

    it('should bind the correct event', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns();
      touchscreenDetectorService.hasTouchscreen.returns(true);
      profilePopoverCardService.functions.bindModal(element, scope, {parentScope: parentScope});
      expect(element.on).to.have.been.calledWith('click', sinon.match.func);

      touchscreenDetectorService.hasTouchscreen.returns(false);
      profilePopoverCardService.functions.bindModal(element, scope, {parentScope: parentScope});
      expect(element.on).to.have.been.calledWith('mouseover', sinon.match.func);
    });

    it('should show the modal when the event is fired', function() {
      sinon.stub(profilePopoverCardService.functions, 'createModal').returns(stubbedModalRes);
      profilePopoverCardService.functions.bindModal(element, scope, {parentScope: parentScope});
      element.on.lastCall.args[1](event);

      expect(event.stopPropagation).to.have.been.called;
      expect(event.preventDefault).to.have.been.called;
      expect(stubbedModalRes.show).to.have.been.called;
    });
  });

  describe('createModal', function() {
    it('should create a modal', function() {
      var targetModal = profilePopoverCardService.functions.createModal(scope);

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
        id: '5d0ba10c291d3c6435e90c5e',
        _id: '5d0ba10c291d3c6435e90c5e',
        objectType: 'user'
      });
    });

    it('should complete displayName with preferredEmail when absent', function() {
      expect(profilePopoverCardService.functions._normalizeUser({email: userObject.email, objectType: 'user'})).to.eql({
        displayName: 'karl-marx@proletarian.people',
        email: 'karl-marx@proletarian.people',
        preferredEmail: 'karl-marx@proletarian.people',
        objectType: 'user'
      });
    });

    it('should normalize user with objectType "contact"', function() {
      expect(profilePopoverCardService.functions._normalizeUser(contactUserObject)).to.eql({
        name: 'Peter Parker',
        displayName: 'Peter Parker',
        email: 'Peter-Parker@avengers.ny',
        preferredEmail: 'Peter-Parker@avengers.ny',
        id: '0764a32c-686c-45d7-8034-2b53f080226c',
        _id: '0764a32c-686c-45d7-8034-2b53f080226c',
        objectType: 'contact'
      });
    });

    it('should normalize external user', function() {
      expect(profilePopoverCardService.functions._normalizeUser(externalUserObject)).to.eql({
        name: 'Bruce Wayne',
        displayName: 'Bruce Wayne',
        email: 'Bruce-Wayne@becauseImBatman.com',
        preferredEmail: 'Bruce-Wayne@becauseImBatman.com',
        objectType: 'email'
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
