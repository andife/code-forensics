var PassThrough = require('stream').PassThrough,
    chalk       = require('chalk'),
    utils       = require('../utils');

var SequenceCounter = function(targetNumber, onEndCallback) {
  var count = 0;

  var checkForEndSequence = function() {
    if (count === targetNumber) {
      onEndCallback();
    }
  };

  this.next = function() {
    count++;
    checkForEndSequence();
  };

  checkForEndSequence();
};

module.exports = function(jobRunner, streamOptions) {
  var collectorStream = new PassThrough(streamOptions);
  var counter;

  var processStream = function(stream) {
    stream.on('data', function(chunk) { collectorStream.write(chunk); });
    return utils.stream.streamToPromise(stream).then(counter.next.bind(counter), function(err) {
      utils.log(chalk.red("Error processing stream: " + err));
    });
  };

  this.mergeStream = function(streamFnList) {
    counter = new SequenceCounter(streamFnList.length, collectorStream.end.bind(collectorStream));
    streamFnList.forEach(function(streamFn) {
      jobRunner.addJob(function() {
        return processStream(streamFn());
      });
    });
    return collectorStream;
  };
};