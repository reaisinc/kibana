define(function (require) {
  describe('SearchSource#normalizeSortRequest', function () {
    require('services/private');
    require('angular').module('normalizeSortRequest', ['kibana']);

    var normalizeSortRequest;
    var indexPattern;
    var normalizedSort;

    beforeEach(module('kibana'));
    beforeEach(inject(function (Private) {
      normalizeSortRequest = Private(require('components/courier/data_source/_normalize_sort_request'));
      indexPattern = Private(require('fixtures/stubbed_logstash_index_pattern'));

      normalizedSort = [{
        someField: {
          order: 'desc',
          unmapped_type: 'boolean'
        }
      }];
    }));

    it('make sure sort is an array', function () {
      var result = normalizeSortRequest({ someField: 'desc'}, indexPattern);
      expect(result).to.be.an(Array);
      expect(result).to.eql(normalizedSort);
    });

    it('makes plain string sort into the more verbose format', function () {
      var result = normalizeSortRequest([{ someField: 'desc'}], indexPattern);
      expect(result).to.eql(normalizedSort);
    });

    it('appends default sort options', function () {
      var sortState = [{
        someField: {
          order: 'desc',
          unmapped_type: 'boolean'
        }
      }];
      var result = normalizeSortRequest(sortState, indexPattern);
      expect(result).to.eql(normalizedSort);
    });

    it('should enable script based sorting', function () {
      var fieldName = 'script string';
      var direction = 'desc';
      var indexField = indexPattern.fields.byName[fieldName];

      var sortState = {};
      sortState[fieldName] = direction;
      normalizedSort = {
        _script: {
          script: indexField.script,
          type: indexField.type,
          order: direction
        }
      };
      var result = normalizeSortRequest([sortState], indexPattern);

      expect(result).to.eql([normalizedSort]);
    });

    it('should use script based sorting only on sortable types', function () {
      var fieldName = 'script murmur3';
      var direction = 'asc';
      var indexField = indexPattern.fields.byName[fieldName];

      var sortState = {};
      sortState[fieldName] = direction;
      normalizedSort = {};
      normalizedSort[fieldName] = {
        order: direction,
        unmapped_type: 'boolean'
      };
      var result = normalizeSortRequest([sortState], indexPattern);

      expect(result).to.eql([normalizedSort]);
    });
  });
});