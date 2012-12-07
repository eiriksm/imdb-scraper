var abortUpdate = false;
var abortSave = false;
var iter = 0;
var flood = function() {
  $.ajax({
    url: '/insertheavy',
    type: 'POST',
    success: function(data) {
      if (iter == 9999) return;
      iter++;
      console.log(iter);
      flood()
    }
  })
}

$(document).ready(function() {
  $.each(dirs, function(i,n) {
    $('#dirlist').append(makeDirRow(n, i));
  });
  $('.dir-row .find-movie').live('click', function() {
    var $row = $(this).closest('.dir-row');
    updateSingle($row, function(data) {
      $row.find('.populate').html('')
      $.each(data, function(i, n) {
        $row.find('.populate').append('<option value="' + n[0]+ '">' + n[1] + ' ' + n[2] + '</option>');
      });
    });
  });
  $('.save-link').live('click', function() {
    if ($(this).hasClass('marked')) {
      // Unmark it.
      $(this).removeClass('marked');
    }
    var $row = $(this).closest('.dir-row').addClass('marked');
    var id = $row.find('.populate').val();
    var dir = $row.find('.dir-raw').text();
    var data = {
      'id': id,
      'dir': dir
    }
    return;
    saveDir(data, $row);
  });
  $('.visit-link').live('click', function() {
    if ($(this).data('url').length > 0) {
      window.open($(this).data('url'));
    }
    else {
      var $row = $(this).closest('.dir-row');
      var id = $row.find('.populate').val();
      if (id && id.length > 0) {
        window.open('http://imdb.com/title/' + id);
      }
    }
  });
  $('.open-dir').live('click', function() {
    var $row = $(this).closest('.dir-row');
    var dir = $row.find('.dir-raw').text();
    var url = 'file://' + base + '/' + dir;
  });
  $('#searchall').click(function() {
    updateAll(0);
  });
  $('#saveall').click(function() {
    saveAll(0);
  });
  $('#hidegreen').click(function() {
    $('.dir-row.green').toggle();
  });
  $('#abortscrape').click(function() {
    abortUpdate = true;
  });
  $('#abortsave').click(function() {
    abortSave = true;
  });
  $('.exclude-dir').live('click', function() {
    var $row = $(this).closest('.dir-row');
    $.post(
      'exclude',
      {
        'dir': $row.find('.dir-raw').text()
      },
      function(data) {
        if (!data) {
          // Error'ed. Shit happens, eh?
          return;
        }
        $row.remove();
      }
    );
  });
});

var FilmItem = function() {
  this.originalTitle = '';
  this.title = '';
  this.actors = [];
  this.year = '';
  this.countries = [];
  this.rating = 0;
  this.metaRating = 0;
  this.runtime = '';
  this.dir;
  this.url;
  this.image = '';
  this.directors = [];
  this.genres = [];
  this.description = '';
}

var trim = function(string) {
  return string.replace(/\s+/g, ' ');
}

var saveDir = function(data, row, callback) {
  var send = {
    'url': 'http://imdb.com/title/' + data.id,
    'dir': data.dir
  }
  $.ajax({
    url: 'proxy',
    data: send,
    type: 'POST',
    success: function(filmdata) {
      console.log(filmdata);
      return;
      if (!filmdata) {
        return;
      }
      filmdata = JSON.parse(filmdata);
      filmdata.dir = data.dir;
      $.ajax({
        url: 'savedir',
        data: filmdata,
        type: 'POST',
        dataType: 'json',
        success: function(data) {
          if (!data) {
            // An error. Let's just ignore it.
            return;
          }
          // Not error. Let's make the world a greener place.
          row.addClass('greener');
          // ...and run callback.
          callback();
        }
      });
    }
  });
  return;
}

var saveAll = function(delta) {
  updateProgress(delta + 1, $('.dir-row.marked').length);
  if (delta + 1 > $('.dir-row.marked').length) {
    // Too high. Abort.
    return;
  }
  if (abortSave) {
    // Flagged from UI. UI knows best.
    abortSave = false;
    updateProgress(2, 1);
    return;
  }
  var row = $('.dir-row.marked')[delta];
  var row = $(row);
  var id = row.find('.populate').val();
  var dir = row.find('.dir-raw').text();
  var data = {
    'id': id,
    'dir': dir
  }
  saveDir(data, row, function() {
    saveAll(delta + 1);
  });
}

var updateAll = function(delta) {
  updateProgress(delta + 1, $('.dir-row').length);
  if (delta +1 > $('.dir-row').length) {
    // Too high. Abort.
    return;
  }
  if (abortUpdate) {
    // Flagged from UI. Abort!
    // Set variable back to normal.
    abortUpdate = false;
    updateProgress(2, 1);
    return;
  }
  var row = $('.dir-row')[delta];
  var row = $(row);
  if (row.hasClass('green')) {
    // Already done.
    updateAll(delta + 1);
    return;
  }
  updateSingle(row, function(data) {
    row.find('.populate').html('');
    $.each(data, function(i, n) {
      row.find('.populate').append('<option value="' + n[0]+ '">' + n[1] + ' ' + n[2] + '</option>');
    });
    updateAll(delta +1);
  });
}

var updateSingle = function(row, callback) {
  var movie = row.find('.movietitle').val();
  var year = row.find('.movieyear').val();
  $.ajax({
    url: 'search',
    type: 'POST',
    data: {
      'movie': movie,
      'year': year
    },
    dataType: 'json',
    success: function(data) {
      callback(data);
    }
  })
}

var makeDirRow = function(dir, delta) {
  var rowclass = 'even';
  if (delta % 2 > 0) {
    rowclass = 'odd';
  }
  var url = '';
  var time = 'Never';
  if (dir_mapping[dir]) {
    rowclass = 'green';
    url = dir_mapping[dir].url;
    time = new Date(dir_mapping[dir].timestamp * 1000);
  }
  var movie = makeHuman(dir);
  return '<div id="dir' + delta + '" class="dir-row ' + rowclass + '">' +
            '<div class="dir-raw">' + dir + '</div>'+
            '<input type="text" class="movietitle" value="' + movie.title + '"/ >'+
            '<input type="text" class="movieyear" value="' + movie.year + '"/ >'+
            '<select class="populate"></select>' +
            '<button class="btn find-movie"><i class="icon-download"></i></button>' +
            '<button class="btn save-link"><i class="icon-save"></i></button>' +
            '<button class="btn visit-link" data-url="' + url + '"><i class="icon-external-link"></i></button>' +
            '<button class="btn open-dir"><i class="icon-play-circle"></i></button>' +
            '<button class="btn exclude-dir"><i class="icon-minus"></i></button>' +
            '<div class="timestamp">Last checked: ' + time + '</div>' +
          '</div>';
}

var makeHuman = function(dir) {
  var n = dir;
  var year = '';
  yearfound = false;
  n = n.replace(/[.]/g, ' ');
  var reg = /[0-9]{4}/;
  if (n.match(reg)) {
    var year = n.match(reg)[0];
    yearfound = true;
  }
  if (yearfound) {
    n = n.slice(0, n.indexOf(year));
  }
  var reg = /^(\[|\().+(\]|\))/i;
  if (n.match(reg)) {
    n = n.replace(reg, '');
  }
  var reg = /\w/;
  n = n.slice(n.indexOf(n.match(reg)));
  var reg = /([\s]|[\w])+/
  if (n.match(reg)) {
    var film = n.match(reg)[0];
  }
  return {'title': film, 'year': year};
}
