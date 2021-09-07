'use strict';

const q = require('q');
const PATH = 'addressbooks';

module.exports = function(dependencies) {
  const logger = dependencies('logger');
  const contactModule = dependencies('contact');
  const proxy = require('../proxy')(dependencies)(PATH);
  const avatarHelper = require('./avatarHelper')(dependencies);

  return {
    defaultHandler,
    searchContacts
  };

  function getContactUrl(davserver, bookHome, bookName, contactId) {
    return [davserver, '/', PATH, '/', bookHome, '/', bookName, '/', contactId, '.vcf'].join('');
  }

  function defaultHandler(req, res) {
    logger.warn('DAV-PROXY: the dav-proxy is deprecated, you should establish a direct connection to the DAV server instead.');
    proxy.handle()(req, res);
  }

  function searchContacts(req, res) {
    const options = {
      user: req.user,
      search: req.query.search,
      limit: req.query.limit,
      page: req.query.page,
      addressbooks: req.query.bookName ? [{
        bookHome: req.params.bookHome,
        bookNames: req.query.bookName.split(',')
      }] : [],
      ESNToken: req.token && req.token.token ? req.token.token : '',
      davserver: req.davserver,
      originalUrl: req.originalUrl
    };

    return _searchContacts(options)
      .then(result => {
        res.header('X-ESN-Items-Count', result.total_count);

        return res.status(200).json(result.data);
      })
      .catch(err => {
        const details = 'Error while searching contacts';

        logger.error(details, err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details
          }
        });
      });
  }

  function _searchContacts(options) {
    const clientOptions = {
      ESNToken: options.ESNToken,
      davserver: options.davserver
    };

    return contactModule.lib.client(clientOptions)
      .searchContacts(options)
      .then(result => {
        const data = {
          _links: {
            self: {
              href: options.originalUrl
            }
          },
          _total_hits: result.total_count,
          _current_page: `${result.current_page}`,
          _embedded: {
            'dav:item': []
          }
        };

        return q.all(result.results.map((result, index) => {
          if (!result.body) {
            return;
          }

          return avatarHelper.injectTextAvatar(options.user, result.bookId, result.bookName, result.body)
            .then(newVcard => {
              data._embedded['dav:item'][index] = {
                _links: {
                  self: {
                    href: getContactUrl(options.davserver, result.bookId, result.bookName, result.contactId)
                  }
                },
                data: newVcard,
                'openpaas:addressbook': result['openpaas:addressbook']
              };
            });
        })).then(() => ({
          total_count: result.total_count,
          data
        }));
      });
  }
};
