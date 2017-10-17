'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentVideoViewer directive', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('esn.attachment');
    module('jadeTemplates');
    inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  function compileDirective(html, scope) {
    var $scope = scope || $rootScope.$new();
    var element = $compile(html)($scope);

    $scope.$digest();

    return element;
  }

  it('should display video player with provided source', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      url: '/url/to/video'
    };

    var element = compileDirective('<esn-attachment-video-viewer attachment="attachment"/>', scope);

    expect(element.find('video').attr('src')).to.equal('/url/to/video');
  });
});
