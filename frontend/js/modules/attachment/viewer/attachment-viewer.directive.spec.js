'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentViewer directive', function() {
  var $compile, $rootScope;
  var esnAttachmentViewerService;

  beforeEach(function() {
    module('esn.attachment');
    module('jadeTemplates');

    inject(function(_$rootScope_, _$compile_, _esnAttachmentRegistryService_, _esnAttachmentViewerService_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      esnAttachmentViewerService = _esnAttachmentViewerService_;
    });
  });

  function compileComponent(html, scope) {
    var $scope = scope || $rootScope.$new();
    var element = $compile(html)($scope);

    $scope.$digest();

    return element;
  }

  it('should render file viewer according to file type', function() {
    var singleFile = {
      name: 'attachmentFile.png',
      length: '102302',
      contentType: 'image/png'
    };
    var files = [singleFile];

    esnAttachmentViewerService.registerViewer = function(viewer) {
      viewer.open(files, 0);
    };

    var element = compileComponent('<esn-attachment-viewer />');

    expect(element.find('esn-attachment-image-viewer').length).to.equal(1);
  });

  it('should display current file order in gallery', function() {
    var files = [{}, {}];

    esnAttachmentViewerService.registerViewer = function(viewer) {
      viewer.open(files, 0);
    };

    var element = compileComponent('<esn-attachment-viewer />');

    expect(element.find('.av-number').html()).to.contain('File 1 of 2');
  });

  it('should change current file order in gallery if next or previous button is clicked', function() {
    var files = [{}, {}];

    esnAttachmentViewerService.registerViewer = function(viewer) {
      viewer.open(files, 0);
    };

    var element = compileComponent('<esn-attachment-viewer />');

    expect(element.find('.av-number').html()).to.contain('File 1 of 2');

    element.find('.av-next').triggerHandler('click');
    expect(element.find('.av-number').html()).to.contain('File 2 of 2');

    element.find('.av-prev').triggerHandler('click');
    expect(element.find('.av-number').html()).to.contain('File 1 of 2');
  });

  it('should remove itself if close button is clicked', function() {
    var files = [{}, {}];

    esnAttachmentViewerService.registerViewer = function(viewer) {
      viewer.open(files, 0);
    };

    var element = compileComponent('<div><esn-attachment-viewer /></div>');

    expect(element.find('esn-attachment-viewer').length).to.equal(1);

    element.find('.av-closeContainer').triggerHandler('click');
    expect(element.find('esn-attachment-viewer').length).to.equal(0);
  });

  it('should render next item in gallery if next or previous button is clicked', function() {
    var file1 = {
      contentType: 'image/png'
    };
    var file2 = {
      contentType: 'video/mp4'
    };
    var files = [file1, file2];

    esnAttachmentViewerService.registerViewer = function(viewer) {
      viewer.open(files, 0);
    };

    var element = compileComponent('<esn-attachment-viewer />');

    expect(element.find('esn-attachment-image-viewer').length).to.equal(1);

    element.find('.av-next').triggerHandler('click');
    expect(element.find('esn-attachment-image-viewer').length).to.equal(0);
    expect(element.find('esn-attachment-video-viewer').length).to.equal(1);

    element.find('.av-next').triggerHandler('click');
    expect(element.find('esn-attachment-image-viewer').length).to.equal(1);
    expect(element.find('esn-attachment-video-viewer').length).to.equal(0);
  });
});
