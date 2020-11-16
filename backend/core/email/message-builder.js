const emailTemplates = require('email-templates');
const Q = require('q');
const attachmentHelpers = require('./attachment-helpers');

module.exports = options => {
  return build;

  function build(message, template, locals = {}) {
    const templatesDir = getTemplatesDir(template);
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

        if (attachmentHelpers.hasAttachments(templatesDir, templateName)) {
          attachmentHelpers.getAttachments(templatesDir, templateName, locals.filter, (err, attachments) => {
            if (err) {
              return deferred.reject(new Error(`Failed to get attachments: ${err.message}`));
            }

            if (Array.isArray(message.attachments)) {
              message.attachments = message.attachments.concat(attachments);
            } else {
              message.attachments = attachments;
            }

            return deferred.resolve(message);
          });
        } else {
          deferred.resolve(message);
        }
      });
    });

    return deferred.promise;
  }

  function getTemplatesDir(template) {
    return (template && template.path) ? template.path : options.defaultTemplatesDir;
  }
};
