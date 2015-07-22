define(function (require) {
  var module = require('ui/modules').get('kibana/vislib', ['kibana']);

  require('ui/private');

  module.service('d3', function () {
    return require('d3');
  });

  /**
   * Provides the Kibana4 Visualization Library
   *
   * @module vislib
   * @main vislib
   * @return {Object} Contains the version number and the Vis Class for creating visualizations
   */
  module.service('vislib', function (Private) {
    return {
      version: '0.0.0',
      Vis: Private(require('ui/vislib/vis'))
    };
  });
});
