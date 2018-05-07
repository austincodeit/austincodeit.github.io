/**
 * this app is broken up into several modules:
 * _initTasks - functions to run at the start of the application
 * _openDataLoader - functions, variables used for grabbing stuff from the socrata API
 * _mapMod - functions, variables used for connecting with the various google APIs
 * _printMod - functions, variables used for printing or creating output variables about the route created
 * _tableMod - functions, variables used for working with the two tables on the left side of the screen
 * _mobileMod - functions, variables used for getting route details and sending a final link to your phone
 * _utilityMod - functions, variables that are helper tasks
 * _dangerDogs - functions, variables related to the search for dangerous dogs
 */

(function($, _) {

        //this is a custom style you can get at snazzymaps.com really easy to create one and add it to your map.
        let snazzySyle = [{"stylers":[{"saturation":-100},{"gamma":1}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"saturation":50},{"gamma":0},{"hue":"#50a5d1"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#333333"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"weight":0.5},{"color":"#333333"}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"gamma":1},{"saturation":50}]}];
        let nightStyle = [{elementType:"geometry",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.fill",stylers:[{color:"#746855"}]},{elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},{featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi.park",elementType:"geometry",stylers:[{color:"#263c3f"}]},{featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#6b9a76"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#212a37"}]},{featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#9ca5b3"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{color:"#746855"}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#1f2835"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#f3d19c"}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#2f3948"}]},{featureType:"transit.station",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#515c6d"}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{color:"#17263c"}]}];
        /**
         * inittial load section
        */
        let _initTasks = {
            all: function(){
                this.clickEvents();
                this.keyPress();
                this.responsive();
                _printMod.initPrintMod();
                _openDataLoader.getOpenData();
                _utilityMod.initUtilityMod();
                _tableMod.initTableMod();
                _mapMod.initialize();

            },
            appStart: Date.now(),
            clickEvents: function(){
                $("#loadTaskList").on('click', _tableMod.loadTaskList )
                $("#smart-routing-on").on('click', _mapMod.smartRoutingOn )
                $("#smart-routing-off").on('click', _mapMod.smartRoutingOff )

                //user clicked the create route button
                $("#createRoute").on('click', _mapMod.createRoute);
                //user clicked the rest button, so we start over
                $("#resetList").on('click', _mapMod.resetList);
                //drop down seleection made
                $("#dropdownChoice > li").on('click', function() {
                    let addressValue = $(this).attr('val');
                    _mapMod.addAddressFromInput(addressValue + ", Austin, TX");
                });
                //user enter a new address and clicked the add button
                $("#addNewAddress").on('click', function() {
                    if ($("#addressInput").val().length >= 5) {
                        let addressValue = $("#addressInput").val().replace(/[.#!$%\^&\*;:{}=\-_`~()]/g,"").trim()
                        _mapMod.addAddressFromInput(addressValue);
                        $("#addressInput").val('');
                    }
                });
                $("#mobileFunc").on('click', _mobileMod.sendMapToMobile );
                  
                $("#getGoogleUrl").on('click', _mobileMod.openGoogleUrlDialog );
                  
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
                   

            },
            keyPress: function(){
                $(document).keypress(function(e) {
                    //if user presses enter while focused on input field
                    if (e.which == 13 && $("#inspectorID:focus").val()) {
                      //if input value has contents greater than 5
                      if ($("#inspectorID:focus").val().length >= 2) {
                        //trigger addNewAddress click event
                        $("#loadTaskList").trigger("click");
                      }
                    }
                    //if user presses enter while focused on input field
                    if (e.which == 13 && $("#addressInput:focus").val()) {
                        //if input value has contents greater than 5, check address
                        if ($("#addressInput:focus").val().length >= 5) {
                            //trigger addNewAddress click event
                            $("#addNewAddress").trigger("click");
                        }

                    }

                  });
            },
            responsive: function() {
                //function needed for mobile changes
                _utilityMod.$window = $(window);

                //when the window is resized, if it is mobile sized width, we update the UI
                _utilityMod.$window.resize(function resize() {
                    $draggableTable1 = $('#availableAddressRows > tr');
                    $draggableTable2 = $('#routableAddressRows > tr');
                    $mobileAddButton = $('#availableAddressRows > tr > td.first > a');
                    if (_utilityMod.$window.width() < 768) {
                    $mobileAddButton.addClass('mobileAdd');
                    $draggableTable1.addClass('mobile');
                    return $draggableTable2.addClass('mobile');
                    }
                    $mobileAddButton.removeClass('mobileAdd');
                    $draggableTable1.removeClass('mobile');    $draggableTable2.removeClass('mobile');

                }).trigger('resize');
            }
        }
        
        let _openDataLoader = {
            appToken: "AmHlGm0OHBl6r4hg0PLvAtJk7",
            appRecordLimit: 8500,
            doNotInclude: ['Todd Wilcox', 'Viola Ruiz', 'Marcus Elliott', 'Tammy Lewis', 'Kendrick Barnett' ],
            openDataLink: 'https://data.austintexas.gov/resource/czdh-pagu.json',
            openData: [],
            getOpenData: function( ) {
                $.ajax({
                    url: this.openDataLink,
                    type: "GET",
                    data: {
                      "$limit": this.appRecordLimit,
                      "$$app_token": this.appToken
                    }
                }).done(function(data) {
                    // console.log(data);
                    let nameArray = _.chain(data).pluck('assigneduser').uniq().value();
                    //names we don't want to map
                    let removeArray = _openDataLoader.doNotInclude;
                    // console.log(removeArray);
                    let filterArray = nameArray.filter(function(name){
                        // console.log(name);
                        if (removeArray.indexOf(name) < 0){
                            return name;
                        }
                    })
                    //set up autocomplete w jquery ui plugin
                    $("#inspectorID").autocomplete({
                      source: filterArray
                    });
                    //assign results object to higher variable for search purposes...
                    _openDataLoader.openData = data;
                })
            }
        }

        let _mapMod = {
            addressMarkerArray: [],
            addAddressFromInput: function(address) {
                $("#routableAddressRows").append('<tr>' +
                    '<td class="first"><span id="count"></span>' +
                    '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                    '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                    '</button>----</td>' +
                    //   '<td class="b">temp</td>' +
                    '<td class="b">n/a</td>' +
                    '<td class="c">temp: (' + address + ')</td>' +
                    '<td class="a">----</td>' +
                    '<td class="a">----</td>' +
                    '<td class="a">----</td>' +
                    '<td class="a">----</td>' +
                    '<td class="c">----</td>' +
                    '<td class="c" id="location">' + address + '</td>' +
                    '<td class="a">----</td>' +
                    '<td class="a">----</td>' +
                    '</tr>');
                //grab the active element because we want to be able to append to it later...
                _utilityMod.$activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                _tableMod.validateRemoveButton()
                _tableMod.adjustRowCount();
                this.placeAddressOnMap(address, address, false);
            },
            addMarker: function(location, popUpText, sort){
                let labelObject;
                if (this.iconCount == 0) {
                    labelObject = {
                        color: 'black',
                        fontSize: '11px',
                        fontWeight: '700',
                        text: 'START'
                    };
                } else {
                    labelObject = {
                        color: 'black',
                        fontSize: '11px',
                        fontWeight: '700',
                        text: this.labels[this.iconCount % this.labels.length]
                    };
                }
                // Add the marker at the clicked location, and add the next-available label
                // from the array of alphabetical characters.
                let newMarker = new google.maps.Marker({
                    position: location,
                    label: labelObject,
                    map: this.myMap,
                    draggable: true //set to false to make items not dragganble
                })
                let infowindow = new google.maps.InfoWindow({
                    content: popUpText
                });
                newMarker.addListener('click', function() {
                    infowindow.open(this.myMap, newMarker);
                });
                this.addressMarkerArray.push(newMarker);
                //attach the lat lng to the element
                if (!$(_utilityMod.$activeElement).attr('val')) {
                    // console.log(location);
                    if (typeof location.lat === "function"){
                        $(_utilityMod.$activeElement).attr('val', location);
                    } else {
                        $(_utilityMod.$activeElement).attr('val', "(" + location.lat +","+ location.lng +")");
                    }
                }
                this.iconCount = this.iconCount + 1;
                this.adjustMapBounds();
                if (sort) {
                    _mapMod.updateMarkerOrder(sort);
                }
            },
            calculateAndDisplayRoute: function() {
                //1. show actionable buttons
                // $("#app-actions").show();
                //clear existing points
                _mapMod.updateMarkerOrder(null);
                // directionsDisplay.setMap(null);
                this.addressMarkerArray = [];
                this.directionsDisplay.setMap(this.myMap);
                _printMod.route_stops = [];
                let waypts = [],
                    start = '',
                    finish = '',
                    caseArray = [],
                    locationArray = [],
                    peopleArray = [],
                    fpArray = [],
                    ppArray = [];
                // grab addresses from elements
                let $addressRowSelection = $("#routableAddressRows > tr:not(.placeholder)");
                // console.log(addressRowSelection);
                $('#directions-panel').html('');
                let summaryPanel = document.getElementById('directions-panel');
                //loop through list and sort into waypoints, start, and last
        
                $addressRowSelection.each(function(i) {
                    //grab text and trim whitespace
                    // console.log()
                    
                    let locationVal = $(this).children("td#location").attr('val');
                    // console.log("locationVal",locationVal);
                    if (locationVal === null || locationVal === undefined){
                        // console.log("value is null",$(this).children("td#pointLat").text().trim())
                        locationVal = '('+$(this).children("td#pointLat").text().trim()+','+$(this).children("td#pointLng").text().trim()+')'
                    }
                    // console.log(locationVal);
                    let latLngObj = _utilityMod.extractLATLNG(locationVal);
                    caseArray.push($(this).children("td").eq(1).text());
                    locationArray.push($(this).children("td#location").text().trim());
                    peopleArray.push($(this).children("td").eq(7).text().trim());
                    fpArray.push($(this).children("td").eq(3).text().trim());
                    ppArray.push($(this).children("td").eq(4).text().trim());
                    // console.log('calculating route...');
                    // console.log($(this).children("td#location").text().trim());
                    // console.log(latLngObj);
                    _printMod.route_stops.push(latLngObj);
    
        
                    //if it's #1 it's start location, if it's last it's finish, else it's waypoint
                    if (i == 0) {
                        start = new google.maps.LatLng(latLngObj.lat, latLngObj.lng);
                    } else if (i == ($addressRowSelection.length - 1)) {
                        finish = new google.maps.LatLng(latLngObj.lat, latLngObj.lng);
                    } else {
                        waypts.push({
                            location: new google.maps.LatLng(latLngObj.lat, latLngObj.lng),
                            stopover: true
                        });
                    }
                });
        
                //update object for PDF printing purposes
                _printMod.start = locationArray[0];
                _printMod.end = locationArray[locationArray.length - 1];
                _printMod.tasks = [];
                _mapMod.timeOfDeparture = new Date(Date.now() + 1000);
                //google's direction service
                // console.log(_mapMod.smartRoutingOption)
                this.directionsService.route({
                    origin: start, //document.getElementById('start').value,
                    destination: finish, //document.getElementById('end').value,
                    waypoints: waypts,
                    optimizeWaypoints: _mapMod.smartRoutingOption, //uncomment and it will make the best route for you....
                    drivingOptions: {
                        departureTime: _mapMod.timeOfDeparture,
                        trafficModel: 'bestguess'
                    },
                    travelMode: 'DRIVING'
                }, function(response, status) {
        
                    if (status === 'OK') {
                        //if we get an OK response, add the directions, and show the appropriate elements
                        _mapMod.directionsDisplay.setDirections(response);
        
                        let route = response.routes[0];
                        _printMod.route_path = response.routes[0].overview_polyline;
        
                        let timeCalc = 0,
                            distanceCalc = 0;
                        // For each route, display summaryinformation.
                        for (let i = 0; i <= route.legs.length; i++) {
                            let routeSegment = i - 1;
                            let legDistance, legDuration;
                            if (i == 0) {
                                legDistance = 0;
                                legDuration = 0;
                                summaryPanel.innerHTML += '<b>Start: ' + locationArray[i] + ' | ' + caseArray[i] + '</b><br>';
                                summaryPanel.innerHTML += 'People: ' + peopleArray[i] + '<br><hr><br>';
                            } else {
                                //convert text into numbers so we can add stuff
                                timeCalc += Number(route.legs[routeSegment].duration.text.replace(/[a-z]+/g, '').trim());
                                distanceCalc += Number(route.legs[routeSegment].distance.text.replace(/[a-z]+/g, '').trim());
                                legDistance = route.legs[routeSegment].distance.text;
                                legDuration = route.legs[routeSegment].duration.text;
                                summaryPanel.innerHTML += '<b>#' + i + '. ' + locationArray[i] + ' | ' + caseArray[i] + '';
                                summaryPanel.innerHTML += '<span id="routeTripTime" class="leg' + i + '"><b>Est. Trip:</b> ' + legDuration + ' | <b>Distance:</b> ' + legDistance + '</span></b><br>';
                                summaryPanel.innerHTML += 'People: ' + peopleArray[i] + '<br><hr><br>';
                            }
                            //update global_pdf object for printing purposes
                            _printMod.tasks.push({
                                folder: locationArray[i],
                                folder_num: caseArray[i],
                                fp: fpArray[i],
                                pp: ppArray[i],
                                people: peopleArray[i],
                                leg_dist: legDistance,
                                leg_time: legDuration
                            });
        
                        }
                        //update global pdf
                        _printMod.trip_dist = "" + distanceCalc.toPrecision(2);
                        _printMod.trip_time = "" + timeCalc.toPrecision(2);
                        summaryPanel.innerHTML += '<span id="finalRouteStats"><b>Trip Time:</b> ' + timeCalc.toPrecision(2) + ' mins | <b>Trip Distance:</b> ' + distanceCalc.toPrecision(2) + ' mi</span>';
                        _printMod.map_center = String(_mapMod.myMap.getCenter().toUrlValue());
                        _printMod.map_zoom = String(_mapMod.myMap.getZoom());
                        // console.log(global_pdf);
                    } else if (status === 'MAX_WAYPOINTS_EXCEEDED') {
                        window.alert('Directions request failed due to ' + status + '\nThe limit is 22.');
                        summaryPanel.innerHTML = '';
                    } else if (status === 'OVER_QUERY_LIMIT') {
                        window.alert('Directions request failed due to ' + status + '\nToo many queries. Contact IT Code Support.');
                        summaryPanel.innerHTML = '';
                    } else if (status === 'UNKNOWN_ERROR') {
                        window.alert(status + '\nRefresh page and try again!');
                        summaryPanel.innerHTML = '';
                    } else {
                        window.alert('Directions request failed due to ' + status);
                        summaryPanel.innerHTML = '';
                    }
                    //remove animation
                    _utilityMod.routeEndAnimation();

                    //make button active
                    $("#createPDF").prop('disabled', false);
                    $("#createPDF").addClass('btn-primary');
                    $("#createPDF").removeClass('btn-default');
                    //make button active
                    $("#getGoogleUrl").prop('disabled', false);
                    $("#getGoogleUrl").addClass('btn-primary');
                    $("#getGoogleUrl").removeClass('btn-default');
                    //setup mobile activity as well
                    $("#mobileApp").prop('disabled', false);
                    $("#mobileApp").addClass('btn-primary');
                    $("#mobileApp").removeClass('btn-default');
        
                });
        
            },
            createRoute: function() {
                //add loading animation
                $("#map").prepend('<div id="loading-route-overlay">' +
                    '<section class="loaders">' +
                    '<span class="loader loader-route-quart"> </span> Generating Route...' +
                    '</section>' +
                    '</div>');
                    _mapMod.calculateAndDisplayRoute();
            },
            resetList: function() {
                //clear available task list items
                $("#availableAddressRows").html("");
                $("#directions-panel").html("");
                //clear routable addresses
                let $divGroup = $("#routableAddressRows > tr:not(.placeholder)");
                $divGroup.each(function(i) {
                    $(this).remove()
                });
                _tableMod.adjustRowCount();
                //remove markers from map
                this.updateMarkerOrder(null);
                this.directionsDisplay.setMap(null);
                //reset button actions
                $("#createPDF").prop('disabled', true);
                $("#createPDF").removeClass('btn-primary');
                $("#createPDF").addClass('btn-default');
                //reset button actions
                $("#getGoogleUrl").prop('disabled', true);
                $("#getGoogleUrl").removeClass('btn-primary');
                $("#getGoogleUrl").addClass('btn-default');
                //reset mobile activity as well
                $("#mobileApp").prop('disabled', true);
                $("#mobileApp").removeClass('btn-primary');
                $("#mobileApp").addClass('btn-default');
        
                this.addressMarkerArray = [];
                this.iconCount = 0;
                $(".header-row th").removeClass("headerSortUp");
                $(".header-row th").removeClass("headerSortDown");
                this.initialize();
            },
            iconCount: 0,
            labels: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            timeOfDeparture: 0,
            smartRoutingOption: true,
            smartRoutingOn: function(){
                //turn smart routing off when you click the button
                $(this).hide();
                $("#smart-routing-off").show();
                _mapMod.smartRoutingOption = false;
            },
            smartRoutingOff: function(){
                //turn smart routing on when you click the button
                $(this).hide();
                $("#smart-routing-on").show();
                _mapMod.smartRoutingOption = true;
            },
            taskListMarkerArray: [],
            myLatLng: {
                lat: 30.3344316,
                lng: -97.6791038
            },
            myMap: function(){},
            directionsService: function(){},
            directionsDisplay: function(){},
            getTaskIcon: function(folderType) {
                let iconFill = '#0CB';
                let iconStroke = '#008C80';
                let iconWeight = 1;
        
                //a CV is an active case, which means they have already been there...
                if (folderType === 'CV'){
                    iconFill = '#CC4300';
                    iconStroke = '#7F2A00';
                    iconWeight = 1;
                }
        
                let taskIcon = {
                    path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
                    fillColor: iconFill,
                    fillOpacity: 0.8,
                    scale: 0.35,
                    strokeColor: iconStroke,
                    strokeWeight: iconWeight
                };
        
                return taskIcon;
            },
            tasklistComplete: function() {
                $("#progress-group").css("height", "0px");
            },
            geocoder: function(){},
            initialize: function(){
                if (typeof google !== 'object') {
                    //if google is undefined loop back until it is loaded...
                    setTimeout(function() {
                        _mapMod.initialize();
                    }, 1000)
                };
                let myMapOptions = {
                    zoom: 14,
                    center: new google.maps.LatLng(this.myLatLng.lat,this.myLatLng.lng),
                    mapTypeControlOptions: {
                        mapTypeIds: ['roadmap', 'satellite', 'style_a', 'style_b']
                    }
                }
                this.myMap = new google.maps.Map(document.getElementById('map'), myMapOptions);
                this.directionsService = new google.maps.DirectionsService;
                this.directionsDisplay = new google.maps.DirectionsRenderer({
                    draggable: true, //will provide 'true' option in future,
                    map: _mapMod.myMap
                });
                this.geocoder = new google.maps.Geocoder();
                //Resize Function
                google.maps.event.addDomListener(window, "resize", function() {
                    let center = _mapMod.myMap.getCenter();
                    google.maps.event.trigger(_mapMod.myMap, "resize");
                    _mapMod.myMap.setCenter(center);
                });
                //listener for anytime the markers or path is moved to update the display
                this.directionsDisplay.addListener('directions_changed', function() {
                    // if this has already been run, skip
                    if (_printMod.trip_dist !== 0) {
                        //need to update time and distance...
                        _mapMod.timeOfDeparture = new Date(Date.now() + 1000);
                        _mapMod.updateDirectionsDisplay(_mapMod.directionsDisplay.getDirections());
                    }
                });

                let mapStyle1 = new google.maps.StyledMapType(snazzySyle, {
                    name: 'Grey Scale'
                });
                let mapStyle2 = new google.maps.StyledMapType(nightStyle, {
                    name: 'Night Mode'
                });
                //Associate the styled map with the MapTypeId and set it to display.
                this.myMap.mapTypes.set('style_a', mapStyle1);
                this.myMap.mapTypes.set('style_b', mapStyle2);
                this.myMap.setMapTypeId('style_a');
                // map.setMapTypeId('style_b');
            },
            mapTaskListItem: function(_obj) {
                
                let yek1 = 'AIzaSyBXAnW9slEyfpkJKdHxnz_29kF8pn14MA0',
                    yek2 = 'AIzaSyALPWxESCeijSKpKHoduW0htKA6w0KIJnc',
                    yek3 = 'AIzaSyBbnhwYIXT-MBTVIaDxS9kzbqIOmoeqcRU',
                    yek4 = 'AIzaSyCRQEeXDjgRjRX7HVyGFLDQXCzlrty1NxI',
                    yek5 = 'AIzaSyDgR0LEtKMow--eiBeyiCbypLhDMAKCE8E',
                    yek6 = 'AIzaSyC6ag7eWl7tjpaLo94L3w2LYZO41vklZC8';
                let yeks = [yek1, yek2, yek3, yek4, yek5, yek6];
                let list = _obj;
                let taskListTotal = _obj.length;
                let arrayPos = 0;
                let progressNumber = 0;
                $("#progress-group").css("height", "20px");
        
                this.myMap.panTo(new google.maps.LatLng(30.2709246, -97.7481116));
                this.myMap.setZoom(11);

                function addressLoop() {
                    if (arrayPos >= list.length) {
                        _mapMod.tasklistComplete();
                        return;
                    }
                    progressNumber = Math.floor((arrayPos / taskListTotal) * 100);
                    $("#progress-bar").css("width", "" + progressNumber + "%");
                    $("#progress-value").html("" + progressNumber + "%");
        
                    let addressSearch = list[arrayPos]['foldername'];
                    let longitude = list[arrayPos]['longitude'];
                    let latitude = list[arrayPos]['latitude'];
                    if (latitude.length > 1) { //if the records has a X/Y 
                        let newTaskMarker = new google.maps.Marker({
                            position: _utilityMod.extractLATLNG('('+latitude+','+longitude+')'),
                            icon: _mapMod.getTaskIcon(list[arrayPos].type),
                            map: _mapMod.myMap,
                            draggable: false //set to false to make items not dragganble
                        });
                        let popUpWindow = "<div><p>Folder: " + list[arrayPos].foldernumber + "</p><p>" + 
                                    "Address: " + list[arrayPos].foldername + 
                                    "</p><button style='width:100%' id=" + list[arrayPos].foldernumber + " class='popup btn btn-primary btn-sm'>Add</button></div>";
                        let infowindow = new google.maps.InfoWindow({
                            content: popUpWindow
                        });
                        newTaskMarker.addListener('click', function() {
                            infowindow.open(_mapMod.myMap, newTaskMarker);
        
                            $("button.popup").unbind('click').bind('click', function(e){
                                let id = e.target.id;//folder number of address
                                if (id.length < 1){
                                    return;
                                }
                                let $tableRow = $("#availableAddressRows tr").children("td#"+id+"").parent()[0];
                                let newAddress = $($tableRow).children("td#location").text().trim() + ", Austin, TX";
                                let popUpText = $($tableRow).children("td#location").text().trim();
                                //get the element so we can add latlngs to it later
                                $activeElement = $($tableRow).children("td#location");
                                $("#routableAddressRows").append('<tr>' +
                                      '<td class="first"><span id="count"></span>' +
                                      '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                                      '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                                      '</button>' + $($tableRow).children("td:nth-child(1)").text() + '</td>' +
                                      '<td class="b">' + $($tableRow).children("td:nth-child(2)").text() + '</td>' +
                                      '<td class="c" id="location">' + $($tableRow).children("td:nth-child(3)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(5)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(6)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(7)").text() + '</td>' +
                                      '<td class="c">' + $($tableRow).children("td:nth-child(8)").text() + '</td>' +
                                      '<td class="c">' + $($tableRow).children("td:nth-child(9)").text() + '</td>' +
                                      '<td class="b" id="pointLat">' + $($tableRow).children("td:nth-child(10)").text() + '</td>' +
                                      '<td class="b" id="pointLng">' + $($tableRow).children("td:nth-child(11)").text() + '</td>' +
                                      '</tr>');
                                //grab the active element because we want to be able to append to it later...
                                $activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                                //theses functions help with updates
                                _tableMod.validateRemoveButton();
                                _tableMod.adjustRowCount();
                                // console.log(latitude, longitude);
                                _mapMod.placeLatLngOnMap(_utilityMod.extractLATLNG('('+latitude+','+longitude+')'), popUpText, false);
                                infowindow.close();
                            });
        
                        });
                        _mapMod.taskListMarkerArray.push(newTaskMarker);
                        arrayPos++;
                        addressLoop();
                    } else if (addressSearch.length > 1) { //if the location is not NULL
                        selectedYek = yeks[Math.floor(Math.random() * 6)] //randomly select key
                        let link = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + addressSearch + '+Austin,+TX&key=' + selectedYek;
                        //function to get lat, lng
                        $.ajax({
                            url: link,
                            type: "GET"
                        }).done(function(data) {
                            //when the results are returned...
                            // from the array of alphabetical characters.
                            if (typeof data.results[0] != 'undefined') {
        
                                let newTaskMarker = new google.maps.Marker({
                                    position: {
                                        lat: data['results'][0]['geometry']['location']['lat'],
                                        lng: data['results'][0]['geometry']['location']['lng']
                                    },
                                    icon: _mapMod.getTaskIcon(list[arrayPos].type),
                                    map: map,
                                    draggable: false //set to false to make items not dragganble
                                });
                                let popUpWindow = "<div><p>Folder: " + list[arrayPos].foldernumber + "</p><p>" + "Address: " + list[arrayPos].foldername + "</p><button style='width:100%' id=" + list[arrayPos].foldernumber + " class='popup btn btn-primary btn-sm'>Add</button></div>";
                                let infowindow = new google.maps.InfoWindow({
                                    content: popUpWindow
                                });
                                newTaskMarker.addListener('click', function() {
                                    infowindow.open(map, newTaskMarker);
        
                                    $("button.popup").unbind('click').bind('click', function(e){
                                        let id = e.target.id;//folder number of address
                                        if (id.length < 1){
                                            return;
                                        }
                                        let $tableRow = $("#availableAddressRows tr").children("td#"+id+"").parent()[0];
                                        let newAddress = $($tableRow).children("td#location").text().trim() + ", Austin, TX";
                                        let popUpText = $($tableRow).children("td#location").text().trim();
                                        //get the element so we can add latlngs to it later
                                        $activeElement = $($tableRow).children("td#location");
                                        $("#routableAddressRows").append('<tr>' +
                                              '<td class="first"><span id="count"></span>' +
                                              '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                                              '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                                              '</button>' + $($tableRow).children("td:nth-child(1)").text() + '</td>' +
                                              '<td class="b">' + $($tableRow).children("td:nth-child(2)").text() + '</td>' +
                                              '<td class="c" id="location">' + $($tableRow).children("td:nth-child(3)").text() + '</td>' +
                                              '<td class="a">' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
                                              '<td class="a">' + $($tableRow).children("td:nth-child(5)").text() + '</td>' +
                                              '<td class="a">' + $($tableRow).children("td:nth-child(6)").text() + '</td>' +
                                              '<td class="a">' + $($tableRow).children("td:nth-child(7)").text() + '</td>' +
                                              '<td class="c">' + $($tableRow).children("td:nth-child(8)").text() + '</td>' +
                                              '<td class="c">' + $($tableRow).children("td:nth-child(9)").text() + '</td>' +
                                              '<td class="b" id="pointLat">' + $($tableRow).children("td:nth-child(10)").text() + '</td>' +
                                              '<td class="b" id="pointLng">' + $($tableRow).children("td:nth-child(11)").text() + '</td>' +
                                              '</tr>');
                                        //grab the active element because we want to be able to append to it later...
                                        $activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                                        //theses functions help with updates
                                        _tableMod.validateRemoveButton();
                                        _tableMod.adjustRowCount();
                                        _mapMod.placeAddressOnMap(newAddress, popUpText, false);
                                        infowindow.close();
                                    });
        
                                });
        
                                _mapMod.taskListMarkerArray.push(newTaskMarker);
                            }
                            arrayPos++;
                            addressLoop();
                        });
                    } else {
                        arrayPos++;
                        addressLoop();
                    }
                }
        
                if (arrayPos >= list.length) {
                    _mapMod.tasklistComplete();
                    return;
                } else {
                    addressLoop();
                }
        
        
        
            },
            placeAddressOnMap: function(address, popUpText, sort){
                // function to check if it's on list of dangerous dogs
                _dangerDogs.doggySearch(popUpText);
                console.log(address);
                //geocode and attempt to map
                this.geocoder.geocode({
                    'address': address
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        // console.log(results[0].geometry.location);
                        _mapMod.addMarker(results[0].geometry.location, popUpText, sort);
                        return true;
                    } else {
                        alert('Geocode was not successful for the following reason: ' + status + '\nPlease manually enter the address.');
                        // console.log(activeElement);
                        $(_utilityMod.$activeElement).parent().remove();
                        _tableMod.adjustRowCount();
                    }
                });
            },
            placeLatLngOnMap: function(coords, popUpText, sort) {
                // console.log(coords);
                this.addMarker(coords, popUpText, sort);
                return true;
            },
            updateDirectionsDisplay: function(response) {
                let summaryPanel = document.getElementById('directions-panel');

                let route = response.routes[0];
                _printMod.route_path = response.routes[0].overview_polyline;
                //
                let timeCalc = 0, distanceCalc = 0;
        
                // For each route, display summaryinformation.
                for (let i = 0; i <= route.legs.length; i++) {
                    let routeSegment = i - 1;
                    let legDistance, legDuration;
                    if (i == 0) {
                        legDistance = 0;
                        legDuration = 0;
                    } else {
                        //convert text into numbers so we can add stuff
                        timeCalc += Number(route.legs[routeSegment].duration.text.replace(/[a-z]+/g, '').trim());
                        distanceCalc += Number(route.legs[routeSegment].distance.text.replace(/[a-z]+/g, '').trim());
                        legDistance = route.legs[routeSegment].distance.text;
                        legDuration = route.legs[routeSegment].duration.text;
                        //update the stats for this particular leg by using a unique ID
                        $(".leg" + i + "").html('<span id="routeTripTime"><b>Est. Trip:</b> ' + legDuration + ' | <b>Distance:</b> ' + legDistance + '</span></b><br>');
                        // console.log('new leg??? ' + legDuration);
                    }
                    //update global_pdf object for printing purposes
                    if (_printMod.tasks.length > 0){
                        _printMod.tasks[i].leg_dist = legDistance;
                        _printMod.tasks[i].leg_time = legDuration;
                    }
        
                }
        
                //update global pdf
                _printMod.trip_dist = "" + distanceCalc.toPrecision(2);
                _printMod.trip_time = "" + timeCalc.toPrecision(2);
                $("#finalRouteStats").html('<span id="finalRouteStats"><b>Trip Time:</b> ' + timeCalc.toPrecision(2) + ' mins | <b>Trip Distance:</b> ' + distanceCalc.toPrecision(2) + ' mi</span>');
                _printMod.map_center = String(_mapMod.myMap.getCenter().toUrlValue());
                _printMod.map_zoom = String(_mapMod.myMap.getZoom());
            },
            updateMarkerOrder: function(sort){
                if (sort) {
                    //reorder markers by drawing new markers
                    let $addressRowSelection = $("#routableAddressRows > tr:not(.placeholder)");
                    // first empty the array and clear map
                    for (let i = 0; i < _mapMod.addressMarkerArray.length; i++) {
                        _mapMod.addressMarkerArray[i].setMap(null);
                    }
                    _mapMod.addressMarkerArray = [];
                    this.iconCount = 0;
        
                    $addressRowSelection.each(function(elem) {
                        let locationVal = $(this).children("td#location").attr('val');
                        // console.log("locationVal",locationVal);
                        if (locationVal === null || locationVal === undefined){
                            // console.log("value is null",$(this).children("td#pointLat").text().trim())
                            locationVal = '('+$(this).children("td#pointLat").text().trim()+','+$(this).children("td#pointLng").text().trim()+')'
                        }
                        // console.log(locationVal);
                        let latLngObj = _utilityMod.extractLATLNG(locationVal);
                        let popUpText = $(this).children("td#location").text().trim();
                        // console.log(latLngObj);
                        _mapMod.addMarker(latLngObj, popUpText)
                        // newMarkerLocations.push( $(this).children("td#location").attr('val') );
                    });
                } else {
                    for (let i = 0; i < _mapMod.addressMarkerArray.length; i++) {
                        _mapMod.addressMarkerArray[i].setMap(null);
                    }
        
                    for (let i = 0; i < _mapMod.taskListMarkerArray.length; i++) {
                        _mapMod.taskListMarkerArray[i].setMap(null);
                    }
                }
            },
            adjustMapBounds: function(){
                if (this.addressMarkerArray.length <= 1) {
                    //move map to singular point
                    _mapMod.myMap.setCenter(_mapMod.addressMarkerArray[0].getPosition());
                } else {
                    let bounds = new google.maps.LatLngBounds();
                    // showing only 2 visible 1 hidden (because of markers.length-1)
                    for (let i = 0; i < _mapMod.addressMarkerArray.length; i++) {
                        // extending bounds to contain this visible marker position
                        bounds.extend(_mapMod.addressMarkerArray[i].getPosition());
                    }
                    // setting new bounds to visible markers of 2
                    _mapMod.myMap.fitBounds(bounds);
                }
            },
            removeSpecificMarker: function(rowIdx){
                _mapMod.iconCount = _mapMod.iconCount - 1;
                _mapMod.addressMarkerArray[rowIdx].setMap(null);
                _mapMod.addressMarkerArray.splice(rowIdx, 1);
            }
            
        };

        let _printMod = {
            name: '',
            datestamp: 0,
            timestamp: 0,
            trip_dist: 0, 
            trip_time: 0,
            start: [],
            end: [],
            tasks: [],
            map_center: 0,
            map_zoom: 0,
            route_path: '',
            route_stops: [],
            initPrintMod: function(){
                this.name = '';
                this.datestamp = _utilityMod.dateFormatting(Date.now());
                this.timestamp = new Date().toLocaleTimeString();
            },
            setName: function(choseName){
                this.name = choseName;
            }
        }

        let _tableMod = {
            initTableMod: function(){
                this.initDragula();
                this.addPlaceholderRows(0);
                
                //enable the tablesorter.js
                $("#availableAddressTable").tablesorter({
                    // third click on the header will reset column to default - unsorted
                    sortReset: true,
                    // Resets the sort direction so that clicking on an unsorted column will sort in the sortInitialOrder direction.
                    sortRestart: true
                });     
            },
            addPlaceholderRows: function(rowCount) {
                //we always want at least 10 rows (placeholders or real rows)
                for (let i = rowCount; i < 10; i++) { //10 rows
                    let newRow = '<tr class="placeholder">';
                    for (let j = 0; j < 11; j++) { //11 columns
                        newRow += '<td id="no">&nbsp;</td>';
                    }
                    newRow += '</tr>';
                    $("#routableAddressRows").append(newRow);
                    newRow = '';
                }
            },
            adjustRowCount: function(){
            //check for placeholder rows (this is a bug fix essentially...)
                $("#routableAddressRows > tr.placeholder").remove()

                let $divGroup = $("#routableAddressRows > tr");
                let arrayLength = $("#routableAddressRows > tr:not(.placeholder) ").length;

                // disable or enable route button based on number of addresses available
                if (arrayLength >= 2) {
                    $("#createRoute").prop('disabled', false);
                    $("#createRoute").addClass('btn-primary');
                    $("#createRoute").removeClass('btn-default');
                } else {
                    $("#createRoute").prop('disabled', true);
                    $("#createRoute").removeClass('btn-primary');
                    $("#createRoute").addClass('btn-default');
                }

                //adjust list CSS #s
                $divGroup.each(function(i) {
                    if (i == 0) {
                        $(this).children("td").find("span#count").html('S');
                    } else {
                        $(this).children("td").find("span#count").html(i);
                    }
                });

                //we always want at least 10 rows (placeholders or real rows)
                this.addPlaceholderRows(arrayLength);
            },
            initDragula: function(){
                //dragulaJS provides for the drag and drop functionality
                dragula([document.getElementById("availableAddressRows"), document.getElementById("routableAddressRows")], {
                    copy: function(el, source) {
                        return source === document.getElementById("availableAddressRows")
                    },
                    accepts: function(el, target) {
                        return target !== document.getElementById("availableAddressRows")
                    },
                    moves: function(el, container, handle) {
                        return !el.classList.contains('mobile')
                    },
                    delay: 100,
                    removeOnSpill: false
                }).on('drop', function(el, target, sibling) {
                    //if we drop our element into the correct table, do stuff, otherwise skip it
                    if (target) {
                        if ($(el).children("td").children("button").length) {
                            //if it already has a button skip, we can skip
                            _mapMod.updateMarkerOrder(map);
                        } else {

                            $(el).children("td.first").prepend('' + '<span id="count"></span>' +
                                '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                                '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                                '</button>');
                            //extract a readable text
                            let newAddress = $(el).children("td#location").text().trim() + ", Austin, TX";
                            let popUpText = $(el).children("td#location").text().trim();
                            //get the element so we can add latlngs to it later
                            _utilityMod.$activeElement = $(el).children("td#location");
                            //how many rows exist in the table before the drop?
                            let tableLength = $(target).children("tr:not(.placeholder)").length - 1;
                            
                            //what position did we drop the item?
                            let dropIndex = $(target).children("tr.gu-transit")[0].rowIndex;
                            let sort = false;
                            //if you drop an item inside the existing order, we need to sort
                            if (dropIndex <= tableLength) {
                                // true means sort;
                                sort = true;
                            }
                            //function to place the new address on the map
                            let latitude = $(el).children("td#pointLat").text().trim();
                            let longitude = $(el).children("td#pointLng").text().trim();
                            
                            _mapMod.placeLatLngOnMap(_utilityMod.extractLATLNG('('+latitude+','+longitude+')'), popUpText, sort);
                        }

                        // both of these functions will need to be run either way
                        _tableMod.validateRemoveButton();
                        _tableMod.adjustRowCount();

                    } else {
                        console.log('missed');
                    }
                }).on('drag', function(el) {
                    //adding class to dragging func
                    $(el).css('font-size', '11px');
                    $(el).css('background-color', 'white');
                    $(el).css('border', '1px #ddd solid');
                    $(el).children().css('width', '10%');
                }).on('remove', function(el) {
                    // console.log('item removed...');
                    _tableMod.adjustRowCount();
                    //TO DO - remove from map as well
                });
            },
            loadTaskList: function(){

                $("#availableAddressRows").html("");
                let chosenName = $("#inspectorID").val().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim()
                if ($("#inspectorID").val().length >= 2) {
                  //then reset the value after task list is in the process of loading
                  $("#inspectorID").val('');
                }
                // console.log(_openDataLoader.openData);
                let filteredData = _.filter(_openDataLoader.openData, function(row) { //filter the data returned by assignedUser
                    return row.assigneduser == chosenName;
                })
                // console.log(filteredData);
                //loop through filtered results and append data to table#availableAddressRows
                let uniqueAddressArray = [], filteredAddressArray = [], addCheck;
                $(filteredData).each(function(i) {
                    
                    $("#availableAddressRows").append('<tr>' +
                    '<td class="first">' + _utilityMod.nullCheck(filteredData[i].type) + '</td>' +
                    // '<td class="b">' + nullCheck(filteredData[i].subtype) + '</td>' +
                    '<td class="b" id='+_utilityMod.nullCheck(filteredData[i].foldernumber)+'>' + _utilityMod.nullCheck(filteredData[i].foldernumber) + '</td>' +
                    '<td class="c" id="location">' + _utilityMod.nullCheck(filteredData[i].foldername) + '</td>' +
                    '<td class="a">' + _utilityMod.nullCheck(filteredData[i].priority1) + '</td>' +
                    '<td class="a">' + _utilityMod.nullCheck(filteredData[i].priority2) + '</td>' +
                    '<td class="a">' + _utilityMod.dateFormatting(filteredData[i].duetostart) + '</td>' +
                    '<td class="a">' + _utilityMod.dateFormatting(filteredData[i].duetoend) + '</td>' +
                    '<td class="c">' + _utilityMod.nullCheck(filteredData[i].peoplename) + '</td>' +
                    '<td class="c">' + _utilityMod.nullCheck(filteredData[i].housenumber) + ' ' + _utilityMod.nullCheck(filteredData[i].streetname) + '</td>' +
                    '<td class="b" id="pointLat">' + _utilityMod.nullCheck(filteredData[i].latitude) + '</td>' +
                    '<td class="b" id="pointLng">' + _utilityMod.nullCheck(filteredData[i].longitude) + '</td>' +        
                    '</tr>');
                    
                    /*
                    this section will send these items to the map!!!
                    */
                   //make sure address is NOT NULL
                   addCheck = filteredData[i].foldername;
                   if ( (_utilityMod.nullCheck(addCheck).length > 1) && (uniqueAddressArray.indexOf(addCheck) < 0) ){
                       uniqueAddressArray.push(addCheck);
                       filteredAddressArray.push(filteredData[i])
                    }
                });
                //this will sort by type descendingly, so CC, CV, OL, etc....
                let filteredAndSortedArray = _.sortBy(filteredAddressArray, function(row) { return row.type; })
                // console.log(filteredAndSortedArray);
                _mapMod.mapTaskListItem(filteredAndSortedArray);
                _printMod.setName(chosenName);

                //a nod to the table sort to let it know to check itself
                $('#availableAddressTable').trigger('update');
                //in case we are in mobile we need to freeze the draggable rows and enable the button add.
                _utilityMod.$window.trigger('resize');
                //if we are mobile, we need to add the mobileAdd button and class
                $('#availableAddressRows > tr').children("td.first").prepend('' +
                    '<a type="button" class="btn btn-sm btn-default mobileAdd">' +
                    '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>' +
                '</a>');
                _tableMod.validateAddButton();
            },
            validateAddButton: function(){
                $("a.mobileAdd").unbind('click').bind('click', function(elem) {
                    //for every element in the row...
                    let $tableRow = $(this).parent().parent()[0];
                    let newAddress = $($tableRow).children("td#location").text().trim() + ", Austin, TX";
                    let popUpText = $($tableRow).children("td#location").text().trim();
                    //get the element so we can add latlngs to it later
                    _utilityMod.$activeElement = $($tableRow).children("td#location");
              
                    $("#routableAddressRows").append('<tr>' +
                      '<td class="first"><span id="count"></span>' +
                      '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                      '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                      '</button>' + $($tableRow).children("td:nth-child(1)").text() + '</td>' +
                      '<td class="b">' + $($tableRow).children("td:nth-child(2)").text() + '</td>' +
                      '<td class="c" id="location" >' + $($tableRow).children("td:nth-child(3)").text() + '</td>' +
                      '<td class="a">' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
                      '<td class="a">' + $($tableRow).children("td:nth-child(5)").text() + '</td>' +
                      '<td class="a">' + $($tableRow).children("td:nth-child(6)").text() + '</td>' +
                      '<td class="a">' + $($tableRow).children("td:nth-child(7)").text() + '</td>' +
                      '<td class="c">' + $($tableRow).children("td:nth-child(8)").text() + '</td>' +
                      '<td class="c">' + $($tableRow).children("td:nth-child(9)").text() + '</td>' +
                      '<td class="b" id="pointLat">' + $($tableRow).children("td:nth-child(10)").text() + '</td>' +
                      '<td class="b" id="pointLng">' + $($tableRow).children("td:nth-child(11)").text() + '</td>' +
                      '</tr>');
                    //grab the active element because we want to be able to append to it later...
                    _utilityMod.$activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                    //theses functions help with updates
                    _tableMod.validateRemoveButton();
                    _tableMod.adjustRowCount();
                    _mapMod.placeAddressOnMap(newAddress, popUpText, false);
                })
            },
            validateRemoveButton: function(){
                //unbind and then bind bc internet
                $(".removeAddress").unbind('click').bind('click', function() {
                    let rowIndex = $(this).parents("tr:first")[0].rowIndex;
                    //remove row entry
                    _mapMod.removeSpecificMarker(rowIndex - 1);
                    $(this).parent().parent().remove();
                    _tableMod.adjustRowCount();
                    //everytime we update the order of our rows, we should
                    _mapMod.updateMarkerOrder(map);
                });
            }
    }

        let _mobileMod = {
            sendMapToMobile: function(){
                let _destinationsA = _printMod.route_stops;
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
              },
              openGoogleUrlDialog: function(){
                  
                let _ye1k = 'AIzaSyBkX7t3wj7BDkky2ZxOv52yNFeztG5sAeQ',
                    _ye2k = 'AIzaSyC4To8GZj9511LEiP7H2lhyWSk81z2RP2g',
                    _ye3k = 'AIzaSyBDFgM9Whn_J7swb8KylqBNWgk7rmAUNqo',
                    _ye4k = 'AIzaSyCE73DP1P7-HCe-3-SmzTcezkhq444LiJE',
                    _ye5k = 'AIzaSyDbgsx9ceKjhLM5_IEg87b2wtiqChtKCJY';
                let _ye0ks = [_ye1k, _ye2k, _ye3k, _ye4k, _ye5k];
                let _destinationsB = _printMod.route_stops;
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
        }
        
        let _utilityMod = {
            $activeElement: null,
            $window: null,
            initUtilityMod: function(){
                this.beginLoadAnimation();
                this.everythingIsLoadedYet();
                $("#dogDialog").hide();                
                $("#urlDialog").hide(); //need to hide urlDialog modal at start of application load  
            },
            beginLoadAnimation: function(){
                $("#loading-overlay").fadeIn("slow"); //overlay to pause user interaction
            },
            closeLoadAnimation: function(){
                $("#loading-overlay").fadeOut("slow");
            },
            routeLoadAnimation: function(){
                $("#loading-overlay").fadeIn("slow"); //overlay to pause user interaction
            },
            routeEndAnimation: function(){
                $("#loading-route-overlay").hide('slow', function() {
                    $("#loading-route-overlay").remove();
                });
            },
            everythingIsLoadedYet(){
                let takingTooLong = Date.now() - _initTasks.appStart;
                if (takingTooLong > 6000){
                    window.location.reload(true);
                    return;
                }
                //if everything is loaded remove the overlay and proceed.
                //this function was created because the google api does not load in sync everytime
                if (typeof _mapMod.mapTaskListItem !== 'function') {
                    setTimeout(function() {
                        _mapMod.initialize();
                        _utilityMod.everythingIsLoadedYet();
                        // console.log(mapTaskListItem);
                    }, 2000)
                } else {
                    // console.log("it's ready but we are still going");
                    this.closeLoadAnimation();
                }   
            },
            dateFormatting: function(datestring){
                let _d = new Date(datestring);
                let yr = _d.getFullYear();
                let mth = _d.getMonth() + 1; //january = 0, so we need to +1
                let day = _d.getDate();
                if (isNaN(yr)) {
                  return '';
                } else {
                  return mth + "/" + day + "/" + yr;
                }
            },
            extractLATLNG: function(coords) {
                // console.log(coords);
                let latitude = Number(coords.split(',')[0].trim().slice(1, coords.length));
                let longitude = Number(coords.split(',')[1].trim().slice(0, -1));
                return {
                    lat: latitude,
                    lng: longitude
                };
            },
            nullCheck: function(string) {
                //this function is to change undefined or N/A strings into blanks
                return ( string ? string : '' )
            }       
        }

        let _dangerDogs = {
            openModal: function(){
                $("#dogDialog").show();
            },
            closeModal: function(){
                $("#dogDialog").dialog("close");
                $("#dogDialog").hide();
            },
            doggySearch: function(input){
                //see if address matches any part of the current list:
                // loop through dangerousDogArray
                let foundAddress = this.dangerousDogArray.filter( function(item, idx) {
                    if(input.toUpperCase().indexOf(item.ADDRESS) >= 0){
                        // console.log('found', idx)
                        return item;
                    };
                });
                let dogsFound = '';
                // if address is found in array
                if (foundAddress.length > 0){
                    $("#dogDialog").show();
                    //get array position and alert
                    $("#dog-owner").html(foundAddress[0]["OWNER"]);
                    $("#dog-address").html(foundAddress[0]["ADDRESS"]);
                    for (let i = 0; i < foundAddress.length; i++){
                        dogsFound += (foundAddress[i]["DESCRIPTION"]) +" "
                    }
                    $("#dog-description").html(dogsFound);
                    //CAUTION: FOUND IN DANGEROUS DOGS
                    $( "#dogDialog" ).dialog({
                        width: 500,
                        close: function( event, ui ) {
                            $("#dog-owner").html("");
                            $("#dog-address").html("");
                            $("#dog-description").html("");
                            dogsFound = '';
                            $("#dogDialog").hide();
                        }
                    });
                }
            },
            dangerousDogArray: [
                {
                "ADDRESS":'3415 SWEETGUM',
                "OWNER":'LORENA ZUNIGA',
                "DESCRIPTION":'“MULLIGAN,” NEUTERED MALE, BRINDLE BULLMASTIFF'
                },
                {
                "ADDRESS":'4420 DOVEMEADOW',
                "OWNER":'MARIA DAVILA',
                "DESCRIPTION":'“TINY,” MALE, TAN AND WHITE BOXER MIX'
                },
                {
                "ADDRESS":'7400 ESPIRA',
                "OWNER":'MATTHEW  RAFACZ',
                "DESCRIPTION":' "CHARLIE " NEUTERED MALE, BLACK AND WHITE LABRADOR RETRIEVER MIX'
                },
                {
                "ADDRESS":'9321 BAVARIA',
                "OWNER":'JEFF CRAWFORD',
                "DESCRIPTION":' "NALA " SPAYED FEMALE, WHITE AND BROWN BRINDLE PIT BULL MIX'
                },
                {
                "ADDRESS":'11504 MURCIA',
                "OWNER":'KATHERINE  MALONEY',
                "DESCRIPTION":'“LEXIE,” FEMALE, WHITE AND BLACK PIT BULL'
                },
                {
                "ADDRESS":'13101 WINDING CREEK',
                "OWNER":'JACK BARNETT',
                "DESCRIPTION":' "HOLLY " SPAYED FEMALE, WHITE LABRADOR/PITBULL MIX'
                },
                {
                "ADDRESS":'7128 MUMRUFFIN',
                "OWNER":'CARLA WARD',
                "DESCRIPTION":'“LINCOLN,” MALE, FAWN AND WHITE PIT BULL TERRIER'
                },
                {
                "ADDRESS":'2815 OAK RIDGE',
                "OWNER":'MELISSA SPELLMANN',
                "DESCRIPTION":'“SPARKLES,” SPAYED FEMALE, BRINDLE PLOTT HOUND MIX'
                },
                {
                "ADDRESS":'903 VINCENT',
                "OWNER":'RUTH DELONG-PYRON',
                "DESCRIPTION":' "MISSY, " SPAYED FEMALE, RED/WHITE PITBULL MIX'
                },
                {
                "ADDRESS":'4704 SUNRIDGE',
                "OWNER":'RONALD VASEY',
                "DESCRIPTION":'“RITA,” FEMALE, BROWN AUSTRALIAN SHEPHERD'
                },
                {
                "ADDRESS":'5931 CAPE CORAL',
                "OWNER":'TIMOTHY  LEBLANC',
                "DESCRIPTION":' "MILES DAVIS, " FEMALE, GOLD/WHITE GOLDEN RETRIEVER'
                },
                {
                "ADDRESS":'2815 OAK RIDGE',
                "OWNER":'MELISSA SPELLMANN',
                "DESCRIPTION":'“LACY,” SPAYED FEMALE, LABRADOR RETRIEVER MIX'
                },
                {
                "ADDRESS":'8701 BLUFFSTONE',
                "OWNER":'GABRIEL ALVEREZ',
                "DESCRIPTION":' "CLEMENTINE " SPAYED FEMALE, BLACK AND WHITE AUSTRAILIAN CATTLE DOG'
                },
                {
                "ADDRESS":'20608 ED ACKLIN',
                "OWNER":'MARIA GONZALEZ',
                "DESCRIPTION":'“CORONEL,” MALE, TAN/BLACK GERMAN SHEPHERD MIX'
                },
                {
                "ADDRESS":'11824 MORNING VIEW',
                "OWNER":'DEIRDRE MITCHELL',
                "DESCRIPTION":'“LADY BUG” SPAYED FEMALE, WHITE/BLACK PIT BULL/JACK RUSSELL MIX'
                },
                {
                "ADDRESS":'7600 BLOOMFIELD',
                "OWNER":'MIKAL/GERTI GONZALES',
                "DESCRIPTION":' "BUDDY, " MALE, BLUE BRINDLE AND WHITE PITBULL MIX'
                },
                {
                "ADDRESS":'14329 TEACUP',
                "OWNER":'JAZZIAS FLORES',
                "DESCRIPTION":'“BOOMER”, NEUTERED BROWN PIT BULL MIX'
                },
                {
                "ADDRESS":'4809 CLEAR VIEW',
                "OWNER":'ADAM BANDA',
                "DESCRIPTION":'“WEEZER,” FEMALE, TAN/BROWN GERMAN SHEPHERD'
                },
                {
                "ADDRESS":'11511 CATALONIA',
                "OWNER":'RICHARD  ASHCRAFT',
                "DESCRIPTION":'“LITTLE GIRL,” SPAYED FEMALE, BROWN BRINDLE AND WHITE BULL TERRIER'
                },
                {
                "ADDRESS":'18300 BELFRY',
                "OWNER":'ADRIAN RIVERA-CLEMENTE',
                "DESCRIPTION":'“DIVA,” INTACT FEMALE, TRI-COLOR PIT BULL'
                },
                {
                "ADDRESS":'705 TEXAS',
                "OWNER":'RANDALL BURT',
                "DESCRIPTION":'“JACK,” NEUTERED MALE, RED/WHITE LABRADOR RETRIEVER MIX'
                },
                {
                "ADDRESS":'12904 SCHLEICHER',
                "OWNER":'PENNY ARNOLD',
                "DESCRIPTION":'“SALTY,” MALE, BROWN AND WHITE BOXER'
                },
                {
                "ADDRESS":'11929 ROSETHORN',
                "OWNER":'ERNESTO LOZANO',
                "DESCRIPTION":'“G,” MALE, BROWN PIT BULL/BOXER MIX'
                },
                {
                "ADDRESS":'2520 EAST 3RD',
                "OWNER":'ANDRES CASTRO',
                "DESCRIPTION":'“KEELY,” SPAYED FEMALE, RED LABRADOR RETRIEVER MIX'
                },
                {
                "ADDRESS":'11305 CEZANNE',
                "OWNER":'JOHNNY ADAMO',
                "DESCRIPTION":'“TYSON,” NEUTERED MALE, GERMAN SHEPHERD'
                },
                {
                "ADDRESS":'5336 MAGDELENA',
                "OWNER":'JILL  KOLANSINSKI',
                "DESCRIPTION":'“TUG,” MALE, BROWN MERLE AND WHITE QUEENSLAND HEELER MIX'
                },
                {
                "ADDRESS":'2401 CECIL',
                "OWNER":'REBECCA BYRNES',
                "DESCRIPTION":'“SHEBBA,” FEMALE, WHITE PIT BULL MIX'
                },
                {
                "ADDRESS":'5205 BANTOM WOODS',
                "OWNER":'JOHN HERNANDEZ',
                "DESCRIPTION":' "BLUE " MALE, BLUE PIT BULL MIX'
                },
                {
                "ADDRESS":'2401 CECIL',
                "OWNER":'REBECCA BYRNES',
                "DESCRIPTION":'“PINKY,” FEMALE, WHITE BOXER MIX'
                },
                {
                "ADDRESS":'2718 JORWOODS',
                "OWNER":'TIM CARRINGTON',
                "DESCRIPTION":'“LADYBIRD,” SPAYED FEMALE, YELLOW BRINDLE AND WHITE PIT BULL MIX'
                },
                {
                "ADDRESS":'7200 REABURN',
                "OWNER":'JULIA KNOX',
                "DESCRIPTION":' "DOZER " NEUTERED MALE, WHITE AND RED RHODESIAN RIDGEBACK'
                },
                {
                "ADDRESS":'6204 SKAHAN',
                "OWNER":'DREW SCRUGGS',
                "DESCRIPTION":' "LAHLO " SPAYED FEMALE, TAN BOXER MIX'
                },
                {
                "ADDRESS":'905 TUDOR HOUSE',
                "OWNER":'JESSE CARLIN',
                "DESCRIPTION":' "MAYA, " SPAYED FEMALE, BROWN/WHITE PITBULL MIX'
                },
                {
                "ADDRESS":'1205 QUAIL PARK',
                "OWNER":'ROBERT  MCKINLEY',
                "DESCRIPTION":' "CINNAMON " FEMALE, RED AND WHITE BORDER COLLIE'
                },
                {
                "ADDRESS":'6204 SKAHAN',
                "OWNER":'DREW SCRUGGS',
                "DESCRIPTION":' "TAZ " NEUTERED MALE, BROWN BRINDLE BOXER MIX'
                },
                {
                "ADDRESS":'7002 MONTANA',
                "OWNER":'ORLANDO MARTINEZ',
                "DESCRIPTION":'“LILY,” FEMALE, BLACK AND WHITE CHIHUAHUA'
                },
                {
                "ADDRESS":'3703 GRAYSON',
                "OWNER":'LESLIE  MATTHEWS',
                "DESCRIPTION":' "ABBO " NEUTERED MALE, WHITE/BROWN GREAT PYRENEES MIX'
                },
                {
                "ADDRESS":'1302 CANYON EDGE',
                "OWNER":'MIKE KOOL',
                "DESCRIPTION":'“MILO,” NEUTERED MALE, WHITE/BROWN, GERMAN SHORT-HAIRED POINTER'
                },
                {
                "ADDRESS":'11824 MORNING VIEW',
                "OWNER":'DEIRDRE MITCHELL',
                "DESCRIPTION":'“LIA,” SPAYED FEMALE, WHITE/BLACK PIT BULL/JACK RUSSELL MIX'
                },
                {
                "ADDRESS":'4707 CARSONHILL',
                "OWNER":'VALERIE RAVEN',
                "DESCRIPTION":'“SISSY,” FEMALE, TAN AND BLACK GERMAN SHEPHERD'
                },
                {
                "ADDRESS":'1411 JUSTIN',
                "OWNER":'JILL SCOTT CARSE',
                "DESCRIPTION":'“NIPPY,” FEMALE, BLACK AND TAN SHEPHERD MIX'
                },
                {
                "ADDRESS":'6319 PARLIAMENT',
                "OWNER":'DAVE SMITH',
                "DESCRIPTION":' "GINGER " SPAYED FEMALE, RED AND WHITE AMERICAN FOX TERRIER MIX'
                },
                {
                "ADDRESS":'5205 BANTOM WOODS',
                "OWNER":'JOHN HERNANDEZ',
                "DESCRIPTION":' "JONAH " FEMALE, BROWN AND WHITE PIT BULL MIX'
                },
                {
                "ADDRESS":'1304 NEANS',
                "OWNER":'LUIS PADILLA',
                "DESCRIPTION":' "DIEGO " NEUTERED MALE, CREAM AND WHITE GREAT PYRENEES'
                },
                {
                "ADDRESS":'7701 CALLBRAM',
                "OWNER":'CARRIE WESTFALL',
                "DESCRIPTION":'“JUNE,” FEMALE, BRINDLE PIT BULL TERRIER'
                },
                {
                "ADDRESS":'14329 TEACUP',
                "OWNER":'JAZZIAS FLORES',
                "DESCRIPTION":'“MAIA,” FEMALE, WHITE/TAN PIT BULL MIX'
                },
                {
                "ADDRESS":'14028 LAKEVIEW',
                "OWNER":'JIM REHAGE',
                "DESCRIPTION":'“IKO,” NEUTERED MALE, BROWN BRINDLE CATAHOULA  MIX'
                },
                {
                "ADDRESS":'5107 SADDLE',
                "OWNER":'JONATHON RICH',
                "DESCRIPTION":' "ZUES " NEUTERED MALE, BLUE AND WHITE GREAT DANE'
                },
                {
                "ADDRESS":'1302 LIPAN',
                "OWNER":'ADELE JOHNSON',
                "DESCRIPTION":' "TANK, " NEUTERED, BLACK/GREY GERMAN WIRE-HAIRED POINTER'
                },
                {
                "ADDRESS":'11511 CATALONIA',
                "OWNER":'RICHARD  ASHCRAFT',
                "DESCRIPTION":'“BUMPY,” NEUTERED MALE, WHITE AND BLACK BULL TERRIER'
                },
                {
                "ADDRESS":'14707 REYNERO',
                "OWNER":'ENRIQUE AGUILAR',
                "DESCRIPTION":' "NEGRO " NEUTERED MALE, BLACK, TAN AND WHITE CHIHUAHUA MIX'
                },
                {
                "ADDRESS":'3705 ROBINSON',
                "OWNER":'ALI MARCUS',
                "DESCRIPTION":' "LUCY " SPAYED FEMALE, BROWN BRINDLE AND WHITE BOXER MIX'
                },
                {
                "ADDRESS":'412 SUMMER ALCOVE',
                "OWNER":'SCOTT CUMMINGS',
                "DESCRIPTION":' "AUSTIN " MALE, RED MERLE AUSTRALIAN SHEPHERD'
                },
                {
                "ADDRESS":'7200 REABURN',
                "OWNER":'JULIA KNOX',
                "DESCRIPTION":' "ARIES " SPAYED FEMALE, BLUE CANE CORSO'
                },
                {
                "ADDRESS":'7201 LEVANDER',
                "OWNER":'AUSTIN ANIMAL CENTER',
                "DESCRIPTION":' "BELLA " SPAYED FEMALE, TAN AND WHITE PIT BULL MIX'
                },
                {
                "ADDRESS":'2401 EMMETT',
                "OWNER":'CHESTER  KUDLEK',
                "DESCRIPTION":' "GUCIO " MALE, BLACK GIANT SCHNAUZER'
                },
                {
                "ADDRESS":'6319 PARLIAMENT',
                "OWNER":'DAVE SMITH',
                "DESCRIPTION":' "KILO " NEUTERED MALE, RED AND WHITE PIT BULL MIX'
                },
                {
                "ADDRESS":'1910 HASKELL',
                "OWNER":'NATASHA ROSOFSKY',
                "DESCRIPTION":' "CHUY " SPAYED FEMALE, BROWN BRINDLE AND WHITE BOXER MIX'
                },
                {
                "ADDRESS":'2813 TRADEWIND',
                "OWNER":'MARCIA MILLER',
                "DESCRIPTION":' "FLINT " NEUTERED MALE, BLUE BLUE LACY MIX'
                },
                {
                "ADDRESS":'7916 ADELAIDE',
                "OWNER":'KIM SADLER',
                "DESCRIPTION":' "SYDNEY " SPAYED FEMALE, TRICOLOR/BLACK BEAGLE'
                },
                {
                "ADDRESS":'903 VINCENT',
                "OWNER":'RUTH DELONG-PYRON',
                "DESCRIPTION":' "SUNNY, " NEUTERED MALE, BROWN/TAN SHEPHERD MIX'
                },
                {
                "ADDRESS":'4812 CANDLETREE',
                "OWNER":'MIGUEL GARCIA',
                "DESCRIPTION":'“LUCKY,” MALE, BLACK AND TRI-COLORED CHIHUAHUA'
                },
                {
                "ADDRESS":'6604 JAMAICA',
                "OWNER":'ANDREW  WILLINGHAM',
                "DESCRIPTION":' "CLEO " FEMALE, BLACK LABRADOR RETRIEVER MIX'
                }]
            
        }
		
		_initTasks.all();
    
})(jQuery, _ ); //load jquery.js and underscore.js