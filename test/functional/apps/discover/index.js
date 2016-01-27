define(function (require) {
  var bdd = require('intern!bdd');
  var config = require('intern').config;
  var url = require('intern/dojo/node!url');
  var ScenarioManager = require('intern/dojo/node!../../../fixtures/scenarioManager');
  var discoverTest = require('./_discover');
  var fieldData = require('./_field_data');
  var sharedLinks = require('./_shared_links');

  bdd.describe('discover app', function () {
    var scenarioManager;
    var remote;
    var scenarioManager = new ScenarioManager(url.format(config.servers.elasticsearch));
    this.timeout = config.timeouts.default;

    bdd.before(function () {
      remote = this.remote;
      return remote.setWindowSize(1200,800);
    });

    bdd.after(function unloadMakelogs() {
      return scenarioManager.unload('logstashFunctional');
    });

    discoverTest(bdd, scenarioManager);

    fieldData(bdd, scenarioManager);

    sharedLinks(bdd, scenarioManager);

  });
});
