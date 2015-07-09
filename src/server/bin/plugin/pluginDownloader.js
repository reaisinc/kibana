﻿var _ = require('lodash');
var zlib = require('zlib');
var Promise = require('bluebird');
var request = require('request');
var tar = require('tar');
var progressReporter = require('./progressReporter.js');

module.exports = function (settings, logger) {

  //Attempts to download each url in turn until one is successful
  function download() {
    var urls = settings.urls;

    function tryNext() {
      var sourceUrl = urls.shift();
      if (!sourceUrl) {
        throw new Error('Not a valid url.');
      }

      logger.log('attempting to download ' + sourceUrl);

      return downloadSingle(sourceUrl, settings.workingPath, settings.timeout, logger)
      .catch(function (err) {
        if (err.message === 'ENOTFOUND') {
          return tryNext();
        }
        if (err.message === 'EEXTRACT') {
          throw (new Error('Error extracting the plugin archive'));
        }
        throw (err);
      });
    }

    return tryNext();
  }

  //Attempts to download a single url
  function downloadSingle(source, dest, timeout) {
    var gunzip = zlib.createGunzip();
    var tarExtract = tar.Extract({ path: dest, strip: 1 });

    var requestOptions = { url: source };
    if (timeout !== 0) {
      requestOptions.timeout = timeout;
    }

    var req = request.get(requestOptions);
    var reporter = progressReporter(logger, req);

    req
    .on('response', reporter.handleResponse)
    .on('data', reporter.handleData)
    .on('error', _.partial(reporter.handleError, 'ENOTFOUND'))
    .pipe(gunzip)
    .on('error', _.partial(reporter.handleError, 'EEXTRACT'))
    .pipe(tarExtract)
    .on('error', _.partial(reporter.handleError, 'EEXTRACT'))
    .on('end', reporter.handleEnd);

    return reporter.deferred;
  }

  return {
    download: download,
    _downloadSingle: downloadSingle
  };
};