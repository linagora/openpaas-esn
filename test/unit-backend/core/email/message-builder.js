const path = require('path');
const mockery = require('mockery');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('The message-builder module', function() {
  let messageBuilder, template, options, message, locals, from;

  beforeEach(function() {
    template = {};
    options = {
      defaultTemplatesDir: '/default/templates/dir'
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

  describe('The buildWithCustomTemplateFunction function', function() {
    let templateFn;

    beforeEach(function() {
      templateFn = sinon.spy(html => html.replace('transform_this', 'transformed'));
    });

    it('should get the default noreply email as the sender when the message has no \'from\' email', function() {
      const templatePath = '/path/to/template';
      const untransformedHtml = '<p>whatever transform_this</p>';

      message.from = undefined;
      options.noreply = 'noreply@whatever.com';
      template.name = 'some.template.name';
      mockery.registerMock('./helpers', {
        getTemplatesDir: () => templatePath,
        hasAttachments: () => false
      });
      mockery.registerMock('pug', {
        renderFile: () => untransformedHtml
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithCustomTemplateFunction({
        message,
        template,
        templateFn
      });

      expect(message.from).to.equal(options.noreply);
    });

    it('should transform pug into html and then use the custom template function to transform it one more time', function() {
      const templatePath = '/path/to/template';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const untransformedHtml = '<p>whatever transform_this</p>';
      const pugRenderFileStub = sinon.stub().returns(untransformedHtml);
      const hasAttachmentsStub = sinon.stub().returns(false);

      template.name = 'some.template.name';
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub,
        hasAttachments: hasAttachmentsStub
      });
      mockery.registerMock('pug', {
        renderFile: pugRenderFileStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithCustomTemplateFunction({
        message,
        template,
        templateFn
      });

      expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
      expect(pugRenderFileStub).to.have.been.calledWith(path.resolve(templatePath, template.name, 'index.pug'), { cache: true });
      expect(templateFn).to.have.been.calledWith(untransformedHtml);
      expect(hasAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(message.html).to.equal('<p>whatever transformed</p>');
    });

    it('should get all the attachments in the templates directory if no filter is provided', function() {
      const templatePath = '/path/to/template';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const untransformedHtml = '<p>whatever transform_this</p>';
      const pugRenderFileStub = sinon.stub().returns(untransformedHtml);
      const hasAttachmentsStub = sinon.stub().returns(true);
      const attachments = ['attachment1.png', 'attachment2.png', 'attachment3.png'];
      const getAttachmentsStub = sinon.stub().returns(attachments);

      template.name = 'some.template.name';
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub,
        hasAttachments: hasAttachmentsStub,
        getAttachments: getAttachmentsStub
      });
      mockery.registerMock('pug', {
        renderFile: pugRenderFileStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithCustomTemplateFunction({
        message,
        template,
        templateFn
      });

      expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
      expect(pugRenderFileStub).to.have.been.calledWith(path.resolve(templatePath, template.name, 'index.pug'), { cache: true });
      expect(templateFn).to.have.been.calledWith(untransformedHtml);
      expect(hasAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(getAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(message.html).to.equal('<p>whatever transformed</p>');
      expect(message.attachments).to.deep.equal(attachments);
    });

    it('should get the filtered attachments in the templates directory if a filter is provided', function() {
      const templatePath = '/path/to/template';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const untransformedHtml = '<p>whatever transform_this</p>';
      const pugRenderFileStub = sinon.stub().returns(untransformedHtml);
      const hasAttachmentsStub = sinon.stub().returns(true);
      const attachments = ['attachment1.png', 'whatever.png', 'attachment2.png', 'attachment3.png', 'filtermeplease.png', 'svp.png'];
      const getAttachmentsSpy = sinon.spy(function(_, __, filter) {
        if (filter) return attachments.filter(filter);

        return attachments;
      });
      const locals = { filter: attachment => attachment.includes('attachment') };

      template.name = 'some.template.name';
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub,
        hasAttachments: hasAttachmentsStub,
        getAttachments: getAttachmentsSpy
      });
      mockery.registerMock('pug', {
        renderFile: pugRenderFileStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithCustomTemplateFunction({
        message,
        template,
        templateFn,
        locals
      });

      expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
      expect(pugRenderFileStub).to.have.been.calledWith(path.resolve(templatePath, template.name, 'index.pug'), { ...locals, cache: true });
      expect(templateFn).to.have.been.calledWith(untransformedHtml);
      expect(hasAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(getAttachmentsSpy).to.have.been.calledWith(templatePath, template.name, locals.filter);
      expect(message.html).to.equal('<p>whatever transformed</p>');
      expect(message.attachments).to.deep.equal(['attachment1.png', 'attachment2.png', 'attachment3.png']);
    });

    it('should append the attachments in the templates directory to the list of existing attachments in the message', function() {
      const templatePath = '/path/to/template';
      const getTemplatesDirStub = sinon.stub().returns(templatePath);
      const untransformedHtml = '<p>whatever transform_this</p>';
      const pugRenderFileStub = sinon.stub().returns(untransformedHtml);
      const hasAttachmentsStub = sinon.stub().returns(true);
      const existingAttachments = ['existing1.png', 'existing2.png'];
      const attachments = ['attachment1.png', 'attachment2.png', 'attachment3.png'];
      const getAttachmentsStub = sinon.stub().returns(attachments);

      template.name = 'some.template.name';
      message.attachments = existingAttachments;
      mockery.registerMock('./helpers', {
        getTemplatesDir: getTemplatesDirStub,
        hasAttachments: hasAttachmentsStub,
        getAttachments: getAttachmentsStub
      });
      mockery.registerMock('pug', {
        renderFile: pugRenderFileStub
      });

      messageBuilder = this.helpers.requireBackend('core/email/message-builder');
      messageBuilder(options).buildWithCustomTemplateFunction({
        message,
        template,
        templateFn
      });

      expect(getTemplatesDirStub).to.have.been.calledWith(template, options.defaultTemplatesDir);
      expect(pugRenderFileStub).to.have.been.calledWith(path.resolve(templatePath, template.name, 'index.pug'), { cache: true });
      expect(templateFn).to.have.been.calledWith(untransformedHtml);
      expect(hasAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(getAttachmentsStub).to.have.been.calledWith(templatePath, template.name);
      expect(message.html).to.equal('<p>whatever transformed</p>');
      expect(message.attachments).to.deep.equal(existingAttachments.concat(attachments));
    });
  });
});
