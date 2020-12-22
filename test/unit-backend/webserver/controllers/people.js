const mockery = require('mockery');
const sinon = require('sinon');
const { expect } = require('chai');

describe('The people controller', function() {
  describe('The search function', function() {
    let people, protocol, host, esnConfigStub, getConfig, json, req, res, search;

    beforeEach(function() {
      people = [
        { id: 1, objectType: 'user', photos: [{ url: '/foo/bar/1' }] },
        { id: 2, objectType: 'user', photos: [{ url: '/foo/bar/2' }] },
        { id: 3, objectType: 'user', photos: [{ url: '/foo/bar/3' }] },
        { id: 4, objectType: 'user', photos: [{ url: '/foo/bar/4' }] }
      ];
      host = 'localhost:3000';
      protocol = 'http';
      getConfig = sinon.stub();
      json = sinon.spy();
      res = { status: sinon.stub().returns({ json }) };
      search = sinon.stub();
      req = {
        query: {
          timeout: 2000 // 2 seconds
        },
        protocol,
        get: sinon.stub().returns(host),
        user: {
          emails: ['foo@bar.com']
        }
      };

      esnConfigStub = () => ({
        inModule: () => ({
          forUser: () => ({
            get: getConfig
          })
        })
      });
    });

    it('should HTTP 500 when search rejects ', function(done) {
      getConfig.returns(Promise.resolve({}));
      search.returns(Promise.reject(new Error('I failed')));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(res.status).to.have.been.calledWith(500);
          expect(json).to.have.been.calledWith({error: {code: 500, message: 'Server Error', details: 'Error while searching people'}});
          expect(getConfig).to.not.have.been.called;
          done();
        })
        .catch(done);
    });

    it('should HTTP 200 with denormalized persons and fallback avatar URL when esnConfig rejects', function(done) {
      getConfig.returns(Promise.reject(new Error('I failed to get config')));
      search.returns(Promise.resolve(people));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(res.status).to.have.been.calledWith(200);
          expect(getConfig).to.have.been.called.and.to.have.callCount(people.length);
          expect(json).to.have.been.called;
          expect(req.get).to.have.been.called;
          const args = json.getCall(0).args[0];

          expect(args).to.have.lengthOf(people.length);
          expect(args).to.have.deep.property('[0].photos[0].url', `${protocol}://${host}/foo/bar/1`);
          expect(args).to.have.deep.property('[1].photos[0].url', `${protocol}://${host}/foo/bar/2`);
          expect(args).to.have.deep.property('[2].photos[0].url', `${protocol}://${host}/foo/bar/3`);
          expect(args).to.have.deep.property('[3].photos[0].url', `${protocol}://${host}/foo/bar/4`);

          done();
        })
        .catch(done);
    });

    it('should HTTP 200 with denormalized persons and fallback avatar URL when esnConfig is undefined', function(done) {
      getConfig.returns(Promise.resolve());
      search.returns(Promise.resolve(people));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(res.status).to.have.been.calledWith(200);
          expect(getConfig).to.have.been.called.and.to.have.callCount(people.length);
          expect(json).to.have.been.called;
          expect(req.get).to.have.been.called;
          const args = json.getCall(0).args[0];

          expect(args).to.have.lengthOf(people.length);
          expect(args).to.have.deep.property('[0].photos[0].url', `${protocol}://${host}/foo/bar/1`);
          expect(args).to.have.deep.property('[1].photos[0].url', `${protocol}://${host}/foo/bar/2`);
          expect(args).to.have.deep.property('[2].photos[0].url', `${protocol}://${host}/foo/bar/3`);
          expect(args).to.have.deep.property('[3].photos[0].url', `${protocol}://${host}/foo/bar/4`);

          done();
        })
        .catch(done);
    });

    it('should HTTP 200 with denormalized persons and fallback avatar URL when esnConfig.base_url is undefined', function(done) {
      getConfig.returns(Promise.resolve({}));
      search.returns(Promise.resolve(people));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(res.status).to.have.been.calledWith(200);
          expect(getConfig).to.have.been.called.and.to.have.callCount(people.length);
          expect(json).to.have.been.called;
          expect(req.get).to.have.been.called;
          const args = json.getCall(0).args[0];

          expect(args).to.have.lengthOf(people.length);
          expect(args).to.have.deep.property('[0].photos[0].url', `${protocol}://${host}/foo/bar/1`);
          expect(args).to.have.deep.property('[1].photos[0].url', `${protocol}://${host}/foo/bar/2`);
          expect(args).to.have.deep.property('[2].photos[0].url', `${protocol}://${host}/foo/bar/3`);
          expect(args).to.have.deep.property('[3].photos[0].url', `${protocol}://${host}/foo/bar/4`);

          done();
        })
        .catch(done);
    });

    it('should HTTP 200 with denormalized persons and configured web URL', function(done) {
      const base_url = 'https://open-paas.org';

      getConfig.returns(Promise.resolve({ base_url }));
      search.returns(Promise.resolve(people));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(res.status).to.have.been.calledWith(200);
          expect(getConfig).to.have.been.called.and.to.have.callCount(people.length);
          expect(json).to.have.been.called;
          expect(req.get).to.not.have.been.called;
          const args = json.getCall(0).args[0];

          expect(args).to.have.lengthOf(people.length);
          expect(args).to.have.deep.property('[0].photos[0].url', `${base_url}/foo/bar/1`);
          expect(args).to.have.deep.property('[1].photos[0].url', `${base_url}/foo/bar/2`);
          expect(args).to.have.deep.property('[2].photos[0].url', `${base_url}/foo/bar/3`);
          expect(args).to.have.deep.property('[3].photos[0].url', `${base_url}/foo/bar/4`);

          done();
        })
        .catch(done);
    });

    it('should call the PeopleService.search with the specified timeout in the query', function(done) {
      getConfig.returns(Promise.resolve({}));
      search.returns(Promise.resolve(people));
      mockery.registerMock('../../core/people', { service: { search } });
      mockery.registerMock('../../core/esn-config', esnConfigStub);
      const peopleController = this.helpers.requireBackend('webserver/controllers/people');

      peopleController.search(req, res)
        .then(() => {
          expect(search).to.have.been.calledWith(sinon.match.any /* we just need to check the second argument */, 2000);
          done();
        })
        .catch(done);
    });
  });
});
