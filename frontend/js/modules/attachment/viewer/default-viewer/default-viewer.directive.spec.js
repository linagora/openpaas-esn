'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnAttachmentDefaultViewer directive', function() {
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

  it('should display attachment default icon', function() {
    var element = compileDirective('<esn-attachment-default-viewer />');

    expect(element.find('esn-attachment-icon').length).to.equal(1);
  });

  it('should display attachment info', function() {
    var scope = $rootScope.$new();

    scope.attachment = {
      name: 'defaultAttachment.log',
      length: '102302'
    };

    var element = compileDirective('<esn-attachment-default-viewer attachment="attachment"/>', scope);

    expect(element.find('.right').html()).to.contain('defaultAttachment.log');
    expect(element.find('.right').html()).to.contain('99.9KB');
  });
});
