'use strict';

const showdown = require('showdown'),
  q = require('q'),
  ejs = require('ejs');

module.exports = dependencies => {
  const esnConfig = dependencies('esn-config');

  return {
    preProcess: renderMarkdownGuide,
    toHTML: markdownToHTML
  };

  /////

  function renderMarkdownGuide(user) {
    return markdown => esnConfig('autoconf').inModule('core').forUser(user).get()
      .then(config => {
        if (!config) {
          return q.reject(new Error('No autoconfiguration file configured in DB'));
        }

        return ejs.render(markdown, { user, config });
      });
  }

  function markdownToHTML(markdown) {
    const converter = new showdown.Converter();

    converter.setFlavor('github');

    return converter.makeHtml(markdown);
  }
};
