'use strict';

let _ = require('lodash');

let readYamlConfig = require('../../readYamlConfig');
let fromRoot = require('../../../utils/fromRoot');
let KbnServer = require('../../../server/KbnServer');

module.exports = function (program) {
  program
  .command('serve')
  .description('Run the kibana server')
  .allowUnknownOption()
  .option('-e, --elasticsearch <uri>', 'Elasticsearch instance')
  .option('-c, --config <path>', 'Path to the config file')
  .option('-p, --port <port>', 'The port to bind to', parseInt)
  .option('-q, --quiet', 'Turns off logging')
  .option('--verbose', 'Turns on verbose logging')
  .option('-H, --host <host>', 'The host to bind to')
  .option('-l, --log-file <path>', 'The file to log to')
  .option(
    '--plugin-dir <path>',
    'A path to scan for plugins, this can be specified multiple ' +
    'times to specify multiple directories'
  )
  .option(
    '--plugin-path <path>',
    'A path to a plugin which should be included by the server, ' +
    'this can be specified multiple times to specify multiple paths'
  )
  .option('--plugins <path>', 'an alias for --plugin-dir')
  .option('--dev', 'Run the server with development mode defaults')
  .option('--no-watch', 'Prevent watching, use with --dev to prevent server restarts')
  .action(function (opts) {

    if (opts.dev && !opts.noWatch && !require('cluster').isWorker) {
      // stop processing the action and handoff to watch cluster manager
      return require('./watch');
    }

    let settings = readYamlConfig(opts.config || fromRoot('config/kibana.yml'));
    let set = _.partial(_.set, settings);
    let get = _.partial(_.get, settings);

    if (opts.dev) {
      set('env', 'development');
      set('optimize.watch', opts.watch);
    }

    if (opts.elasticsearch) set('elasticsearch.url', opts.elasticsearch);
    if (opts.port) set('server.port', opts.port);
    if (opts.host) set('server.host', opts.host);
    if (opts.quiet) set('logging.quiet', opts.quiet);
    if (opts.logFile) set('logging.dest', opts.logFile);

    set('plugins.scanDirs', _.compact([].concat(
      get('plugins.scanDirs'),
      opts.plugins,
      opts.pluginDir,
      fromRoot('src/plugins')
    )));

    set('plugins.paths', [].concat(opts.pluginPath || []));

    return new KbnServer(_.merge(settings, this.getUnknownOpts()));
  });
};
