var offset = $("svg").offset();

$("body").mousemove(function(event) {

  var x = offset.left + 55 + 50
  var y = offset.top + 50
  
  var rad = Math.atan2(event.pageX - x, event.pageY - y);
  var rot = (rad * (180 / Math.PI) * -1);
  
  $('#eye-1').attr({ 'transform': 'rotate(' + rot + ' 55 50)'});
  
  $('#eye-2').attr({ 'transform': 'rotate(' + rot + ' 155 50)'});
  
});

$( "body" ).click(function() {
  $('.pupil').css('webkitAnimation', 'none');
  $('.blink').css('webkitAnimation', 'none');
  setTimeout(function() {
    $('.pupil').css('webkitAnimation', '');
    $('.blink').css('webkitAnimation', '');
  }, 10);
});