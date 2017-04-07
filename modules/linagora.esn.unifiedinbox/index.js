'use strict';

var AwesomeModule = require('awesome-module');
var Dependency = AwesomeModule.AwesomeModuleDependency;
var path = require('path');

const angularAppFiles = [
  'components/sidebar/attachment/sidebar-attachment.component.js',
  'components/sidebar/attachment/sidebar-attachment.controller.js',
  'components/sidebar/attachment-button/sidebar-attachment-button.component.js',
  'components/message-body/message-body.js',
  'components/message-body/html/message-body-html.js',
  'components/message-body/html/message-body-html.controller.js',
  'components/message-body/text/message-body-text.js',
  'services/mailboxes/mailboxes-service.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.js',
  'components/list/group-toggle-selection/list-group-toggle-selection.controller.js',
  'components/subheader/more-button/subheader-more-button.js',
  'components/subheader/delete-button/subheader-delete-button.js',
  'components/subheader/mark-as-read-button/subheader-mark-as-read-button.js',
  'components/subheader/mark-as-unread-button/subheader-mark-as-unread-button.js',
  'services/models/emailer.run.js',
  'services/models/mailbox.run.js',
  'filters/filter-descendant-mailboxes.js',
  'services/models/make-selectable.js',
  'services/models/message.run.js',
  'services/models/thread.run.js',
  'services/plugins/plugins.js',
  'services/plugins/jmap/jmap-plugin.run.js',
  'services/plugins/twitter/twitter-plugin.run.js',
  'services/filtered-list/filtered-list.js',
  'components/identities/identities.js',
  'components/identities/identities.controller.js',
  'components/identities/subheader/identities-subheader.js',
  'components/identity/identity.js',
  'components/identity/identity.controller.js',
  'components/identity/form/identity-form.js',
  'components/identity/form/identity-form.controller.js',
  'components/identity/form/subheader/identity-form-subheader.js',
  'services/identities/identities-service.js',
  'services/jmap-helper/jmap-helper.js',
  'filters/quote/quote.js',
  'services/jmap-item/jmap-item-service.js'
];

const angularJsFiles = [
  'app.js',
  'constants.js',
  'controllers.js',
  'services.js',
  'filters.js',
  'providers.js',
  'directives/main.js',
  'directives/subheaders.js',
  'directives/lists.js',
  'directives/sidebar.js'
];

const FRONTEND_JS_PATH = path.join(__dirname, 'frontend');

var unifiedInboxModule = new AwesomeModule('linagora.esn.unifiedinbox', {
  dependencies: [
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.logger', 'logger'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.esn-config', 'esn-config'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.email', 'email'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.i18n', 'i18n'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.wrapper', 'webserver-wrapper'),
    new Dependency(Dependency.TYPE_NAME, 'linagora.esn.core.webserver.middleware.authorization', 'authorizationMW')
  ],
  states: {
    lib: function(dependencies, callback) {
      var inbox = require('./backend/webserver/api/inbox/router')(dependencies);
      var twitter = require('./backend/webserver/api/twitter/router')(dependencies);

      var lib = {
        api: {
          inbox: inbox,
          twitter: twitter
        }
      };

      return callback(null, lib);
    },

    deploy: function(dependencies, callback) {
      var app = require('./backend/webserver/application')(dependencies),
          webserverWrapper = dependencies('webserver-wrapper');

      webserverWrapper.injectAngularModules('unifiedinbox', angularJsFiles, 'linagora.esn.unifiedinbox', ['esn'], {
        localJsFiles: angularJsFiles.map(file => path.join(FRONTEND_JS_PATH, 'js', file))
      });

      webserverWrapper.injectAngularAppModules('unifiedinbox', angularAppFiles, 'linagora.esn.unifiedinbox', ['esn'], {
        localJsFiles: angularAppFiles.map(file => path.join(FRONTEND_JS_PATH, 'app', file))
      });

      webserverWrapper.injectLess('unifiedinbox', [
        path.resolve(__dirname, './frontend/app/inbox.less')
      ], 'esn');

      webserverWrapper.addApp('unifiedinbox', app);

      return callback();
    },

    start: function(dependencies, callback) {
      var config = require('./backend/lib/config')(dependencies);

      config.register();
      callback();
    }
  }
});

module.exports = unifiedInboxModule;
