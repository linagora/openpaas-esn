const emailTemplates = require('email-templates');
const Q = require('q');
const { hasAttachments, getAttachments, getTemplatesDir } = require('./helpers');

module.exports = options => {
  return {
    buildWithEmailTemplates
  };

  function buildWithEmailTemplates(message, template, locals = {}) {
    const templatesDir = getTemplatesDir(template, options.defaultTemplatesDir);
    const templateName = template.name || template;
    const deferred = Q.defer();

    emailTemplates(templatesDir, (err, templateFn) => {
      if (err) {
        return deferred.reject(new Error(`Can not get the template generator: ${err.message}`));
      }

      locals.juiceOptions = { removeStyleTags: false };
      locals.pretty = true;

      templateFn(templateName, locals, (err, html, text) => {
        if (err) {
          return deferred.reject(new Error(`Template generation failed: ${err.message}`));
        }

        message.from = message.from || options.noreply;
        message.html = html;
        message.text = text;

        if (!hasAttachments(templatesDir, templateName)) {
          return deferred.resolve(message);
        }

        try {
          const attachments = getAttachments(templatesDir, templateName, locals.filter);

          message.attachments = Array.isArray(message.attachments) ? message.attachments.concat(attachments) : attachments;

          deferred.resolve(message);
        } catch (err) {
          deferred.reject(new Error(`Failed to get attachments: ${err.message}`));
        }
      });
    });

    return deferred.promise;
  }
};
