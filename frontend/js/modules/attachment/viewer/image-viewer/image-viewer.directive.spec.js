'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentImageViewer directive', function() {
  var $compile, $rootScope;

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

  it('should display the image attachment', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      name: 'imageAttachment.png',
      url: '/url/to/image'
    };

    var element = compileDirective('<esn-attachment-image-viewer attachment="attachment" />', scope);

    expect(element.find('img').attr('ng-src')).to.equal('/url/to/image');
    expect(element.find('img').attr('alt')).to.equal('imageAttachment.png');
  });
});
