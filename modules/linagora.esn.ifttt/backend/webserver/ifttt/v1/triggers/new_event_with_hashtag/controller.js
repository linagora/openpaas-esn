'use strict';

const q = require('q'),
      moment = require('moment');

module.exports = dependencies => {
  const calendarSearch = dependencies('calendar').search;

  return {
    newEventWithHashtag
  };

  /////

  function newEventWithHashtag(req, res) {
    var fields = req.body.triggerFields;

    if (!fields || !fields.hashtag) {
      return res.status(400).json({ errors: [{ message: 'Missing or invalid "hashtag" trigger field' }]});
    }

    var limit = 'limit' in req.body ? +req.body.limit : 50,
        query = {
          userId: req.user.id,
          search: '#' + fields.hashtag,
          limit: limit,
          sortKey: 'dtstamp'
        };

    q.ninvoke(calendarSearch, 'searchEvents', query)
      .then(
        results => res.status(200).json(_resultsToIFTTTData(results, fields.hashtag)),
        err => {
          console.log(err);
          res.status(500).json({ errors: [{ message: err.message }]});
        }
      );
  }

  function _resultsToIFTTTData(results, hashtag) {
    return {
      data: results.list.map(result => {
        const event = result._source;

        return {
          meta: {
            id: event.uid,
            timestamp: moment(event.dtstamp).unix()
          },
          created_at: event.dtstamp,
          event_title: event.summary,
          event_description: event.description,
          event_hashtag: hashtag,
          event_start_date: event.start,
          event_end_date: event.end
        };
      })
    };
  }
};
