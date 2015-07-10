'use strict';

let _ = require('lodash');

let states = require('./states');
let Status = require('./Status');

module.exports = class ServerStatus {
  constructor(server) {
    this.server = server;
    this._created = {};
  }

  create(name) {
    return (this._created[name] = new Status(name, this.server));
  }

  each(fn) {
    let self = this;
    _.forOwn(self._created, function (status, i, list) {
      if (status.state !== 'disabled') {
        fn.call(self, status, i, list);
      }
    });
  }

  decoratePlugin(plugin) {
    plugin.status = this.create(`plugin:${plugin.id}`);
  }

  overall() {
    var state = _(this._created)
    .map(function (status) {
      return states.get(status.state);
    })
    .sortBy('severity')
    .pop();

    var statuses = _.where(this._created, { state: state.id });
    var since = _.get(_.sortBy(statuses, 'since'), [0, 'since']);

    return {
      state: state.id,
      title: state.title,
      nickname: _.sample(state.nicknames),
      icon: state.icon,
      since: since,
    };
  }

  toValue() {
    return (this.overall().state === 'green');
  }

  toString() {
    var overall = this.overall();
    return `${overall.title} – ${overall.nickname}`;
  }

  toJSON() {
    return {
      overall: this.overall(),
      statuses: _.values(this._created)
    };
  }
};
