const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The message-builder module', function() {
  let messageBuilder, template, options, message, locals, from;

  beforeEach(function() {
    template = {};
    options = {};
    message = {};
    locals = {
      filter: true
    };
    from = 'from@mail.com';
  });

  it('should use the template.path if defined', function(done) {
    const templateSpy = sinon.spy(function(template, callback) {
      callback(new Error());
    });

    template.path = 'The template path';
    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function() {
      expect(templateSpy).to.have.been.calledWith(template.path);
      done();
    });
  });

  it('should use defaultTemplatePath if template.path is not defined', function(done) {
    const templateSpy = sinon.spy(function(template, callback) {
      callback(new Error());
    });

    options.defaultTemplatesDir = 'The default template path';
    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function() {
      expect(templateSpy).to.have.been.calledWith(options.defaultTemplatesDir);
      done();
    });
  });

  it('should use template.name if template is an object', function(done) {
    const templateSpy = sinon.spy(function(template, callback) {
      callback(new Error());
    });

    options.defaultTemplatesDir = 'The default template path';
    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function() {
      expect(templateSpy).to.have.been.calledWith(options.defaultTemplatesDir);
      done();
    });
  });

  it('should use template as template name if template is not an object', function(done) {
    const templateName = 'The template name';
    const templateSpy = sinon.spy(function(template, callback) {
      callback(new Error());
    });

    options.defaultTemplatesDir = 'The default template path';
    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, templateName, locals).then(done, function() {
      expect(templateSpy).to.have.been.calledWith(options.defaultTemplatesDir);
      done();
    });
  });

  it('should reject if email-templates send back error', function(done) {
    const error = new Error('I failed to get the template');
    const templateSpy = sinon.spy(function(template, callback) {
      callback(error);
    });

    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function(err) {
      expect(err.message).to.match(/Can not get the template generator/);
      done();
    });
  });

  it('should call the template with right parameters', function(done) {
    const error = new Error('I failed');
    const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
      return callback(error);
    });
    const templateSpy = sinon.spy(function(template, callback) {
      callback(null, templateFunctionSpy);
    });

    template.name = 'The template name';
    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function() {
      expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
      done();
    });
  });

  it('should reject if template generation fails', function(done) {
    const error = new Error('I failed');
    const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
      return callback(error);
    });
    const templateSpy = sinon.spy(function(template, callback) {
      callback(null, templateFunctionSpy);
    });

    mockery.registerMock('email-templates', templateSpy);

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function(err) {
      expect(err.message).to.match(/Template generation failed/);
      done();
    });
  });

  it('should reject if attachments generation fails', function(done) {
    const html = '<body>The text</body>';
    const text = 'The text';
    const error = new Error('Attachment generation failed');
    const getAttachmentsSpy = sinon.spy(function(templatesDir, templateName, filter, callback) {
      callback(error);
    });
    const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
      return callback(null, html, text);
    });
    const templateSpy = sinon.spy(function(template, callback) {
      callback(null, templateFunctionSpy);
    });

    mockery.registerMock('email-templates', templateSpy);
    mockery.registerMock('./attachment-helpers', {
      hasAttachments: function() {
        return true;
      },
      getAttachments: getAttachmentsSpy
    });

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(done, function(err) {
      expect(err.message).to.match(/Failed to get attachments/);
      done();
    });
  });

  it('should resolve without attachments if no attachments are defined for the template', function(done) {
    const html = '<body>The text</body>';
    const text = 'The text';
    const getAttachmentsSpy = sinon.spy();
    const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
      return callback(null, html, text);
    });
    const templateSpy = sinon.spy(function(template, callback) {
      callback(null, templateFunctionSpy);
    });

    template.name = 'The template name';
    message.from = from;
    mockery.registerMock('email-templates', templateSpy);
    mockery.registerMock('./attachment-helpers', {
      hasAttachments: function() {
        return false;
      },
      getAttachments: getAttachmentsSpy
    });

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(function(result) {
      expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
      expect(getAttachmentsSpy).to.not.have.been.called;
      expect(result).to.deep.equals({
        from: message.from,
        html: html,
        text: text
      });
      done();
    }, done);
  });

  it('should fill message with attachments', function(done) {
    const attachments = [1, 2, 3];
    const html = '<body>The text</body>';
    const text = 'The text';
    const getAttachmentsSpy = sinon.spy(function(templatesDir, templateName, filter, callback) {
      callback(null, attachments);
    });
    const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
      return callback(null, html, text);
    });
    const templateSpy = sinon.spy(function(template, callback) {
      callback(null, templateFunctionSpy);
    });

    template.name = 'The template name';
    mockery.registerMock('email-templates', templateSpy);
    mockery.registerMock('./attachment-helpers', {
      hasAttachments: function() {
        return true;
      },
      getAttachments: getAttachmentsSpy
    });

    messageBuilder = this.helpers.requireBackend('core/email/message-builder');
    messageBuilder(options)(message, template, locals).then(function(result) {
      expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
      expect(getAttachmentsSpy).to.have.been.calledWith(template.path, template.name, locals.filter);
      expect(result).to.deep.equals({
        from: message.from,
        html: html,
        text: text,
        attachments: attachments
      });
      done();
    }, done);
  });
});
