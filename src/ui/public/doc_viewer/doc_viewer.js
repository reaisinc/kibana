define(function (require) {
  let _ = require('lodash');
  let angular = require('angular');
  require('ace');
  //added sah for editing
  require('angular-xeditable');

  let html = require('ui/doc_viewer/doc_viewer.html');
  require('ui/doc_viewer/doc_viewer.less');
  let esHost = "";

  //sah added xeditable
  require('ui/modules').get('kibana', ['xeditable'])
    .directive('docViewer', function (config, Private, $location, editableOptions) {
      //set theme for editing
      editableOptions.theme = 'bs3';
      esHost = "http://localhost:9220";
      if (config.get('visualization:elasticSearchUrl')) {
        esHost = config.get('visualization:elasticSearchUrl');
      }
      //esPath = config.get('server.basePath');
      //esPath = config.get('elasticsearch.url');
      return {
        restrict: 'E',
        template: html,
        scope: {
          hit: '=',
          indexPattern: '=',
          filter: '=?',
          columns: '=?',
          columnAliases: '=?' // kibi: added columnAliases this was needed to support aliases in kibi-doc-table
        },
        link: {
          pre($scope) {
            $scope.aceLoaded = (editor) => {
              editor.$blockScrolling = Infinity;
            };
          },

          post($scope, $el, attr) {
            //added sah If a field isn't in the mapping, use this
            //red #f44336
            //green #4CAF50
            //blue #607d8b
            //yellow #ff9800
            //hardcode a few colors
            if (!$scope.$root.row_colors) {
              $scope.row_colors = $scope.$root.row_colors = {
                "moving": "#f44336", "speed": "#607d8b", "user_id": "#4CAF50", "device_manufacturer": "#ff9800", "device_model": "#ff9800",
                "device_platform": "#ff9800", "device_uuid": "#ff9800", "device_version": "#ff9800"
              };
            } else {
              $scope.row_colors = $scope.$root.row_colors;
            }

            // If a field isn't in the mapping, use this
            $scope.mode = 'table';
            $scope.mapping = $scope.indexPattern.fields.byName;
            $scope.flattened = $scope.indexPattern.flattenHit($scope.hit);
            $scope.hitJson = angular.toJson($scope.hit, true);
            $scope.formatted = $scope.indexPattern.formatHit($scope.hit);
            $scope.fields = _.keys($scope.flattened).sort();
            $scope.error = "";
            //$scope.getFilteredValue = function(item) { item.filtered_value =  typeof(formatted[field]) === 'undefined' ? hit[field] : formatted[field] | trustAsHtml };


            // kibi: constructing aliases map
            $scope.aliases = {};
            _.each($scope.fields, (fieldName) => {
              $scope.aliases[fieldName] = fieldName;
              if ($scope.columns && $scope.columnAliases && $scope.columnAliases.length > 0) {
                const index = $scope.columns.indexOf(fieldName);
                if ($scope.columnAliases[index]) {
                  $scope.aliases[fieldName] = $scope.columnAliases[index];
                }
              }
            });
            // kibi: end

            $scope.toggleColumn = function (fieldName) {
              _.toggleInOut($scope.columns, fieldName);
            };

            //added sah prompt to edit value, save to ES.  Note:  need to configure url to ES since the proxy doesn't work for _update
            /*
            $scope.editColumn = function (idx) {

              var fieldValue = prompt("Edit field: " + $scope.fields[idx] + " ( type: " + $scope.mapping[$scope.fields[idx]].type + " )", $scope.formatted[$scope.fields[idx]]);
              if (fieldValue != null) {
                var fieldType = $scope.mapping[$scope.fields[idx]].format.type.fieldType;
                //important - set value before replacing with number.  otherwise Angular won't update the table with the new value.
                $scope.formatted[$scope.fields[idx]] = fieldValue;
                if (fieldType == 'number') {
                  fieldValue = Number(fieldValue)
                }

                var updateObj = {
                  "script": {
                    "inline": "ctx._source." + $scope.fields[idx] + "=tag",
                    "params": {
                      "tag": fieldValue
                    }
                  }
                };
                var oldCursor = document.body.style.cursor;
                if (oldCursor === undefined) {
                  oldCursor = 'default';
                }
                document.body.style.cursor = 'progress';
                //var url = "/elasticsearch/"+$scope.formatted["_index"] +"/"+$scope.formatted["_type"] +"/"+ $scope.formatted["_id"] +"/_update";
                //why doesn't the kibana proxy work without specifying the ES url?
                var url = "/proxy?uri=" + "http://elasticsearch:9220" + "/" + $scope.formatted["_index"] + "/" + $scope.formatted["_type"] + "/" + $scope.formatted["_id"] + "/_update";
                $.ajax({
                  method: "POST",
                  url: url,
                  crossDomain: true,
                  async: false,
                  data: JSON.stringify(updateObj),
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                  },
                  dataType: 'json',
                  contentType: 'application/json',
                })
                  .done(function (data) {
                    //alert("Saved")
                    $scope.saveMessage = "Saved"
                  })
                  .fail(function (e) {
                    //alert("Error updating database: " + e.message)
                    $scope.saveMessage = "Error updating data"
                  })
                  .always(function () {
                    console.log("complete");
                    document.body.style.cursor = oldCursor;
                  });
              }
            };
            */
            /*
            Note: must use proxy due to CORS
            add this to kibana.yml and include the url to ES
             sense.proxyFilter:
                  ^https?://(192.168.99.100:9202|maps\.googleapis\.com|localhost|127\.0\.0\.1|\[::0\]).*
            */
            $scope.reverseGeocodeColumn = function (idx) {
              //var fieldValue = prompt("Edit field: " + $scope.fields[idx] + " ( type: " + $scope.mapping[$scope.fields[idx]].type+" )", $scope.formatted[$scope.fields[idx]]);
              var api = "AIzaSyCNEMoMEB1daSyHQLLbpUWzURD6RQDuIVw";
              var geocoords = $scope.formatted[$scope.fields[idx]].split(",");
              var lat = Number(geocoords[0]);
              var lng = Number(geocoords[1]);
              if (Math.abs(lat) < 0) lat *= 100;
              if (Math.abs(lng) < 0) lng *= 100;

              var url = "/proxy?uri=" + escape("https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&sensor=false&key=" + api);
              var obj = {
                "title": "Reverse geocoding results",
                "fields": [{ "alias": "Address", "name": "formatted_address" }],
                "coords": [lat, lng],
                "loading": "Locating address closest to " + lat + ", " + lng,
                "url": url
              };
              if ($scope.$root.$$listenerCount.showPopup !== undefined) {
                $scope.$root.$broadcast('showPopup', obj);
              }
              else {
                var oldBodyCursor = document.body.style.cursor;
                if (oldBodyCursor === undefined) {
                  oldBodyCursor = 'default';
                }


                document.body.style.cursor = 'progress';

                $.getJSON(url)
                  .done(function (data) {
                    var streetaddress = data.results[0].formatted_address;
                    alert("Found: " + streetaddress);
                    return streetaddress;
                  })
                  .fail(function () {
                    console.log("error");
                  })
                  .always(function () {
                    console.log("complete");
                    document.body.style.cursor = oldBodyCursor;
                  });

              }
            };

            $scope.geocodeColumn = function (idx) {
              //var fieldValue = prompt("Edit field: " + $scope.fields[idx] + " ( type: " + $scope.mapping[$scope.fields[idx]].type+" )", $scope.formatted[$scope.fields[idx]]);
              var api = "AIzaSyCNEMoMEB1daSyHQLLbpUWzURD6RQDuIVw";
              var address = $scope.formatted[$scope.fields[idx]];
              var url = "/proxy?uri=" + escape("https://maps.googleapis.com/maps/api/geocode/json?address=" + escape(address) + "&sensor=false&key=" + api);
              var obj = {
                "title": "Geocoding results",
                "fields": [
                  { "alias": "Latitude", "name": ["geometry", "location", "lat"] },
                  { "alias": "Longitude", "name": ["geometry", "location", "lng"] },
                  { "alias": "Types", "name": "types" },
                  { "alias": "Partial match", "name": "partial_match" }
                ],
                "loading": "Locating latitude and longitude for " + address,
                "address": address,
                "url": url
              };
              if ($scope.$root.$$listenerCount.showPopup !== undefined) {
                $scope.$root.$broadcast('showPopup', obj);
              }
              else {

                var oldBodyCursor = document.body.style.cursor;
                if (oldBodyCursor === undefined) {
                  oldBodyCursor = 'default';
                }


                document.body.style.cursor = 'progress';

                $.getJSON(url)
                  .done(function (data) {
                    //var streetaddress=data.results[0].formatted_address;
                    var coords = data.results[0].geometry.location;
                    alert("Lat: " + coords.lat + ", Lng: " + coords.lng);

                    return coords;
                  })
                  .fail(function () {
                    console.log("error");
                  })
                  .always(function () {
                    console.log("complete");
                    document.body.style.cursor = oldBodyCursor;
                  });

              }
            };
            //added sah to   before saving
            $scope.checkName = function (fieldValue, idx) {

              if (fieldValue != null) {
                //var fieldType = $scope.mapping[$scope.fields[idx]].format.type.fieldType;
                var fieldType = $scope.mapping[$scope.fields[idx]].type;

                var err;
                if (err = $scope.checkIsInvalid($scope.fields[idx], fieldValue, fieldType)) {
                  //alert(err);
                  //$scope.error = err;
                  return err;
                }

                //important - set value before replacing with number.  otherwise Angular won't update the table with the new value.
                $scope.formatted[$scope.fields[idx]] = fieldValue;
                if (fieldType === 'number') {
                  fieldValue = Number(fieldValue);
                }

                var updateObj = {
                  "script": {
                    "inline": "ctx._source." + $scope.fields[idx] + "=tag",
                    "params": {
                      "tag": fieldValue
                    }
                  }
                };
                var oldCursor = document.body.style.cursor;
                if (oldCursor === undefined) {
                  oldCursor = 'default';
                }
                document.body.style.cursor = 'progress';
                //var url = "/elasticsearch/"+$scope.formatted["_index"] +"/"+$scope.formatted["_type"] +"/"+ $scope.formatted["_id"] +"/_update";
                //why doesn't the kibana proxy work without specifying the ES url?
                var url = "/proxy?uri=" + esHost + "/" + $scope.formatted._index + "/" +
                  $scope.formatted._type + "/" + $scope.formatted._id + "/_update";

                $.ajax({
                  method: "POST",
                  url: url,
                  crossDomain: true,
                  async: false,
                  data: JSON.stringify(updateObj),
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                  },
                  dataType: 'json',
                  contentType: 'application/json',
                })
                  .done(function (data) {
                    //alert("Saved")
                    $scope.saveMessage = "Saved";
                  })
                  .fail(function (e) {
                    //alert("Error updating database: " + e.message)
                    $scope.saveMessage = "Error updating data";
                  })
                  .always(function () {
                    console.log("complete");
                    document.body.style.cursor = oldCursor;
                  });
              }
              /*
              var d = $q.defer();
              $http.post('/checkName', {value: data}).success(function(res) {
                res = res || {};
                if(res.status === 'ok') { // {status: "ok"}
                  d.resolve()
                } else { // {status: "error", msg: "Username should be `awesome`!"}
                  d.resolve(res.msg)
                }
              }).error(function(e){
                d.reject('Server error!');
              });
              return d.promise;
              */
            };
            //added sah
            $scope.toTrustedHTML = function (html) {
              return $sce.trustAsHtml(html);
            };
            $scope.checkIsInvalid = function (field, val, type) {
              if (type === "date") {
                //new Date(val)
                //need to convert the day to an integer or Date.parse() fails
                //June 22nd 2018, 17:10:08
                let tmp = val.split(" ");
                if (val.length < 3) {
                  return "Invalid date entered.  Example format:  January 22nd 2017, 19:00:00.000";
                }
                tmp[1] = parseInt(tmp[1]);
                val = tmp.join(" ");
                if (isNaN(Date.parse(val))) {
                  return "Invalid date entered.  Example format:  January 22nd 2017, 19:00:00.000";
                }
                return;
              }
              else if (type === "geo_point") {
                let tmp = val.split(",");
                if (tmp.length !== 2) {
                  return "Format should be:  latitude, longitude";
                }
                const tmpY = parseFloat(tmp[0]);
                const tmpX = parseFloat(tmp[1]);
                if (isNaN(tmpY) || !isFinite(tmp[0])) {
                  return "Invalid number entered for latitude.  Must be between -90 and 90";
                }
                if (isNaN(tmpX) || !isFinite(tmp[1])) {
                  return "Invalid number entered for longitude.  Must be between -180 and 180";
                }
                if (tmpY > 90 || tmpY < -90) {
                  return "Invalid latitude entered.  Must be between -90 and 90";
                }
                if (tmpX > 180 || tmpX < -180) {
                  return "Invalid longitude entered.  Must be between -180 and 180";
                }
                return;
              }
              else if (typeof (val) === type) {
                return;
              }
              return "Invalid value:  " + field + " must be of type: " + type;
            };
            $scope.checkColor = function (data, field, index) {
              //is it a valid color?
              /*
          if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(data)) {
            //Match
            $scope.colors[field] = data;
            return;
          }
          if (/^rgb\s*(\s*[012]?[0-9]{1,2}\s*,\s*[012]?[0-9]{1,2}\s*,\s*[012]?[0-9]{1,2}\s*)$/i.test(data)) {
            //Match
            $scope.colors[field] = data;
            return;
        }
        */
              var litmus = 'red';
              var d = document.createElement('div');
              d.style.color = litmus;
              d.style.color = data;
              //Element's style.color will be reverted to litmus or set to '' if an invalid color is given
              if (data !== litmus && (d.style.color === litmus || d.style.color === '')) {
                return "Unable to determine color.  Use color name or hexidecimal format #aabbcc";
              }
              $scope.$root.row_colors[field] = data;
              //$scope.row_colors = $scope.$root.row_colors;
              //$scope.mapping[$scope.fields[index]].$$spec.row_color = data;
              return;
            };

            $scope.showArrayInObjectsWarning = function (row, field) {
              let value = $scope.flattened[field];
              return _.isArray(value) && typeof value[0] === 'object';
            };
          }
        }
      };
    });
});
