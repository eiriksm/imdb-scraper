var updateProgress = function(current, total) {
  if (current > total) {
    $('#progresser').fadeOut('slow');
    return;
  }
  $('#currentprogress').text(current);
  $('#totalprogress').text(total);
  var percent = (parseInt(current) / parseInt(total)) * 100;
  $('#progresser .bar').css('width', percent + '%');
  $('#progresser').show();
}

$(document).ready(function() {
  $('#searcher').live('keyup', function() {
    searchFor($(this).val());
  });
});

var searchFor = function(string) {
  if (string.length < 2) {
    $('.film-row, .dir-row').show();
    return;
  }
  $('.film-row, .dir-row').each(function(i,n) {
    if (n.innerHTML.indexOf(string) > 0) {
      // String found. Keep visible.
      $(n).show();
    }
    else {
      // Not found. Hide it.
      $(n).hide();
    }
  });
}

/**
 * Search system.
 */
$(window).bind('hashchange', function() {
  var searchstring = window.location.hash.replace('#', '');
  searchFor(searchstring);
});
