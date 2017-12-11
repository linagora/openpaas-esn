'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnTemplate provider', function() {
  var esnTemplate, template;

  beforeEach(function() {
    module('esn.template');

    template = 'template';

    inject(function(_esnTemplate_) {
      esnTemplate = _esnTemplate_;
    });
  });

  describe('The setLoadingTemplate function', function() {
    it('should set loading template', function() {
      esnTemplate.setLoadingTemplate(template);

      expect(esnTemplate.templates.loading).to.equal(template);
    });
  });

  describe('The setErrorTemplate function', function() {
    it('should set error template', function() {
      esnTemplate.setErrorTemplate(template);

      expect(esnTemplate.templates.error).to.equal(template);
    });
  });

  describe('The setSuccessTemplate function', function() {
    it('should set success template', function() {
      esnTemplate.setSuccessTemplate(template);

      expect(esnTemplate.templates.success).to.equal(template);
    });
  });
});
