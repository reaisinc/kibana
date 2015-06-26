define(function (require) {
  var angular = require('angular');
  var _ = require('lodash');
  var $ = require('jquery');
  var L = require('leaflet');

  var sinon = require('test_utils/auto_release_sinon');
  var geoJsonData = require('vislib_fixtures/mock_data/geohash/_geo_json');

  // // Data
  // var dataArray = [
  //   ['geojson', require('vislib_fixtures/mock_data/geohash/_geo_json')],
  //   ['columns', require('vislib_fixtures/mock_data/geohash/_columns')],
  //   ['rows', require('vislib_fixtures/mock_data/geohash/_rows')],
  // ];

  // // TODO: Test the specific behavior of each these
  // var mapTypes = [
  //   'Scaled Circle Markers',
  //   'Shaded Circle Markers',
  //   'Shaded Geohash Grid',
  //   'Heatmap'
  // ];

  angular.module('MapFactory', ['kibana']);

  describe('TileMap Map', function () {
    this.timeout(0);
    var $mockMapEl = $('<div>');
    var Map;
    var leafletStubs = {};
    var leafletMocks = {};

    beforeEach(function () {
      module('MapFactory');
      inject(function (Private) {
        // mock parts of leaflet
        leafletMocks.tileLayer = { on: sinon.stub() };
        leafletMocks.map = { on: sinon.stub() };
        leafletStubs.tileLayer = sinon.stub(L, 'tileLayer', _.constant(leafletMocks.tileLayer));
        leafletStubs.map = sinon.stub(L, 'map', _.constant(leafletMocks.map));

        Map = Private(require('components/vislib/visualizations/_map'));
      });
    });

    describe('instantiation', function () {
      var map;
      var createStub;

      beforeEach(function () {
        createStub = sinon.stub(Map.prototype, '_createMap', _.noop);
        map = new Map($mockMapEl, geoJsonData, {});
      });

      it('should create the map', function () {
        expect(createStub.callCount).to.equal(1);
      });

      it('should add zoom controls', function () {
        var mapOptions = createStub.firstCall.args[0];

        expect(mapOptions).to.be.an('object');
        if (mapOptions.zoomControl) expect(mapOptions.zoomControl).to.be.ok();
        else expect(mapOptions.zoomControl).to.be(undefined);
      });
    });

    describe('createMap', function () {
      var map;
      var mapStubs;

      beforeEach(function () {
        mapStubs = {
          destroy: sinon.stub(Map.prototype, 'destroy'),
          attachEvents: sinon.stub(Map.prototype, '_attachEvents'),
          addMarkers: sinon.stub(Map.prototype, '_addMarkers'),
        };

        map = new Map($mockMapEl, geoJsonData, {});
      });

      it('should create the create leaflet objects', function () {
        expect(leafletStubs.tileLayer.callCount).to.equal(1);
        expect(leafletStubs.map.callCount).to.equal(1);

        var callArgs = leafletStubs.map.firstCall.args;
        var mapOptions = callArgs[1];
        expect(callArgs[0]).to.be($mockMapEl.get(0));
        expect(mapOptions).to.have.property('zoom');
        expect(mapOptions).to.have.property('center');
      });

      it('should attach events and add markers', function () {
        expect(mapStubs.attachEvents.callCount).to.equal(1);
        expect(mapStubs.addMarkers.callCount).to.equal(1);
      });

      it('should call destroy only if a map exists', function () {
        expect(mapStubs.destroy.callCount).to.equal(0);
        map._createMap({});
        expect(mapStubs.destroy.callCount).to.equal(1);
      });
    });

    describe('attach events', function () {
      var map;

      beforeEach(function () {
        sinon.stub(Map.prototype, '_createMap', function () {
          this._tileLayer = leafletMocks.tileLayer;
          this.map = leafletMocks.map;
          this._attachEvents();
        });
        map = new Map($mockMapEl, geoJsonData, {});
      });

      it('should attach interaction events', function () {
        var expectedTileEvents = ['tileload'];
        var expectedMapEvents = ['draw:created', 'moveend', 'zoomend', 'unload'];
        var matchedEvents = {
          tiles: 0,
          maps: 0,
        };

        _.times(leafletMocks.tileLayer.on.callCount, function (index) {
          var ev = leafletMocks.tileLayer.on.getCall(index).args[0];
          if (_.includes(expectedTileEvents, ev)) matchedEvents.tiles++;
        });
        expect(matchedEvents.tiles).to.equal(expectedTileEvents.length);

        _.times(leafletMocks.map.on.callCount, function (index) {
          var ev = leafletMocks.map.on.getCall(index).args[0];
          if (_.includes(expectedMapEvents, ev)) matchedEvents.maps++;
        });
        expect(matchedEvents.maps).to.equal(expectedMapEvents.length);
      });
    });
  });
});
