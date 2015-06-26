'use strict';

var DELETE_DELAY = 10000;

module.exports = function(dependencies) {

  var logger = dependencies('logger');
  var grace = dependencies('graceperiod');
  var contact = dependencies('contact');

  function remove(req, res) {
    var contactId = req.params.contactId;
    var bookId = req.params.bookId;
    logger.debug('Got a contact delete on bookId %s: %s', bookId, contactId);

    var context = {};
    var delay = DELETE_DELAY;

    function deleteContact(context, callback) {
      return contact.actions.delete({
        bookId: bookId,
        contactId: contactId,
        delay: delay,
        userId: req.user._id
      }, callback);
    }

    function onComplete(err, result) {
      logger.debug('Task has been completed');
      if (err) {
        logger.error('Error while deleting the contact', err);
      }
      if (result) {
        logger.error('DELETE result', result);
      }
    }

    function onCancel() {
      logger.info('Task has been aborted');
    }

    grace.create(deleteContact, delay, context, onComplete, onCancel).then(function(task) {
      logger.info('Task %s has been created to delete contact %s', task.id, contactId);
      res.set('x-esn-task-id', task.id);
      return res.json(202, {id: task.id, delay: delay});
    }, function(err) {
      logger.error('Error while creating deferred task', err);
      return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not get create deferred task'}});
    });
  }

  return {
    remove: remove
  };

};
