define(function (require) {
  var _ = require('lodash');
  // var angular = require('angular');
  // var saveFilterState = require('components/filter_bar/lib/saveFilterState');

  require('modules').get('kibana/filters')
  .service('queryFilter', function (Private, $rootScope, getAppState, globalState) {
    var appState;
    var onlyDisabled = require('components/filter_bar/lib/onlyDisabled');
    var EventEmitter = Private(require('factories/events'));

    var queryFilter = new EventEmitter();

    queryFilter.getFilters = function () {
      return queryFilter.getGlobalFilters().concat(queryFilter.getAppFilters());
    };

    queryFilter.getAppFilters = function () {
      if (!appState) return [];
      return appState.filters || [];
    };

    queryFilter.getGlobalFilters = function () {
      if (globalState.filters) return globalState.filters;
      return [];
    };

    /**
     * Adds new filters to the scope and state
     * @param {object|array} fitlers Filter(s) to add
     * @param {bool} global Should be added to global state
     * @returns {object} Resulting new filter list
     */
    queryFilter.addFilters = function (filters, global) {
      var state = (global) ? globalState : appState;

      if (!_.isArray(filters)) {
        filters = [filters];
      }

      if (!state.filters) {
        state.filters = filters;
      } else {
        state.filters = state.filters.concat(filters);
      }

      saveState();
    };

    /**
     * Removes the filter from the proper state
     * @param {object} matchFilter The filter to remove
     * @returns {object} Resulting new filter list
     */
    queryFilter.removeFilter = function (matchFilter) {
      var state = getStateByFilter(matchFilter);
      if (!state) return;

      _.pull(state.filters, matchFilter);
      return saveState();
    };

    /**
     * Removes all filters
     * @returns {object} Resulting new filter list
     */
    queryFilter.removeAll = function () {
      appState.filters = [];
      globalState.filters = [];
      return saveState();
    };

    /**
     * Toggles the filter between enabled/disabled.
     * @param {object} filter The filter to toggle
     & @param {boolean} force Disabled true/false
     * @returns {object} updated filter
     */
    queryFilter.toggleFilter = function (filter, force) {
      // Toggle the disabled flag
      var disabled = _.isUndefined(force) ? !filter.meta.disabled : !!force;
      filter.meta.disabled = disabled;

      // Save the filters back to the searchSource
      saveState();
      return filter;
    };

    /**
     * Disables all filters
     * @params {boolean} force Disable/enable all filters
     * @returns {object} Resulting updated filter list
     */
    queryFilter.toggleAll = function (force) {
      function doToggle(filter) {
        queryFilter.toggleFilter(filter, force);
      }

      executeOnFilters(doToggle);
      return queryFilter.getFilters();
    };


    /**
     * Inverts the nagate value on the filter
     * @param {object} filter The filter to toggle
     * @returns {object} updated filter
     */
    queryFilter.invertFilter = function (filter) {
      // Toggle the negate meta state
      filter.meta.negate = !filter.meta.negate;

      saveState();
      return filter;
    };

    /**
     * Inverts all filters
     * @returns {object} Resulting updated filter list
     */
    queryFilter.invertAll = function () {
      executeOnFilters(queryFilter.invertFilter);
      return queryFilter.getFilters();
    };


    /**
     * Pins the filter to the global state
     * @param {object} filter The filter to pin
     * @param {boolean} force pinned state
     * @returns {object} filter passed in
     */
    queryFilter.pinFilter = function (filter, force) {
      if (!appState) return filter;

      // ensure that both states have a filters property
      if (!_.isArray(globalState.filters)) globalState.filters = [];
      if (!_.isArray(appState.filters)) appState.filters = [];

      var appIndex = _.indexOf(appState.filters, filter);
      var globalIndex = _.indexOf(globalState.filters, filter);
      if (appIndex === -1 && globalIndex === -1) return;

      if (appIndex !== -1) {
        appState.filters.splice(appIndex, 1);
        globalState.filters.push(filter);
      } else {
        globalState.filters.splice(appIndex, 1);
        appState.filters.push(filter);
      }

      saveState();
      return filter;
    };

    /**
     * Pins all filters
     * @params {boolean} force Pin/Unpin all filters
     * @returns {object} Resulting updated filter list
     */
    queryFilter.pinAll = function (force) {
      function pin(filter) {
        queryFilter.pinFilter(filter, force);
      }

      executeOnFilters(pin);
      return queryFilter.getFilters();
    };

    initWatchers();

    return queryFilter;

    /**
     * Saves both app and global states, ensuring filters are persisted
     * @returns {object} Resulting filter list, app and global combined
     */
    function saveState() {
      if (appState) appState.save();
      globalState.save();
      return queryFilter.getFilters();
    }

    // get state (app or global) or the filter passed in
    function getStateByFilter(filter) {
      if (appState) {
        var appIndex = _.indexOf(appState.filters, filter);
        if (appIndex !== -1) return appState;
      }

      var globalIndex = _.indexOf(globalState.filters, filter);
      if (globalIndex !== -1) return globalState;

      return false;
    }

    function executeOnFilters(fn) {
      appState.filters.forEach(fn);
      globalState.filters.forEach(fn);
    }

    /**
     * Initializes state watchers that use the event emitter
     * @returns {void}
     */
    function initWatchers() {
      // multi watch on the app and global states
      var stateWatchers = [{
        fn: $rootScope.$watch,
        get: getAppState
      }, {
        fn: $rootScope.$watch,
        deep: true,
        get: queryFilter.getAppFilters
      }, {
        fn: $rootScope.$watch,
        deep: true,
        get: queryFilter.getGlobalFilters
      }];

      // when states change, use event emitter to trigger updates and fetches
      $rootScope.$watchMulti(stateWatchers, function (next, prev) {
        var doUpdate = false;
        var doFetch = false;

        _.forEach(next, function (val, i) {
          var nextVal = next[i];
          var prevVal = prev[i];

          if (nextVal === prevVal) return;

          // triggered by an appState change, update appState
          if (i === 0) {
            appState = nextVal;
            return;
          }

          doUpdate = true;
          if (!onlyDisabled(nextVal, prevVal)) doFetch = true;
        });

        if (!doUpdate) return;

        return queryFilter.emit('update')
        .then(function () {
          if (!doFetch) return;
          return queryFilter.emit('fetch');
        });
      });
    }
  });
});
