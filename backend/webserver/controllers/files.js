const Busboy = require('busboy');
const ObjectId = require('mongoose').Types.ObjectId;

const filestore = require('../../core/filestore');
const logger = require('../../core/logger');

module.exports = {
  create,
  get,
  remove
};

function create(req, res) {
  const size = parseInt(req.query.size, 10);

  if (isNaN(size) || size < 1) {
    return res.status(400).json({ error: { code: 400, message: 'Bad Parameter', details: 'size parameter should be a positive integer' }});
  }

  const fileId = new ObjectId();
  const options = {};
  const metadata = {};

  if (req.query.name) {
    options.filename = req.query.name;
  }

  if (req.user) {
    metadata.creator = { objectType: 'user', id: req.user._id };
  }

  if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data') === 0) {
    return onMultipartFormRequest();
  }

  saveStream(req);

  function onMultipartFormRequest() {
    const busboy = new Busboy({ headers: req.headers });
    let nb = 0;

    busboy.once('file', (fieldname, file) => {
      logger.debug(`Saving file from '${fieldname}'`);
      nb++;
      saveStream(file);
    });

    busboy.on('finish', () => {
      logger.debug(`${nb} file(s) have been saved`);
      if (nb === 0) {
        res.status(400).json({ error: { code: 400, message: 'Bad request', details: 'The form data must contain an attachment' } });
      }
    });

    busboy.on('filesLimit', err => {
      logger.warning('File limit has been reached', err);
    });

    req.pipe(busboy);
  }

  function saveStream(stream) {
    let interrupted = false;

    req.on('close', function() {
      interrupted = true;
    });

    logger.debug(`Storing file fileId=${fileId}, mime=${req.query.mimetype}, metadata=${metadata}`);
    filestore.store(fileId, req.query.mimetype, metadata, stream, options, (err, saved) => {
      if (err) {
        logger.error('Can not store file', err);

        return res.status(500).json({ error: { code: 500, message: 'Server error', details: err.message || err } });
      }

      if (saved.length !== size || interrupted) {
        logger.error(`Error while storing file: saved.length=${saved.length}, size=${size}, interrupted=${interrupted}`);

        return filestore.delete(fileId, () => {
          res.status(412).json({ error: { code: 412, message: 'File size mismatch', details: `File size given by user agent is ${size} and file size returned by storage system is ${saved.length}` }});
        });
      }

      res.status(201).json({ _id: fileId });
    });
  }
}

function get(req, res) {
  if (!req.params.id) {
    return res.status(400).json({ error: { code: 400, message: 'Bad Request', details: 'Missing id parameter' }});
  }

  filestore.get(req.params.id, (err, fileMeta, readStream) => {
    if (err) {
      return res.status(503).json({ error: { code: 503, message: 'Server error', details: err.message || err }});
    }

    if (!readStream) {
      if (req.accepts('html')) {
        res.status(404).end();
        res.render('commons/404', { url: req.url });
      } else {
        res.status(404).json({ error: { code: 404, message: 'Not Found', details: 'Could not find file' }});
      }
    }

    if (fileMeta) {
      const modSince = req.get('If-Modified-Since');
      const clientMod = new Date(modSince);
      const serverMod = fileMeta.uploadDate;

      clientMod.setMilliseconds(0);
      serverMod.setMilliseconds(0);

      try {
        if (modSince && clientMod.getTime() === serverMod.getTime()) {
          return res.status(304).end();
        }

        res.set('Last-Modified', fileMeta.uploadDate);
        res.type(fileMeta.contentType);

        if (fileMeta.filename) {
          res.set('Content-Disposition', 'inline; filename="' +
          fileMeta.filename.replace(/[^!#$%&'*+\-.^_`|~\d\w]/g, '') + '"');
        }

        if (fileMeta.length) {
          res.set('Content-Length', fileMeta.length);
        }
      } catch (error) {
        return res.status(500).json({ error: { code: 500, message: 'Server error', details: error.message || error }});
      }
    }

    res.status(200);
    readStream.pipe(res);
  });
}

function remove(req, res) {
  if (!req.params.id) {
    return res.status(400).json({error: { code: 400, message: 'Bad request', details: 'Missing id parameter' }});
  }
  const meta = req.fileMeta;

  if (meta.metadata.referenced) {
    return res.status(409).json({error: { code: 409, message: 'Conflict', details: 'File is used and can not be deleted' }});
  }

  filestore.delete(req.params.id, err => {
    if (err) {
      logger.error('Can not delete file from store', err);

      return res.status(500).json({error: { code: 500, message: 'Server Error', details: err.message || err }});
    }

    res.status(204).end();
  });
}
