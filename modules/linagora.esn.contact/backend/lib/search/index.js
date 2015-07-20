'use strict';

var denormalize = require('./denormalize');

var CONTACT_ADDED = 'contacts:contact:add';
var CONTACT_UPDATED = 'contacts:contact:update';
var CONTACT_DELETED = 'contacts:contact:delete';

var INDEX_NAME = 'contacts.idx';
var TYPE_NAME = 'contacts';

module.exports = function(dependencies) {

  var pubsub = dependencies('pubsub').local;
  var logger = dependencies('logger');
  var elasticsearch = dependencies('elasticsearch');

  function indexContact(contact, callback) {
    logger.debug('Indexing contact into elasticseach', contact);

    if (!contact) {
      return callback(new Error('Contact is required'));
    }

    elasticsearch.addDocumentToIndex(denormalize(contact), {index: INDEX_NAME, type: TYPE_NAME, id: contact.id + ''}, callback);
  }

  function removeContactFromIndex(contact, callback) {
    logger.info('Removing contact from index', contact);

    if (!contact) {
      return callback(new Error('Contact is required'));
    }

    elasticsearch.removeDocumentFromIndex({index: INDEX_NAME, type: TYPE_NAME, id: contact.id + ''}, callback);
  }

  function listen() {

    logger.info('Subscribing to contact updates for indexing');

    pubsub.topic(CONTACT_ADDED).subscribe(function(data) {
      var contact = data;
      contact.id = data.contactId;

      indexContact(contact, function(err) {
        if (err) {
          logger.error('Error while adding contact in index', err);
        }
      });
    });

    pubsub.topic(CONTACT_UPDATED).subscribe(function(data) {
      var contact = data;
      contact.id = data.contactId;

      indexContact(contact, function(err) {
        if (err) {
          logger.error('Error while updating contact in index', err);
        }
      });
    });

    pubsub.topic(CONTACT_DELETED).subscribe(function(data) {
      removeContactFromIndex({id: data.contactId}, function(err) {
        if (err) {
          logger.error('Error while deleting contact from index', err);
        }
      });
    });
  }

  return {
    listen: listen,
    indexContact: indexContact,
    removeContactFromIndex: removeContactFromIndex
  };

};
