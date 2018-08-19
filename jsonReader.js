var fs = require('fs'),
    JSONStream = require('JSONStream');

var stream = fs.createReadStream('./data/json/test.json', {encoding: 'utf8'}),
    // parser = JSONStream.parse('rows.*.doc');
    parser = JSONStream.parse('a');

stream.pipe(parser);

parser.on('data', function (obj) {
    console.log(obj); // whatever you will do with each JSON object
});
