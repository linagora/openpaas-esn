'use strict';

var denormalize = require('./denormalize');

var CONTACT_ADDED = 'contacts:contact:add';
var CONTACT_UPDATED = 'contacts:contact:update';
var CONTACT_DELETED = 'contacts:contact:delete';

var INDEX_NAME = 'contacts.idx';
var TYPE_NAME = 'contacts';

var DEFAULT_LIMIT = 20;

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

  function searchContacts(query, callback) {
    var terms = query.search;
    var page = query.page || 1;
    var offset = query.offset;
    var limit = query.limit || DEFAULT_LIMIT;

    var filters = [];
    if (query.userId) {
      filters.push({
        term: {
          'userId': query.userId
        }
      });
    }

    if (query.bookId) {
      filters.push({
        term: {
          'bookId': query.bookId
        }
      });
    }

    var elasticsearchQuery = {
      sort: [
        {'fn.sort': 'asc'}
      ],
      query: {
        filtered: {
          query: {
            multi_match: {
              query: terms,
              type: 'cross_fields',
              fields: ['fn', 'name', 'firstName', 'lastName', 'tel.value', 'job', 'tags.text', 'birthday', 'comments', 'emails.value', 'urls.value', 'org', 'socialprofiles.value', 'nickname', 'addresses.full'],
              operator: 'and'
            }
          }
        }
      }
    };
    if (filters.length) {
      elasticsearchQuery.query.filtered.filter = {
        and: filters
      };
    }
    if (!offset) {
      offset = (page - 1) * limit;
    }

    logger.debug('Searching contacts with options', {
      userId: query.userId,
      bookId: query.bookId,
      search: terms,
      page: page,
      offset: offset,
      limit: limit
    });

    elasticsearch.searchDocuments({
      index: INDEX_NAME,
      type: TYPE_NAME,
      from: offset,
      size: limit,
      body: elasticsearchQuery
    },function(err, result) {
      if (err) {
        return callback(err);
      }
      return callback(null, {
        current_page: page,
        total_count: result.hits.total,
        list: result.hits.hits
      });
    });
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
    searchContacts: searchContacts,
    indexContact: indexContact,
    removeContactFromIndex: removeContactFromIndex
  };

};
