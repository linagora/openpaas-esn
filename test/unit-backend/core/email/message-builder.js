const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The message-builder module', function() {
  let messageBuilder, template, options, message, locals, from;

  beforeEach(function() {
    template = {};
    options = {
      defaultTemplatesDir: 'The default template path'
    };
    message = {};
    locals = {
      filter: true
    };
    from = 'from@mail.com';
  });

  describe('The buildWithEmailTemplates function', function() {
    it('should reject when something went wrong while getting the template generator', function(done) {
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const error = new Error('I am dead');
      const templateSpy = sinon.spy(function(template, callback) {
        callback(error);
      });

      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub
      });
      template.name = 'The template name';

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal(`Can not get the template generator: ${error.message}`);
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          done();
        });
    });

    it('should use template.name if template is an object', function(done) {
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const error = new Error('I am dead');
      const templateSpy = sinon.spy(function(template, callback) {
        callback(error);
      });

      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal(`Can not get the template generator: ${error.message}`);
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          done();
        });
    });

    it('should use template as template name if template is not an object', function(done) {
      const templateName = 'Some template name';
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const error = new Error('I am dead');
      const templateSpy = sinon.spy(function(template, callback) {
        callback(error);
      });

      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, templateName, locals)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal(`Can not get the template generator: ${error.message}`);
          expect(getTemplatesDirStub).to.have.been.calledWith(templateName, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          done();
        });
    });

    it('should call the template with right parameters and reject when there is an error while generating the template', function(done) {
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const error = new Error('I failed');
      const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
        return callback(error);
      });
      const templateSpy = sinon.spy(function(template, callback) {
        callback(null, templateFunctionSpy);
      });

      template.name = 'The template name';
      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal(`Template generation failed: ${error.message}`);
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
          done();
        });
    });

    it('should reject if attachments generation fails', function(done) {
      const html = '<body>The text</body>';
      const text = 'The text';
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const error = new Error('Attachment generation failed');
      const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
        return callback(null, html, text);
      });
      const hasAttachmentsStub = sinon.stub().returns(true);
      const getAttachmentsStub = sinon.stub().throws(error);
      const templateSpy = sinon.spy(function(template, callback) {
        callback(null, templateFunctionSpy);
      });

      template.name = 'The template name';
      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        hasAttachments: hasAttachmentsStub,
        getAttachments: getAttachmentsStub,
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(() => done(new Error('should not resolve')))
        .catch(err => {
          expect(err).to.exist;
          expect(err.message).to.equal(`Failed to get attachments: ${error.message}`);
          expect(hasAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
          expect(getAttachmentsStub).to.have.been.calledWith(templatePath, template.name, locals.filter);
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          done();
        });
    });

    it('should resolve without attachments if no attachments are defined for the template', function(done) {
      const html = '<body>The text</body>';
      const text = 'The text';
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
        return callback(null, html, text);
      });
      const hasAttachmentsStub = sinon.stub().returns(false);
      const templateSpy = sinon.spy(function(template, callback) {
        callback(null, templateFunctionSpy);
      });

      template.name = 'The template name';
      message.from = from;
      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        hasAttachments: hasAttachmentsStub,
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(result => {
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
          expect(hasAttachmentsStub).to.have.been.calledWith();
          expect(result).to.deep.equals({
            from: message.from,
            html: html,
            text: text
          });
          done();
        })
        .catch(err => done(err || new Error('should not resolve')));
    });

    it('should fill message with attachments', function(done) {
      const attachments = [1, 2, 3];
      const html = '<body>The text</body>';
      const text = 'The text';
      const templatePath = 'The template path';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const getAttachmentsStub = sinon.stub().returns(attachments);
      const templateFunctionSpy = sinon.spy(function(templateName, locals, callback) {
        return callback(null, html, text);
      });
      const hasAttachmentsStub = sinon.stub().returns(true);
      const templateSpy = sinon.spy(function(template, callback) {
        callback(null, templateFunctionSpy);
      });

      template.name = 'The template name';
      mockery.registerMock('email-templates', templateSpy);
      mockery.registerMock('./helpers', {
        hasAttachments: hasAttachmentsStub,
        getAttachments: getAttachmentsStub,
        getTemplatesDir: getTemplatesDirStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithEmailTemplates(message, template, locals)
        .then(function(result) {
          expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
          expect(templateSpy).to.have.been.calledWith(templatePath);
          expect(templateFunctionSpy).to.have.been.calledWith(template.name, locals);
          expect(getAttachmentsStub).to.have.been.calledWith(templatePath, template.name, locals.filter);
          expect(result).to.deep.equals({
            from: message.from,
            html: html,
            text: text,
            attachments: attachments
          });
          done();
        })
        .catch(err => done(err || new Error('should resolve')));
    });
  });
});
