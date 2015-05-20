'use strict';

var util = require('util');
var q = require('q');
var url = require('url');

var NOREPLY = 'noreply@openpaas.org';
var TEMPLATE = 'digest.daily';

function _prune(header, collaboration, message) {
  if (!message.read) {
    collaboration.unreadMessages++;
    header.total.unreadMessages++;
  }

  var result = {
    content: message.content,
    published: message.published,
    objectType: message.objectType,
    weight: message.weight,
    read: message.read
  };

  if (message.responses) {
    result.responses = message.responses.map(_prune.bind(null, header, collaboration));
  }

  if (message.author) {
    result.author = {
      id: message.author._id,
      firstname: message.author.firstname,
      lastname: message.author.lastname,
      displayName: util.format('%s %s', message.author.firstname, message.author.lastname),
      avatar: url.resolve(header.baseUrl, 'api/avatars?objectType=user&email=' + message.author.emails[0]),
      emails: message.author.emails
    };
  }

  return result;
}

function _isUnread(message) {
  return !message.read;
}

function _hasUnreadResponses(message) {
  if (!message.responses) {
    return false;
  }

  return message.responses.some(function(response) {
    return !response.read;
  });
}

function _filterByUnread(message) {
  return _isUnread(message) || _hasUnreadResponses(message);
}

function _calculUnreadMessagesAndPrune(header, collaboration, message) {
  return _prune(header, collaboration, message);
}

function _compareWeight(messageA, messageB) {
  return messageB.weight || 0 - messageA.weight || 0;
}

function _buildSubject(unreadMessages, domainName) {
  return util.format('There are %d new messages in your communities in %s', unreadMessages, domainName);
}

function _buildContent(user, data, baseUrl) {
  var header = {
    baseUrl: baseUrl,
    domain: {
      name: user.domains[0].domain_id.name,
      id: user.domains[0].domain_id._id
    },
    user: {
      displayName: util.format('%s %s', user.firstname, user.lastname),
      id: user._id
    },
    total: {
      unreadMessages: 0,
      unreadNotifications: 0
    }
  };

  var content = [];

  data.forEach(function(element) {
    var collaboration = {
      id: element.collaboration._id + '',
      title: element.collaboration.title,
      objectType: element.collaboration.objectType,
      messages: [],
      unreadMessages: 0
    };

    // TODO: remove this when the endpoint GET /api/collaboration/:objectType/:id will be available
    if (collaboration.objectType === 'community') {
      collaboration.link = url.resolve(header.baseUrl, '#/communities/' + collaboration.id);
    } else if (collaboration.objectType === 'project') {
      collaboration.link = url.resolve(header.baseUrl, '#/projects/' + collaboration.id);
    }

    collaboration.avatar = url.resolve(header.baseUrl, 'api/avatars?objectType=' + collaboration.objectType + '&id=' + collaboration.id);

    collaboration.messages = element.messages
      .filter(_filterByUnread)
      .map(_calculUnreadMessagesAndPrune.bind(null, header, collaboration))
      .sort(_compareWeight)
      .slice(0, 3);
    content.push(collaboration);
  });

  return {
    subject: _buildSubject(header.total.unreadMessages, header.domain.name),
    header: header,
    content: content,
    footer: {}
  };
}

function process(dependencies, user, digest) {
  var contentSender = dependencies('content-sender');
  var esnconfig = dependencies('esn-config');
  var staticConfig = dependencies('config')('default');

  function getMailConfig() {
    return q.ninvoke(esnconfig('mail'), 'get', 'mail');
  }

  function getBaseUrl() {
    return q.ninvoke(esnconfig('web'), 'get').then(function(web) {
      if (web && web.base_url) {
        return q(web.base_url);
      }
      var port = staticConfig.webserver.port || '8080';
      return q('http://localhost:' + port);
    });
  }

  return getMailConfig().then(function(mail) {
    return getBaseUrl().then(function(baseUrl) {

      var noreply = mail.noreply || NOREPLY;
      var from = { objectType: 'email', id: 'OpenPaaS <' + noreply + '>' };
      var to = { objectType: 'email', id: user.emails[0] };

      var content = _buildContent(user, digest, baseUrl);

      var options = {
        subject: content.subject,
        template: TEMPLATE,
        noreply: noreply
      };
      return contentSender.send(from, to, content, options, 'email');
    });
  });
}

module.exports = function(dependencies) {
  return {
    process: process.bind(null, dependencies)
  };
};
