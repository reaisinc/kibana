var join = require('path').join;
var kibana = require('../../');
var systemStatus = require('../../lib/system_status');

function Series(size) {
  this.size = size;
  this.data = [];
}
Series.prototype.push = function (value) {
  this.data.unshift([Date.now(), value]);
  if (this.data.length > this.size) this.data.pop();
};
Series.prototype.toJSON = function () {
  return this.data;
};

module.exports = new kibana.Plugin({

  init: function (server, options) {

    var config = server.config();

    var fiveMinuteData = {
      rss: new Series(60),
      heapTotal: new Series(60),
      heapUsed: new Series(60),
      load: new Series(60),
      delay: new Series(60),
      concurrency: new Series(60),
      responseTimeAvg: new Series(60),
      responseTimeMax: new Series(60),
      requests: new Series(60),
    };

    server.plugins.good.monitor.on('ops', function (event) {
      var port = String(config.port);
      fiveMinuteData.rss.push(event.psmem.rss);
      fiveMinuteData.heapTotal.push(event.psmem.heapTotal);
      fiveMinuteData.heapUsed.push(event.psmem.heapUsed);
      fiveMinuteData.load.push(event.osload);
      fiveMinuteData.delay.push(event.psdelay);
      fiveMinuteData.concurrency.push(parseInt(event.concurrents[port], 0));
      if (event.responseTimes[port]) {
        var responseTimeAvg =  event.responseTimes[port].avg;
        if (isNaN(responseTimeAvg)) responseTimeAvg = 0;
        fiveMinuteData.responseTimeAvg.push(responseTimeAvg);
        fiveMinuteData.responseTimeMax.push(event.responseTimes[port].max);
      } else {
        fiveMinuteData.responseTimeAvg.push(0);
        fiveMinuteData.responseTimeMax.push(0);
      }
      if (event.requests[port]) {
        fiveMinuteData.requests.push(event.requests[port].total);
      } else {
        fiveMinuteData.requests.push(0);
      }
    });

    server.route({
      method: 'GET',
      path: '/status/{param*}',
      handler: {
        directory: {
          path: join(__dirname, 'public')
        }
      }
    });

    server.route({
      method: 'GET',
      path: '/status/health',
      handler: function (request, reply) {
        return reply({
          metrics: fiveMinuteData,
          status: systemStatus
        });
      }
    });
  }

});
