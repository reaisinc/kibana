define(function (require) {
  return function _StringProvider(Private) {
    var _ = require('lodash');
    var FieldFormat = Private(require('ui/index_patterns/_field_format/FieldFormat'));

    require('ui/stringify/editors/color.less');

    _.class(_Color).inherits(FieldFormat);
    function _Color(params) {
      _Color.Super.call(this, params);
    }

    _Color.id = 'color';
    _Color.title = 'Color';
    _Color.fieldType = [
      'number'
    ];

    _Color.editor = {
      template: require('ui/stringify/editors/color.html'),
      controller($scope) {
        $scope.addColor = function () {
          $scope.editor.formatParams.colors.push({});
        };

        $scope.removeColor = function (index) {
          $scope.editor.formatParams.colors.splice(index, 1);
        };
      }
    };

    _Color.paramDefaults = {
      colors: [{
        range: `${Number.NEGATIVE_INFINITY}:${Number.POSITIVE_INFINITY}`,
        text: '#000000',
        background: '#ffffff'
      }]
    };

    _Color.prototype._convert = {
      html(val) {
        const color = _.findLast(this.param('colors'), ({ range }) => {
          if (!range) return;
          const [start, end] = range.split(':');
          return val >= Number(start) && val <= Number(end);
        });

        if (!color) return _.asPrettyString(val);

        const styleColor = color.text ? `color: ${color.text};` : '';
        const styleBackgroundColor = color.background ? `background-color: ${color.background};` : '';
        return `<span style="${styleColor}${styleBackgroundColor}">${_.escape(val)}</span>`;
      }
    };

    return _Color;
  };
});
