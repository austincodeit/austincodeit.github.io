/*!
 * custom javascript script for github page
 */


$(document).ready(function() {
  'use strict';

	const DATE_STRING = "November 2018";
    let welcomeText = ""+
"    _             _   _           ____          _\n"+
"   / \\  _   _ ___| |_(_)_ __     / ___|___   __| | ___\n"+
"  / _ \\| | | / __| __| | '_ \\   | |   / _ \\ / _' |/ _ \\ \n"+
" / ___ \\ |_| \\__ \\ |_| | | | |  | |__| (_) | (_| |  __/ \n"+
"/_/   \\_\\__,_|___/\\__|_|_| |_|   \\____\\___/ \\__,_|\\___|\n"+
"███████████████████████████████████████████████████████\n"+
"███████████████████████████████████████████████████████";

    let b = "color: white; font-weight: regular;  background-color: #cca349;padding: 2px";
    let n = "color: black; font-weight: bold; background-color: white; padding: 1px";

	console.log(welcomeText)
    console.log("%c#######################################################", b);
    console.log("%c#######%c hi! welcome to austin code's github!!! %c#######", b,n,b);
    console.log("%c#######################################################", b);
	$("#footnoteInsert").html(''+
      '<span class="label label-default">Last Update: '+
        '<span id="dateString">'+DATE_STRING+'</span>'+
      '</span>');

  // $("#navbarInsert").html('<div class="container">'+
  //     '<div class="navbar-header">'+
  //       '<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">'+
  //           '<span class="sr-only">Toggle navigation</span>'+
  //           '<span class="icon-bar"></span>'+
  //           '<span class="icon-bar"></span>'+
  //           '<span class="icon-bar"></span>'+
  //       '</button>'+
  //           '<a class="navbar-brand" href="#">Austin Code</a>'+
  //       '</div>'+
  //     '<div id="navbar" class="navbar-collapse collapse">'+
  //       '<ul class="nav navbar-nav">'+
  //             '<li><a href="index.html">Home</a></li>'+
  //             '<li><a href="about.html">About</a></li>'+
  //             '<li class="active"><a href="resources.html">Resources</a></li>'+
  //             '<li><a href="maps.html">Maps</a></li>'+
  //             '<li><a href="demographics.html">Demographics</a></li>'+
  //           '<li><a href="news.html">News</a></li>'+
  //         '</ul>'+
  //     '</div>'+
  //     '<!--/.nav-collapse -->'+
  // '</div>)');
  //
  // // $("#navbarInsert").val()

 });
