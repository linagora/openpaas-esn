'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnAttachmentViewer directive', function() {
  var esnAttachmentViewerService, esnAttachmentViewerViewService, ESN_AV_VIEW_STATES, element;
  var $rootScope, $compile;

  beforeEach(function() {
    angular.mock.module('jadeTemplates');
    angular.mock.module('esn.attachment', function($provide) {
      esnAttachmentViewerService = {
        getCurrentItem: sinon.stub(),
        onBuildRegistry: sinon.spy(),
        openPrev: sinon.spy(),
        openNext: sinon.spy()
      };

      esnAttachmentViewerViewService = {
        getState: sinon.stub(),
        buildViewer: sinon.spy(),
        closeViewer: sinon.spy()
      };

      $provide.value('esnAttachmentViewerService', esnAttachmentViewerService);
      $provide.value('esnAttachmentViewerViewService', esnAttachmentViewerViewService);
    });
  });

  beforeEach(function() {
    inject(function(_$rootScope_, _$compile_, _ESN_AV_VIEW_STATES_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      ESN_AV_VIEW_STATES = _ESN_AV_VIEW_STATES_;
    });
  });

  function initDirective() {
    var scope = $rootScope.$new();
    var template = '<esn-attachment-viewer></esn-attachment-viewer>';
    var element = $compile(template)(scope);

    scope.$digest();

    return element;
  }

    it('should set the view to false when viewer state is close', function() {
      element = initDirective();
      
      esnAttachmentViewerViewService.getState.returns(ESN_AV_VIEW_STATES.CLOSE);
      element.scope().$digest();

      expect(element.scope().view).to.be.equal(false);
    });

    it('should show the modal, get the file and hide the main content when viewer state is open', function() {
      var currentItem = {
        files: [],
        order: 0
      };
      element = initDirective();
      esnAttachmentViewerService.getCurrentItem.returns(currentItem);
      esnAttachmentViewerViewService.getState.returns(ESN_AV_VIEW_STATES.OPEN);
      element.scope().$digest();

      it('should set the view to true and hide the main when viewer state is open', function() {

        expect(element.scope().view).to.be.equal(true);
        expect(element.scope().main).to.be.equal(false);
      });

      it('should update the file when viewer state is open', function() {

        expect(element.scope().file).to.exist;
      });
    });

    it('should display the content when viewer state is display', function() {
      element = initDirective();

      esnAttachmentViewerViewService.getState.returns(ESN_AV_VIEW_STATES.DISPLAY);
      element.scope().$digest();

      expect(element.scope().main).to.be.equal(true);
    });

  describe('The onInit function', function() {
    it('should regist all the elements in modal template', function() {
      element = initDirective();

      expect(esnAttachmentViewerViewService.buildViewer.getCall(0).args[0][0]).to.be.equal(element[0]);
    });
  });

  describe('The closeViewer function', function() {
    it('should close modal when someone clicks', function() {
      element = initDirective();
      element.find('.attachment-viewer').click();

      expect(esnAttachmentViewerViewService.closeViewer).to.have.been.called;
    });
  });

  describe('The openPrev function', function() {
    it('should open the previous file in gallery', function() {
      element = initDirective();
      element.find('.av-prev').click();

      expect(esnAttachmentViewerService.openPrev).to.have.been.called;
    });
  });

  describe('The openNext function', function() {
    it('should open the next file in gallery', function() {
      element = initDirective();
      element.find('.av-next').click();

      expect(esnAttachmentViewerService.openNext).to.have.been.called;
    });
  });
});
