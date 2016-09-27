'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.dragndrop Angular module', function() {

  var $compile, $rootScope;
  var esnDragService, ESN_DRAG_DISTANCE_THRESHOLD, ESN_DRAG_ANIMATION_DURATION;
  var deviceDetectorMock;

  beforeEach(module('esn.dragndrop'));

  beforeEach(function() {
    deviceDetectorMock = {
      isMobile: function() { return false; }
    };

    module('ng.deviceDetector', function($provide) {
      $provide.value('deviceDetector', deviceDetectorMock);
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _esnDragService_, _ESN_DRAG_DISTANCE_THRESHOLD_, _ESN_DRAG_ANIMATION_DURATION_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    esnDragService = _esnDragService_;
    ESN_DRAG_DISTANCE_THRESHOLD = _ESN_DRAG_DISTANCE_THRESHOLD_;
    ESN_DRAG_ANIMATION_DURATION = _ESN_DRAG_ANIMATION_DURATION_;
  }));

  function compileDirective(html, scope) {
    scope = scope || $rootScope.$new();

    var element = $compile(html)(scope);

    scope.$digest();

    return element;
  }

  function mouseDownOn(element, clientX, clientY) {
    element.triggerHandler({
      type: 'mousedown',
      button: 0,
      clientX: clientX,
      clientY: clientY
    });
  }

  function mouseMoveOn(element, clientX, clientY) {
    element.triggerHandler({
      type: 'mousemove',
      button: 0,
      clientX: clientX,
      clientY: clientY
    });
  }

  function mouseUpOn(element, clientX, clientY) {
    element.triggerHandler({
      type: 'mouseup',
      button: 0,
      clientX: clientX,
      clientY: clientY
    });
  }

  describe('The esnDraggable directive', function() {

    var $document, $timeout;
    var ESN_DRAG_ANIMATION_CLASS;

    beforeEach(inject(function(_$document_, _$timeout_, _ESN_DRAG_ANIMATION_CLASS_) {
      $document = _$document_;
      $timeout = _$timeout_;
      ESN_DRAG_ANIMATION_CLASS = _ESN_DRAG_ANIMATION_CLASS_;
    }));

    afterEach(function() {
      mouseUpOn($document);
      $rootScope.esnIsDragging && $timeout.flush();
    });

    it('should do nothing if current device is mobile', function() {
      deviceDetectorMock.isMobile = function() { return true; };

      var element = compileDirective('<div esn-draggable></div>');

      expect(element.attr('draggable')).to.be.undefined;
    });

    it('should disable native HTML5 drag', function() {
      var element = compileDirective('<div esn-draggable></div>');

      expect(element.attr('draggable')).to.equal('false');
    });

    it('should prevent text selection on mousedown', function() {
      var element = compileDirective('<div esn-draggable></div>');
      var preventDefaultSpy = sinon.spy();

      element.triggerHandler({
        type: 'mousedown',
        button: 0,
        preventDefault: preventDefaultSpy
      });

      expect(preventDefaultSpy).to.have.been.calledOnce;
    });

    it('should start drag element on mousemove more than ESN_DRAG_DISTANCE_THRESHOLD from mousedown position to the right', function() {
      var element = compileDirective('<div esn-draggable esn-on-drag-start="onDragStart()"></div>');
      var scope = element.scope();
      var onDragStartSpy = sinon.spy(esnDragService, 'onDragStart');

      scope.onDragStart = sinon.spy();

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, ESN_DRAG_DISTANCE_THRESHOLD + 1, 0);

      expect(scope.onDragStart).to.have.been.calledOnce;
      expect(onDragStartSpy).to.have.been.calledOnce;
    });

    it('should start drag element on mousemove more than ESN_DRAG_DISTANCE_THRESHOLD from mousedown position to the left', function() {
      var element = compileDirective('<div esn-draggable esn-on-drag-start="onDragStart()"></div>');
      var scope = element.scope();
      var onDragStartSpy = sinon.spy(esnDragService, 'onDragStart');

      scope.onDragStart = sinon.spy();

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, -ESN_DRAG_DISTANCE_THRESHOLD - 1, 0);

      expect(scope.onDragStart).to.have.been.calledOnce;
      expect(onDragStartSpy).to.have.been.calledOnce;
    });

    it('should not start drag on mousemove not more than ESN_DRAG_DISTANCE_THRESHOLD from mousedown position', function() {
      var element = compileDirective('<div esn-draggable></div>');
      var scope = element.scope();
      var onDragStartSpy = sinon.spy(esnDragService, 'onDragStart');

      scope.onDragStart = sinon.spy();
      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, ESN_DRAG_DISTANCE_THRESHOLD, ESN_DRAG_DISTANCE_THRESHOLD);

      expect(scope.onDragStart).to.not.have.been.called;
      expect(onDragStartSpy).to.not.have.been.called;
    });

    it('should add tooltip element to body on drag start', function() {
      var scope = $rootScope.$new();

      scope.dragMessage = 'a message';
      var element = compileDirective('<div esn-draggable esn-drag-message="dragMessage"></div>', scope);

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);

      var tooltipElement = angular.element(document.body).find('.tooltip');

      expect(tooltipElement.length).to.equal(1);
      expect(tooltipElement.html()).to.contain('a message');
    });

    it('should escape drag message in tooltip element', function() {
      var scope = $rootScope.$new();

      scope.dragMessage = '<b>test</b>';
      var element = compileDirective('<div esn-draggable esn-drag-message="dragMessage"></div>', scope);

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);

      var tooltipElement = angular.element(document.body).find('.tooltip');

      expect(tooltipElement.html()).to.contain('&lt;b&gt;test&lt;/b&gt;');
    });

    it('should move tooltip to near mouse position on dragging', function() {
      var element = compileDirective('<div esn-draggable></div>');

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11.5);

      var tooltipElement = angular.element(document.body).find('.tooltip');

      expect(tooltipElement.css('top')).to.equal((11.5 - tooltipElement.height() / 2) + 'px');
      expect(tooltipElement.css('left')).to.equal('11px');
      expect(tooltipElement.css('opacity')).to.equal('1');
    });

    it('should end drag on mouseup', function() {
      var element = compileDirective('<div esn-draggable esn-on-drag-end="onDragEnd()"></div>');
      var scope = element.scope();

      scope.onDragEnd = sinon.spy();

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(scope.onDragEnd).to.have.been.calledOnce;
    });

    it('should call esnDragService.onDragEnd with callback data', function() {
      var element = compileDirective('<div esn-draggable esn-drag-data="dragData"></div>');
      var scope = element.scope();
      var onDragEndSpy = sinon.spy(esnDragService, 'onDragEnd');

      scope.dragData = 'some data';

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(onDragEndSpy).to.have.been.calledOnce;
      expect(onDragEndSpy).to.have.been.calledWithMatch({
        onDropSuccess: sinon.match.func,
        onDropFailure: sinon.match.func
      });
    });

    it('should remove tooltip immediately after a drop on dropzone', function() {
      var element = compileDirective('<div esn-draggable></div>');

      esnDragService.addDroppableListener('someScopeId', {
        onDragStart: angular.noop,
        onDragEnd: function() {
          return true;
        }
      });

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(angular.element(document.body).find('.tooltip').length).to.equal(0);
    });

    it('should hide tooltip animatedly after a timeout after a drop on non-dropzone', function() {
      var element = compileDirective('<div esn-draggable></div>');

      esnDragService.addDroppableListener('someScopeId', {
        onDragStart: angular.noop,
        onDragEnd: function() {
          return false;
        }
      });

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(angular.element(document.body).find('.tooltip').hasClass(ESN_DRAG_ANIMATION_CLASS)).to.be.true;

      $timeout.flush();

      expect(angular.element(document.body).find('.tooltip').length).to.equal(0);
    });

    it('should call esnOnDragEnd with true value after a drop on dropzone', function() {
      var element = compileDirective('<div esn-draggable esn-on-drag-end="onDragEnd($dropped)"></div>');
      var scope = element.scope();

      scope.onDragEnd = sinon.spy();
      esnDragService.addDroppableListener('someScopeId', {
        onDragStart: angular.noop,
        onDragEnd: function() {
          return true;
        }
      });

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(scope.onDragEnd).to.have.been.calledOnce;
      expect(scope.onDragEnd).to.have.been.calledWith(true);

    });

    it('should call esnOnDragEnd with false value after a drop on non-dropzone', function() {
      var element = compileDirective('<div esn-draggable esn-on-drag-end="onDragEnd($dropped)"></div>');
      var scope = element.scope();

      scope.onDragEnd = sinon.spy();
      esnDragService.addDroppableListener('someScopeId', {
        onDragStart: angular.noop,
        onDragEnd: function() {
          return false;
        }
      });

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);
      mouseUpOn($document);

      expect(scope.onDragEnd).to.have.been.calledOnce;
      expect(scope.onDragEnd).to.have.been.calledWith(false);

    });

    it('should add CSS on drag start and remove it on drag end if esnDragClass is provided', function(done) {
      var element = compileDirective('<div esn-draggable esn-drag-class="dragging"></div>');

      mouseDownOn(element, 0, 0);
      mouseMoveOn($document, 11, 11);

      expect(element.hasClass('dragging')).to.equal(true);

      mouseUpOn($document);

      $timeout(angular.noop, ESN_DRAG_ANIMATION_DURATION + 1)
        .then(function() {
          expect(element.hasClass('dragging')).to.equal(false);
        })
        .then(done);

      $timeout.flush();
    });

  });

  describe('The esnDroppable directive', function() {

    it('should do nothing if current device is mobile', function() {
      deviceDetectorMock.isMobile = function() { return true; };

      var addDroppableListenerSpy = sinon.spy(esnDragService, 'addDroppableListener');

      compileDirective('<div esn-droppable></div>');

      expect(addDroppableListenerSpy).to.have.been.callCount(0);
    });

    it('should add drop listener', function() {
      var addDroppableListenerSpy = sinon.spy(esnDragService, 'addDroppableListener');
      var element = compileDirective('<div esn-droppable></div>');
      var scope = element.scope();

      expect(addDroppableListenerSpy).to.have.been.calledOnce;
      expect(addDroppableListenerSpy).to.have.been.calledWithMatch(scope.$id, {
        onDragStart: sinon.match.func,
        onDragEnd: sinon.match.func
      });
    });

    it('should remove drop listener on $destroy', function() {
      var removeDroppableListenerSpy = sinon.spy(esnDragService, 'removeDroppableListener');
      var element = compileDirective('<div esn-droppable></div>');
      var scope = element.scope();

      scope.$destroy();

      expect(removeDroppableListenerSpy).to.have.been.calledOnce;
      expect(removeDroppableListenerSpy).to.have.been.calledWith(scope.$id);
    });

    it('should listen on mouse events on drag start if current element is droppable', function() {
      var element = compileDirective('<div esn-droppable esn-is-drop-zone="isDropZone($dragData)" esn-on-drag-exit="onDragExit()" esn-on-drag-enter="onDragEnter()"></div>');
      var scope = element.scope();

      scope.isDropZone = function() { return true; };
      scope.onDragEnter = sinon.spy();
      scope.onDragExit = sinon.spy();

      esnDragService.onDragStart('some drag data');

      element.triggerHandler({ type: 'mouseenter' });
      expect(scope.onDragEnter).to.have.been.calledOnce;

      element.triggerHandler({ type: 'mouseleave' });
      expect(scope.onDragExit).to.have.been.calledOnce;
    });

    it('should add CSS on drag enter and remove it on drag exit if esnDroptargetClass is provided', function() {
      var element = compileDirective('<div esn-droppable esn-is-drop-zone="isDropZone($dragData)" esn-droptarget-class="droptarget"></div>');
      var scope = element.scope();

      scope.isDropZone = function() { return true; };
      esnDragService.onDragStart('some drag data');

      element.triggerHandler({ type: 'mouseenter' });
      expect(element.hasClass('droptarget')).to.be.true;

      element.triggerHandler({ type: 'mouseleave' });
      expect(element.hasClass('droptarget')).to.be.false;
    });

    it('should perform drop on drag end if current element is drop candidate', function() {
      var element = compileDirective('<div esn-droppable esn-is-drop-zone="isDropZone($dragData)" esn-on-drop="onDrop()" esn-droptarget-class="droptarget"></div>');
      var scope = element.scope();
      var dragData = 'some drag data';

      scope.isDropZone = function() { return true; };
      scope.onDrop = sinon.stub().returns($q.when());

      esnDragService.onDragStart(dragData);
      element.triggerHandler({ type: 'mouseenter' });

      var callbacks = {
        onDropFailure: sinon.spy(),
        onDropSuccess: sinon.spy()
      };
      var dropped = esnDragService.onDragEnd(callbacks);

      scope.$digest();

      expect(dropped).to.be.true;
      expect(scope.onDrop).to.have.been.calledOnce;
      expect(callbacks.onDropSuccess).to.have.been.calledOnce;
      expect(element.hasClass('droptarget')).to.be.false;

    });

  });

});
