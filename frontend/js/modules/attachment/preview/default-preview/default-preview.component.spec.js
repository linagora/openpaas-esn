'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentDefaultPreview component', function() {
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

  it('should display preview attachment icon', function() {
    var element = compileComponent('<esn-attachment-default-preview />');

    expect(element.find('esn-attachment-icon').length).to.equal(1);
  });

  it('should display attachment info', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      name: 'defaultAttachment.log',
      length: '102302'
    };

    var element = compileComponent('<esn-attachment-default-preview attachment = "attachment" />', scope);

    expect(element.find('.metadata').html()).to.contain('defaultAttachment.log');
    expect(element.find('.metadata').html()).to.contain('99.9KB');
  });
});
