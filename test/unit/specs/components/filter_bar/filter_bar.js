define(function (require) {
  var angular = require('angular');
  var _ = require('lodash');
  var sinon = require('sinon/sinon');
  var $ = require('jquery');

  require('components/filter_bar/filter_bar');
  var MockState = require('fixtures/mock_state');

  describe('Filter Bar Directive', function () {
    var $rootScope, $compile, $timeout, Promise;
    var appState, queryFilter, mapFilter, getIndexPatternStub, indexPattern, $el;
    // require('test_utils/no_digest_promises').activateForSuite();

    beforeEach(function () {
      appState = new MockState({ filters: [] });

      module('kibana/global_state', function ($provide) {
        $provide.service('getAppState', function () {
          return function () {
            return appState;
          };
        });
      });
    });

    beforeEach(function () {
      // load the application
      module('kibana');

      getIndexPatternStub = sinon.stub();

      module('kibana/courier', function ($provide) {
        $provide.service('courier', function () {
          var courier = { indexPatterns: { get: getIndexPatternStub } };
          return courier;
        });
      });

      inject(function (Private, $injector, _$rootScope_, _$compile_, _$timeout_) {
        $rootScope = _$rootScope_;
        $compile = _$compile_;
        $timeout = _$timeout_;
        Promise = $injector.get('Promise');
        mapFilter = Private(require('components/filter_bar/lib/mapFilter'));

        indexPattern = Private(require('fixtures/stubbed_logstash_index_pattern'));
        getIndexPatternStub.returns(Promise.resolve(indexPattern));

        var queryFilter = Private(require('components/filter_bar/query_filter'));
        queryFilter.getFilters = function () {
          return appState.filters;
        };
      });
    });

    describe('Element rendering', function () {
      beforeEach(function (done) {
        var filters = [
          { meta: { index: 'logstash-*' }, query: { match: { '_type': { query: 'apache' } } } },
          { meta: { index: 'logstash-*' }, query: { match: { '_type': { query: 'nginx' } } } },
          { meta: { index: 'logstash-*' }, exists: { field: '@timestamp' } },
          { meta: { index: 'logstash-*' }, missing: { field: 'host' }, disabled: true },
        ];

        Promise.map(filters, mapFilter).then(function (filters) {
          appState.filters = filters;
          $el = $compile('<filter-bar></filter-bar>')($rootScope);
        });

        var off = $rootScope.$on('filterbar:updated', function () {
          off();

          // force a nextTick so it continues *after* the $digest loop completes
          setTimeout(function () {
            $rootScope.$apply(); // ┗( ●-﹏ ｀｡)づ ....angular
            done();
          }, 0);
        });

        // kick off the digest loop
        $rootScope.$digest();
      });

      it('should render all the filters in state', function () {
        var filters = $el.find('.filter');
        expect(filters).to.have.length(4);
        expect($(filters[0]).find('span')[0].innerHTML).to.equal('_type:');
        expect($(filters[0]).find('span')[1].innerHTML).to.equal('"apache"');
        expect($(filters[1]).find('span')[0].innerHTML).to.equal('_type:');
        expect($(filters[1]).find('span')[1].innerHTML).to.equal('"nginx"');
        expect($(filters[2]).find('span')[0].innerHTML).to.equal('exists:');
        expect($(filters[2]).find('span')[1].innerHTML).to.equal('"@timestamp"');
        expect($(filters[3]).find('span')[0].innerHTML).to.equal('missing:');
        expect($(filters[3]).find('span')[1].innerHTML).to.equal('"host"');
      });
    });
  });
});
