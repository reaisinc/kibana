var _ = require('lodash');
var join = require('path').join;

var assets = require('../ui/assets');
var asRegExp = _.flow(
  _.escapeRegExp,
  function (path) {
    return path + '(?:\\.js)?$';
  },
  RegExp
);

function OptmzUiExports(plugins) {
  // regular expressions which will prevent webpack from parsing the file
  var noParse = this.noParse = [];

  // webpack aliases, like require paths, mapping a prefix to a directory
  var aliases = this.aliases = {};

  // webpack loaders map loader configuration to regexps
  var loaders = this.loaders = [
    { test: /\.less$/, loader: 'style/url!file!less' },
    { test: /\.css$/, loader: 'style/url!file' },
    { test: /\.html$/, loader: 'raw' },
    {
      test: /\.(woff|woff2|png)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&minetype=application/font-woff'
    },
    { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
  ];

  var claimedModuleIds = {};
  _.each(plugins, function (plugin) {
    var exports = plugin.uiExportSpecs;

    // add an alias for this plugins public directory
    if (plugin.publicDir) {
      aliases[`plugins/${plugin.id}`] = plugin.publicDir;
    }

    // consume the plugin's "modules" exports
    _.forOwn(exports.modules, function (spec, id) {
      if (claimedModuleIds[id]) {
        throw new TypeError(`Plugin ${plugin.id} attempted to override export "${id}" from ${claimedModuleIds[id]}`);
      } else {
        claimedModuleIds[id] = plugin.id;
      }

      // configurable via spec
      var path;
      var parse = true;
      var imports = null;
      var exports = null;

      // basic style, just a path
      if (_.isString(spec)) path = spec;

      if (_.isArray(spec)) {
        path = spec[0];
        imports = spec[1];
        exports = spec[2];
      }

      if (_.isPlainObject(spec)) {
        path = spec.path;
        parse = _.get(spec, 'parse', parse);
        imports = _.get(spec, 'imports', imports);
        exports = _.get(spec, 'exports', exports);
      }

      if (!path) {
        throw new TypeError('Invalid spec definition, unable to identify path');
      }

      aliases[id] = path;

      var loader = [];
      if (imports) {
        loader.push(`imports?${imports}`);
      }

      if (exports) loader.push(`exports?${exports}`);
      if (loader.length) loaders.push({ test: asRegExp(path), loader: loader.join('!') });

      if (!parse) noParse.push(asRegExp(path));
    });

    // consume the plugin's "loaders" exports
    _.each(exports.loaders, function (loader) {
      loaders.push(loader);
    });

  });
}

module.exports = OptmzUiExports;
