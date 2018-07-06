// jQuery
$(document).ready(function(){
    // console.log('ready..')

    // if start at MY LOCATION???


    let sendMapToMobile = function(){
      let _destinationsA = global_pdf.route_stops;
      let mobile_start = "comgooglemaps://?saddr=My+Location";
      let mobile_end = "";
      let midpoints = "";
      // console.log(destinations.length);
      for (let i = 0; i < _destinationsA.length; i++){
        // console.log(i)
        // console.log(destinations[i]);
        if (i == _destinationsA.length - 1){
          mobile_end = "&daddr="+_destinationsA[i].lat+","+_destinationsA[i].lng+"";
        } else {
          midpoints += "+to:"+_destinationsA[i].lat+","+_destinationsA[i].lng+"";
        }
      }
      // for each wypt
      //   midpoint+="+to:"+locale
      let href = mobile_start+mobile_end+midpoints+"&views=traffic";
        // window.location("comgooglemaps://?saddr=Austin,TX&daddr=Mason,TX+to:Elgin,TX+to:Temple,TX&views=traffic");

      window.open(href);
      // console.log(global_pdf.route_stops);
      // console.log(href);
    }

    let _ye1k = 'AIzaSyBkX7t3wj7BDkky2ZxOv52yNFeztG5sAeQ',
        _ye2k = 'AIzaSyC4To8GZj9511LEiP7H2lhyWSk81z2RP2g',
        _ye3k = 'AIzaSyBDFgM9Whn_J7swb8KylqBNWgk7rmAUNqo',
        _ye4k = 'AIzaSyCE73DP1P7-HCe-3-SmzTcezkhq444LiJE',
        _ye5k = 'AIzaSyDbgsx9ceKjhLM5_IEg87b2wtiqChtKCJY';
    let _ye0ks = [_ye1k, _ye2k, _ye3k, _ye4k, _ye5k];

    let openGoogleUrlDialog = function(){
      let _destinationsB = global_pdf.route_stops;
      let google_url_start = "https://www.google.com/maps/dir/";
      let urlWayPoint = "";
      // console.log(destinations.length);
      for (let i = 0; i < _destinationsB.length; i++){
        urlWayPoint += ""+_destinationsB[i].lat+","+_destinationsB[i].lng+"/";

      }
      let _selectedYek = _ye0ks[Math.floor(Math.random() * 5)] //randomly select key
      let postUrl = "https://www.googleapis.com/urlshortener/v1/url?&key=" + _selectedYek;
      let _longUrl = google_url_start+urlWayPoint+"&views=traffic";

      ///make request to google shorterner API service
      $.ajax({
        url: postUrl,
        type: "POST",
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        data: '{ longUrl: "' + _longUrl +'"}',
      }).done(function(data) {
        // console.log(data)
        
        $("#google_url_input").val(data.id);
        $("#google_url_link").html("<a href="+data.id+" target='_blank'>Open in Google Maps: "+data.id+"</a>");

        $("#urlDialog").show();
        $( "#urlDialog" ).dialog({
            width: 500,
            close: function( event, ui ) {
                
              $("#urlDialog").hide();
              $("#google_url_link").html("");
            }
        });
        
      }); //end of ajax request
    
    }

    $("#mobileFunc").on('click', function() {
      // console.log('printing....');
      sendMapToMobile();
    });
    
    $("#getGoogleUrl").on('click', function() {
      // console.log('printing....');
      openGoogleUrlDialog();
    });
    
    $("#urlDialog").hide(); //need to hide urlDialog modal at start of application load
    $("#close-url-modal").on('click', function(){
        // console.log('dialog closed')        
        // close dialog box on click
        $("#urlDialog").dialog("close");
        $("#urlDialog").hide();
    });

    $("#copy-url-from-modal").on('click', function(){
      var copyText = document.getElementById("google_url_input");
      // console.log(copyText);
      copyText.select();
      document.execCommand("Copy");
      // alert("Copied the text: " + copyText.value);
      $("span#routeToolTip.tooltiptext").html("Copied: " + copyText.value );
    });
    $("#copy-url-from-modal").mouseout(function() {
      $("span#routeToolTip.tooltiptext").html("Copy to Clipboard");
    });
});
