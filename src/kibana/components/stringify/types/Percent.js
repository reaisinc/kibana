define(function (require) {
  return function NumberFormatProvider(Private) {
    var _ = require('lodash');
    var FieldFormat = Private(require('components/index_patterns/_field_format'));
    var Numeral = Private(require('components/stringify/types/_Numeral'));

    return Numeral.factory({
      id: 'percent',
      title: 'Percentage',
      editorTemplate: require('text!components/stringify/editors/_numeral.html'),
      paramDefaults: FieldFormat.initConfig({
        pattern: '=format:percent:defaultPattern',
        fractional: true
      }),
      samples: [
        0.10, 0.99999, 1, 100, 1000
      ],
      prototype: {
        _convert: _.compose(Numeral.prototype._convert, function (val) {
          return this.param('fractional') ? val : val / 100;
        })
      }
    });
  };
});
