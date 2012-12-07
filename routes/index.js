var rdb
  , fs = require('fs')
  , cheerio = require('cheerio')
  , imdb = require('../imdb')
  , proxy = require('../scraper')
  , r = require('rethinkdb');

/**
 * Connect to database and make connection available as global var rdb.
 */
r.connect({host:'localhost', port:28015}, function(conn) {
  // Create the db if we don't have it (will not overwrite).
  conn.run(r.dbCreate('imdb'));
  // Set to use imdb as database.
  conn.use('imdb');
  // rdb is now global connection.
  rdb = conn;
  // Set up all databases needed.
});


exports.index = function(req, res){
  res.render('index', { title: 'Directory mapping', index: 'index' });
};
exports.list = function(req, res){
  res.render('index', { title: 'The list', index: 'list' });
};
exports.getdirs = function(req, res) {
  r.connect({host:'localhost', port:28015}, function(conn) {
    conn.use('imdb');
    var cur = r.table('movies').run();
    cur.collect(function(movies) {
      var dirs = fs.readFileSync('./public/imdb/array.txt', 'UTF-8');
      dirs = dirs.split("\n");
      var exclude = conn.run(r.table('settings').filter({'exclude': true}));
      exclude.collect(function(settings) {
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
        res.send('var dirs = ' + JSON.stringify(dirs) +
                 ';var dir_mapping = ' + JSON.stringify(films));
      })
    });
  })
};
exports.exclude = function(req, res) {
  var dir = req.param('dir');
  imdb.writedb('settings', {'exclude': true, 'name': dir});
  res.send(true);
}
exports.savedir = function(req, res) {
  r.connect({host:'localhost', port:28015}, function(conn) {
    conn.use('imdb');
    var movie = req.body;
    r.table('movies').insert(req.body, true).run();
    res.send(true);
  });
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
  r.connect({host:'localhost', port:28015}, function(conn) {
    conn.use('imdb');
    var cached = r.table('cache').get(params.movie, 'cid').run()
    cached.collect(function(cacheobj) {
      if (cacheobj[0] !== null) {
        res.send(JSON.stringify(cacheobj[0].data));
      }
      else {
        proxy('http://www.imdb.com/find?q=' + params.movie + year + '&s=tt', function($) {
          var hits = [];
          $('.findResult .result_text').each(function(i,n) {
            var link = $(n).find('a').remove();
            var title = link.text();
            var id = link.attr('href').replace('/title/', '').slice(0, link.attr('href').indexOf('?ref'));
            var year = $(n).text().replace(' (TV Series)', '');
            var hit = [id,
              title,
              year
            ]
            hits.push(hit);
          });
          // Since this was not cached, let's cache it for later.
          var c = new imdb.cache();
          // Make the cache id something we can identify.
          c.cid = params.movie;
          c.data = hits;
          c.save();
          res.send(JSON.stringify(hits));
        });
      }
    })
  });
}
