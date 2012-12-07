var request = require('request')
  , cheerio = require('cheerio');

var proxy = function(url, callback) {
  request({url: url}, function(error, response, body){
    var $ = cheerio.load(body);
    callback($)
  });
}

module.exports = proxy;
