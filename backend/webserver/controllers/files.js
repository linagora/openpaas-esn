const filestore = require('../../core/filestore');
const Busboy = require('busboy');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = {
  create,
  get,
  remove
};

function create(req, res) {
  const size = parseInt(req.query.size, 10);

  if (isNaN(size) || size < 1) {
    return res.status(400).json({
      error: 400,
      message: 'Bad Parameter',
      details: 'size parameter should be a positive integer'
    });
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
    let nb = 0;
    const busboy = new Busboy({ headers: req.headers });

    busboy.once('file', (fieldname, file) => {
      nb++;
      saveStream(file);
    });

    busboy.on('finish', () => {
      if (nb === 0) {
        res.status(400).json({
          error: {
            code: 400,
            message: 'Bad request',
            details: 'The form data must contain an attachment'
          }
        });
      }
    });

    req.pipe(busboy);

  } else {
    saveStream(req);
  }

  function saveStream(stream) {
    let interrupted = false;

    req.on('close', function() {
      interrupted = true;
    });

    return filestore.store(fileId, req.query.mimetype, metadata, stream, options, (err, saved) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: 500,
            message: 'Server error',
            details: err.message || err
          }
        });
      }

      if (saved.length !== size || interrupted) {
        return filestore.delete(fileId, () => {
          res.status(412).json({
            error: {
              code: 412,
              message: 'File size mismatch',
              details: 'File size given by user agent is ' + size +
              ' and file size returned by storage system is ' +
              saved.length
            }
          });
        });
      }

      res.status(201).json({ _id: fileId });
    });
  }
}

function get(req, res) {
  if (!req.params.id) {
    return res.status(400).json({
      error: 400,
      message: 'Bad Request',
      details: 'Missing id parameter'
    });
  }

  filestore.get(req.params.id, (err, fileMeta, readStream) => {
    if (err) {
      return res.status(503).json({
        error: 503,
        message: 'Server error',
        details: err.message || err
      });
    }

    if (!readStream) {
      if (req.accepts('html')) {
        res.status(404).end();
        res.render('commons/404', { url: req.url });
      } else {
        res.status(404).json({
          error: 404,
          message: 'Not Found',
          details: 'Could not find file'
        });
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
        return res.status(500).json({
          error: 500,
          message: 'Server error',
          details: error.message || error
        });
      }
    }

    res.status(200);
    readStream.pipe(res);
  });
}

function remove(req, res) {
  if (!req.params.id) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Missing id parameter'}});
  }
  const meta = req.fileMeta;

  if (meta.metadata.referenced) {
    return res.status(409).json({error: {code: 409, message: 'Conflict', details: 'File is used and can not be deleted'}});
  }

  filestore.delete(req.params.id, err => {
    if (err) {
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message || err}});
    }

    res.status(204).end();
  });
}
