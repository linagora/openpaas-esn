'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentImagePreview component', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('esn.attachment');
    module('jadeTemplates');
    inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    });
  });

  function compileComponent(html, scope) {
    var $scope = scope || $rootScope.$new();
    var element = $compile(html)($scope);

    $scope.$digest();

    return element;
  }

  it('should display image preview', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      name: 'attachmentImage.png',
      url: 'url/to/image',
      length: '102302'
    };

    var element = compileComponent('<esn-attachment-image-preview attachment="attachment"/>', scope);

    expect(element.find('img').attr('ng-src')).to.equal('url/to/image');
    expect(element.find('img').attr('alt')).to.equal('attachmentImage.png');
  });

  it('should display image info', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      name: 'attachmentImage.png',
      length: '102302'
    };

    var element = compileComponent('<esn-attachment-image-preview attachment="attachment"/>', scope);

    expect(element.find('.img-info').html()).to.contain('attachmentImage.png');
    expect(element.find('.img-info').html()).to.contain('99.9KB');
  });
});
