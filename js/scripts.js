//Using on(), mouseenter(), mouseleave(), mouseup()
$(function(){
  $('#robots').on('mouseenter', function(){
    //mouseenter
    $('ul li img').addClass('.DarkHighlight');
    });
  //mouseleave
  $('#robots').on('mouseleave', function(){
    $('ul li img').css('background-color', '');
  });
});

$(function(){
  $('#hardware').on('mouseenter mouseleave mouseup', function(){
    //mouse events
    $('this').toggleClass('.DarkHighlight');
    $('this').css('cursor', 'pointer');
    });
  //mouseleave
  $('#hardware').on('mouseleave', function(){
    $('label input').css('background-color', '');
  });
});
$(function(){
  $('.searchbox').keyup(function() {
   var searchText = $(this).val();
   $('#robots li').each(function() {
      console.log($(this).text());
      var string = $(this).text();
      if(string.indexOf(searchText) ==1) {
        $(this).show();
      } else {
        $(this).hide();
      }
   });
});
})
