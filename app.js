// Global variables.
var rdb = {};
var tables = {
  'settings': 'id',
  'cache': 'cid',
  'movies': 'dir'
};


/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes/index')
  , http = require('http')
  , r = require('rethinkdb')
  , fs = require('fs')
  , path = require('path')
  , cheerio = require('cheerio')
  , imdb = require('./imdb')
  , proxy = require('./scraper');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Connect to database and make connection available as global var rdb.
 *
 * Also set up tables if needed.
 */
r.connect({host:'localhost', port:28015}, function(conn) {
  // Create the db if we don't have it (will not overwrite).
  conn.run(r.dbCreate('imdb'));
  // Set to use imdb as database.
  conn.use('imdb');
  // rdb is now global connection.
  rdb = conn;
  // Set up all databases needed.
  for (var i in tables) {
    r.db('imdb').tableCreate({tableName: i, primaryKey: tables[i]}).run();
  }
});

var flood = function() {
  var i = 0;
  while (i < 10) {
    var datasend = 'test' + new Date().getMilliseconds();
    var data = {
      'test': 'test',
      'delta': i,
      'something': datasend
    }
    writedb('nyen', data);
    i++;
  }
}

app.post('/insertheavy', function(req, res) {
  var t = setTimeout(function() {
    flood()
  }, 500)
  res.send('hello');
});

/**
 * Define some paths.
 */
app.get('/', routes.index);
app.get('/list', routes.list);
app.get('/getdirs', function(req, res) {
  r.connect({host:'localhost', port:28015}, function(conn) {
    conn.use('imdb');
    var cur = r.table('movies').run();
    cur.collect(function(movies) {
      var dirs = fs.readFileSync('./public/imdb/array.txt', 'UTF-8');
      dirs = dirs.split("\n");
      var exclude = conn.run(r.table('settings').filter({'exclude': true}));
      exclude.collect(function(settings) {
        console.log(settings);
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
});
app.post('/exclude', function(req, res) {
  var dir = req.param('dir');
  imdb.writedb('settings', {'exclude': true, 'name': dir});
  res.send(true);
})
app.post('/savedir', function(req, res) {
  r.connect({host:'localhost', port:28015}, function(conn) {
    conn.use('imdb');
    var movie = req.body;
    movie.timestamp = parseInt(parseInt(new Date().getTime()) / 1000);
    r.table('movies').insert(req.body, true).run();
    res.send(true);
  })
});
app.post('/proxy', function(req, res) {
  var url = req.param('url');
  // Fire up external request.
  proxy(url, function($) {
    // Initialize object.
    var film = new imdb.film();
    film.url = url;
    film.parse($);
    // Send data object as JSON back.
    res.send(JSON.stringify(film));
  });
});

app.post('/search', function(req, res) {
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
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

exports.rdb = rdb;
