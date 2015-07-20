define(function (require) {
  return ['remove filters', function () {
    var _ = require('lodash');
    var sinon = require('auto-release-sinon/mocha');
    var expect = require('expect.js');
    var MockState = require('fixtures/mock_state');
    var storeNames = {
      app: 'appState',
      global: 'globalState'
    };
    var filters;
    var queryFilter;
    var $rootScope, appState, globalState;

    beforeEach(module('kibana'));

    beforeEach(function () {
      appState = new MockState({ filters: [] });
      globalState = new MockState({ filters: [] });

      filters = [
        {
          query: { match: { extension: { query: 'jpg', type: 'phrase' } } },
          meta: { negate: false, disabled: false }
        },
        {
          query: { match: { '@tags': { query: 'info', type: 'phrase' } } },
          meta: { negate: false, disabled: false }
        },
        {
          query: { match: { '_type': { query: 'nginx', type: 'phrase' } } },
          meta: { negate: false, disabled: false }
        }
      ];
    });

    beforeEach(function () {
      module('kibana/courier', function ($provide) {
        $provide.service('courier', require('fixtures/mock_courier'));
      });

      module('kibana/global_state', function ($provide) {
        $provide.service('getAppState', function () {
          return function () {
            return appState;
          };
        });

        $provide.service('globalState', function () {
          return globalState;
        });
      });
    });

    beforeEach(function () {
      inject(function (_$rootScope_, Private) {
        $rootScope = _$rootScope_;
        queryFilter = Private(require('ui/filter_bar/query_filter'));
      });
    });

    describe('removing a filter', function () {
      it('should remove the filter from appState', function () {
        appState.filters = filters;
        expect(appState.filters).to.have.length(3);
        queryFilter.removeFilter(filters[0]);
        expect(appState.filters).to.have.length(2);
      });

      it('should remove the filter from globalState', function () {
        globalState.filters = filters;
        expect(globalState.filters).to.have.length(3);
        queryFilter.removeFilter(filters[0]);
        expect(globalState.filters).to.have.length(2);
      });

      it('should fire the update and fetch events', function () {
        var emitSpy = sinon.spy(queryFilter, 'emit');
        appState.filters = filters;
        $rootScope.$digest();

        queryFilter.removeFilter(filters[0]);
        $rootScope.$digest();

        expect(emitSpy.callCount).to.be(2);
        expect(emitSpy.firstCall.args[0]).to.be('update');
        expect(emitSpy.secondCall.args[0]).to.be('fetch');
      });

      it('should remove matching filters', function () {
        globalState.filters.push(filters[0]);
        globalState.filters.push(filters[1]);
        appState.filters.push(filters[2]);
        $rootScope.$digest();

        queryFilter.removeFilter(filters[0]);
        $rootScope.$digest();
        expect(globalState.filters).to.have.length(1);
        expect(appState.filters).to.have.length(1);
      });

      it('should remove matching filters by comparison', function () {
        globalState.filters.push(filters[0]);
        globalState.filters.push(filters[1]);
        appState.filters.push(filters[2]);
        $rootScope.$digest();

        queryFilter.removeFilter(_.cloneDeep(filters[0]));
        $rootScope.$digest();
        expect(globalState.filters).to.have.length(1);
        expect(appState.filters).to.have.length(1);

        queryFilter.removeFilter(_.cloneDeep(filters[2]));
        $rootScope.$digest();
        expect(globalState.filters).to.have.length(1);
        expect(appState.filters).to.have.length(0);
      });

      it('should do nothing with a non-matching filter', function () {
        globalState.filters.push(filters[0]);
        globalState.filters.push(filters[1]);
        appState.filters.push(filters[2]);
        $rootScope.$digest();

        var missedFilter = _.cloneDeep(filters[0]);
        missedFilter.meta = {
          negate: !filters[0].meta.negate
        };

        queryFilter.removeFilter(missedFilter);
        $rootScope.$digest();
        expect(globalState.filters).to.have.length(2);
        expect(appState.filters).to.have.length(1);
      });
    });

    describe('bulk removal', function () {
      it('should remove all the filters from both states', function () {
        globalState.filters.push(filters[0]);
        globalState.filters.push(filters[1]);
        appState.filters.push(filters[2]);
        expect(globalState.filters).to.have.length(2);
        expect(appState.filters).to.have.length(1);

        queryFilter.removeAll();
        expect(globalState.filters).to.have.length(0);
        expect(appState.filters).to.have.length(0);
      });
    });
  }];
});
