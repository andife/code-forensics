var stream = require('stream'),
    reduce = require('through2-reduce'),
    _      = require('lodash');

var MultiStreamCollector = require_src('parallel_processing/multistream_collector');

describe('MultiStreamCollector', function() {
  beforeEach(function() {
    this.subject = new MultiStreamCollector({
      addJob: function(fn) { fn(); }
    });
  });

  it('collects the content from all the streams generated by factory', function(done) {
    var streams = [
      new stream.PassThrough(),
      new stream.PassThrough()
    ];
    var streamFnList = _.map(streams, function(s) { return function() { return s; }; });

    this.subject.mergeStream(streamFnList)
    .pipe(reduce(function(data, chunk) { return data + chunk; }, ""))
    .on('data', function(s) {
      expect(s.toString()).toEqual('data-0 data-1 data-1 data-0 ');
    })
    .on('end', done);

    streams[0].write('data-0 ');
    streams[1].write('data-1 ');
    streams[1].write('data-1 ');
    streams[0].write('data-0 ');
    streams[0].end();
    streams[1].end();
  });
});