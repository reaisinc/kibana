define(function (require) {
  return function (Private) {
    var _ = require('lodash');
    var sinon = require('sinon/sinon');
    var IndexedArray = require('utils/indexed_array/index');
    var fieldFormats = Private(require('registry/field_formats'));
    var flattenHit = require('components/index_patterns/_flatten_hit');
    var getComputedFields = require('components/index_patterns/_get_computed_fields');

    function StubIndexPattern(pattern, timeField, fields) {
      this.popularizeField = sinon.spy();
      this.timeFieldName = timeField;
      this.fields = new IndexedArray({
        index: ['name'],
        group: ['type'],
        initialSet: fields.map(function (field) {
          field.count = field.count || 0;

          // non-enumerable type so that it does not get included in the JSON
          Object.defineProperty(field, 'format', {
            enumerable: false,
            get: function () {
              return fieldFormats.defaultFor(field.type);
            }
          });

          return field;
        })
      });
      this.getFields = sinon.spy();
      this.toIndexList = _.constant([pattern]);
      this.getComputedFields = getComputedFields;
      this.flattenHit = _.partial(flattenHit, this);
      this.metaFields = ['_id', '_type', '_source'];
    }

    return StubIndexPattern;
  };
});
