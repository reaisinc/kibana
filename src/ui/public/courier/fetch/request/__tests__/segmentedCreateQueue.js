describe('ui/courier/fetch/request/segmented/_createQueue', () => {
  const sinon = require('auto-release-sinon');
  const expect = require('expect.js');
  const ngMock = require('ngMock');

  let Promise;
  let $rootScope;
  let SegmentedReq;
  let MockSource;

  require('testUtils/noDigestPromises').activateForSuite();

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject((Private, $injector) => {
    Promise = $injector.get('Promise');
    $rootScope = $injector.get('$rootScope');
    SegmentedReq = Private(require('ui/courier/fetch/request/segmented'));

    const StubbedSearchSourceProvider = require('fixtures/stubbed_search_source');
    MockSource = class {
      constructor() {
        return $injector.invoke(StubbedSearchSourceProvider);
      }
    };
  }));

  it('manages the req._queueCreated flag', async function () {
    const req = new SegmentedReq(new MockSource());
    req._queueCreated = null;

    var promise = req._createQueue();
    expect(req._queueCreated).to.be(false);
    await promise;
    expect(req._queueCreated).to.be(true);
  });

  it('relies on indexPattern.toIndexList to generate queue', async function () {
    const source = new MockSource();
    const ip = source.get('index');
    const indices = [1,2,3];
    sinon.stub(ip, 'toIndexList').returns(Promise.resolve(indices));

    const req = new SegmentedReq(source);
    const output = await req._createQueue();
    expect(output).to.equal(indices);
  });

  it(`tells the index pattern it's direction`, async function () {
    const source = new MockSource();
    const ip = source.get('index');
    const req = new SegmentedReq(source);
    sinon.stub(ip, 'toIndexList').returns(Promise.resolve([1,2,3]));

    req.setDirection('asc');
    await req._createQueue();
    expect(ip.toIndexList.lastCall.args[2]).to.be('asc');

    req.setDirection('desc');
    await req._createQueue();
    expect(ip.toIndexList.lastCall.args[2]).to.be('desc');
  });
});
