var tsv = require("node-tsv-json");
var path = require('path');
tsv({
    input: "./data/TF_WEATHER_19JUL.tsv",
    output: "./data/json/TF_WEATHER_19JUL.json"
    //array of arrays, 1st array is column names
    ,parseRows: true
}, function(err, result) {
    if(err) {
        console.error(err);
    }else {
        console.log(result.length);
    }
});
