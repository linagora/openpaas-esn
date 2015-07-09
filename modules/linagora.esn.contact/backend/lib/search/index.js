'use strict';

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
    logger.debug('Indexing contact', contact);

    if (!contact) {
      return callback(new Error('Contact is required'));
    }

    elasticsearch.addDocumentToIndex(contact, {index: INDEX_NAME, type: TYPE_NAME, id: contact.id + ''}, callback);
  }

  function deleteContact(contact, callback) {
    logger.info('Deleting contact', contact);

    if (!contact) {
      return callback(new Error('Contact is required'));
    }

    elasticsearch.removeDocumentFromIndex({index: INDEX_NAME, type: TYPE_NAME, id: contact.id + ''}, callback);
  }

  function listen() {

    logger.info('Subscribing to contact updates for indexing');

    pubsub.topic(CONTACT_ADDED).subscribe(function(data) {
      indexContact(data, function(err) {
        if (err) {
          logger.error('Error while adding contact in index', err);
        }
      });
    });

    pubsub.topic(CONTACT_UPDATED).subscribe(function(data) {
      indexContact(data, function(err) {
        if (err) {
          logger.error('Error while updating contact in index', err);
        }
      });
    });

    pubsub.topic(CONTACT_DELETED).subscribe(function(data) {
      deleteContact(data, function(err) {
        if (err) {
          logger.error('Error while deleting contact from index', err);
        }
      });
    });
  }

  return {
    listen: listen,
    indexContact: indexContact,
    deleteContact: deleteContact
  };

};
