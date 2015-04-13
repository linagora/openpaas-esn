'use strict';

var util = require('util');
var q = require('q');

var NOREPLY = 'noreply@mycompany.com';
var TEMPLATE = 'digest.daily';

function _prune(header, collaboration, message) {
  if (!message.read) {
    collaboration.unreadMessages++;
    header.total.unreadMessages++;
  }

  return {
    content: message.content,
    author: {
      id: message.author._id,
      firstname: message.author.firstname,
      lastname: message.author.lastname,
      displayName: util.format('%s %s', message.author.firstname, message.author.lastname),
      avatar: message.author.avatar,
      emails: message.author.emails
    },
    responses: message.responses.map(_prune.bind(null, header, collaboration)),
    published: message.published,
    objectType: message.objectType,
    weight: message.weight
  };
}

function _isUnread(message) {
  return !message.read;
}

function _hasUnreadResponses(message) {
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

function _buildContent(user, data) {
  var header = {
    domain: {
      name: user.domains[0].name,
      id: user.domains[0]._id
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
      id: element.collaboration._id,
      title: element.collaboration.title,
      avatar: element.collaboration.avatar,
      messages: [],
      unreadMessages: 0
    };

    collaboration.messages = element.messages
      .filter(_filterByUnread)
      .map(_calculUnreadMessagesAndPrune.bind(null, header, collaboration))
      .sort(_compareWeight)
      .slice(0, 2);
    content.push(collaboration);
  });

  return {
    subject: _buildSubject(header.total.unreadMessages, header.domain.name),
    header: header,
    content: content,
    footer: {}
  };
}

function process(dependencies, digest) {
  var contentSender = dependencies('content-sender');

  var user = digest.user;
  var data = digest.data;

  var from = { objectType: 'email', id: 'OpenPaaS <' + NOREPLY + '>' };
  var to = { objectType: 'email', id: user.emails[0] };

  var content = _buildContent(user, data);

  var options = {
    subject: content.subject,
    template: TEMPLATE,
    noreply: NOREPLY
  };

  return contentSender.send(from, to, content, options, 'email');
}

module.exports = function(dependencies) {
  return {
    process: process.bind(null, dependencies)
  };
};
