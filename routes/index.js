var rdb;
var fs = require('fs');
var cheerio = require('cheerio');
var imdb = require('../imdb');
var exec = require('child_process').exec;
var proxy = require('../scraper');
var r = require('rethinkdb');

/**
 * Connect to database and make connection available as global var rdb.
 */
r.connect({host:'localhost', port:28015}, function(e, conn) {
  // Create the db if we don't have it (will not overwrite).
  r.dbCreate('imdb').run(conn);
  // Set to use imdb as database.
  conn.use('imdb');
  // rdb is now global connection.
  rdb = conn;
  // Set up all databases needed.
});
exports.test = function(req, res) {
  exec('vlc&', function(error, stdout, stderr) {
    res.send('OK!');
  });
};

exports.index = function(req, res){
  res.render('index', { title: 'Directory mapping', index: 'index' });
};
exports.list = function(req, res){
  res.render('index', { title: 'The list', index: 'list' });
};
exports.getdirs = function(req, res) {
  r.connect({host:'localhost', port:28015}, function(e, conn) {
    conn.use('imdb');
    r.table('movies').run(conn)
    .then(function(moviesCur) {
      moviesCur.toArray(function(me, movies) {
        var dirs = fs.readFileSync('./public/imdb/array.txt', 'UTF-8');
        dirs = dirs.split("\n");
        r.table('settings').filter({'exclude': true}).run(conn)
        .then(function(settingsCur) {
          settingsCur.toArray(function(se, settings) {
            config = {};
            config.exclude = {};
            for (var i = 0, len = settings.length; i < len; i++) {
              config.exclude[settings[i].name] = true;
            }
            for (var i = 0, len = dirs.length; i < len; i++) {
              var current = dirs[i];
              if (config.exclude[current]) {
                // Directory is excluded.
                dirs.splice(i, 1);
              }
            }
            var films = {};
            for (var i in movies) {
              var id = movies[i].dir;
              films[id] = movies[i]
            }
            res.set('Content-Type', 'application/json');
            res.send('var dirs = ' + JSON.stringify(dirs) +
                     ';var dir_mapping = ' + JSON.stringify(films));
          });
        });
      });
    });
  });
};
exports.exclude = function(req, res) {
  var dir = req.param('dir');
  imdb.writedb('settings', {'exclude': true, 'name': dir});
  res.send(true);
}
exports.proxy = function(req, res) {
  var url = req.param('url');
  // Fire up external request.
  proxy(url, function($) {
    // Initialize object.
    var film = new imdb.film();
    film.url = url;
    film.parse($);
    film.dir = req.param('dir');
    film.timestamp =
    film.save();
    // Send data object as JSON back.
    res.send(JSON.stringify(film));
  });
}
exports.search = function(req, res) {
  var params = req.body;
  var year = '';
  if (params.year && params.year.length > 0) {
    var year = ' ' + params.year.length
  }
  r.connect({host:'localhost', port:28015}, function(e, conn) {
    conn.use('imdb');
    var cached = r.table('cache').get(params.movie).run(conn)
    .then(function(cacheobj) {
      if (cacheobj) {
        res.send(JSON.stringify(cacheobj.data));
      }
      else {
        proxy('http://www.imdb.com/find?q=' + params.movie + year + '&s=tt', function($) {
          var hits = [];
          $('.findSection').eq(0).find('.findResult .result_text').each(function(i, n) {
            var link = $(n).find('a').remove();
            var title = link.text();
            var id = link.attr('href').replace('/title/', '').slice(0, link.attr('href').indexOf('?ref'));
            var year = $(n).text().replace(' (TV Series)', '');
            var hit = [id,
              title,
              year
            ];
            hits.push(hit);
          });
          // Since this was not cached, let's cache it for later.
          var c = new imdb.Cache();
          // Make the cache id something we can identify.
          c.cid = params.movie;
          c.data = hits;
          c.save();
          res.send(JSON.stringify(hits));
        });
      }
    });
  });
}
