let global_pdf = {};
let global_func = {};
let $activeElement;
let mapTaskListItem; //global function for mapping task list items
let global_start = Date.now();

$(document).ready( function() {

    $("#loading-overlay").fadeIn("slow"); //overlay to pause user interaction

    /* because of the odd asynchronous loading of googlemaps, we need to automate the refreshing */
    (function everythingIsLoadedYet(){
        // console.log(Date.now())
        let takingTooLong = Date.now() - global_start;
        if (takingTooLong > 6000){
            window.location.reload(true);
            return;
        }
        //if everything is loaded remove the overlay and proceed.
        //this function was created because the google api does not load in sync everytime
        if (typeof mapTaskListItem !== 'function') {
            setTimeout(function() {
                initialize();
                everythingIsLoadedYet();
                // console.log(mapTaskListItem);
            }, 2000)
        } else {
            // console.log("it's ready but we are still going");
            $("#loading-overlay").fadeOut("slow");
        }
    }());//an immediately invoked function

    let map,
        directionsService,
        directionsDisplay,
        geocoder,
        addressMarkerArray = [],
        taskListMarkerArray = [],
        iconCount = 0,
        timeOfDeparture;
    let labels = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    //this is a custom style you can get at snazzymaps.com really easy to create one and add it to your map.
    let snazzySyle = [{"stylers":[{"saturation":-100},{"gamma":1}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"poi.place_of_worship","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"visibility":"simplified"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"saturation":50},{"gamma":0},{"hue":"#50a5d1"}]},{"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#333333"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"weight":0.5},{"color":"#333333"}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"gamma":1},{"saturation":50}]}];
    let nightStyle = [{elementType:"geometry",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.fill",stylers:[{color:"#746855"}]},{elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},{featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi.park",elementType:"geometry",stylers:[{color:"#263c3f"}]},{featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#6b9a76"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#212a37"}]},{featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#9ca5b3"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{color:"#746855"}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#1f2835"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#f3d19c"}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#2f3948"}]},{featureType:"transit.station",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#515c6d"}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{color:"#17263c"}]}];

    //initialize function for google maps
    let initialize = function() {
        if (typeof google !== 'object') {
            //if google is undefined loop back until it is loaded...
            setTimeout(function() {
                initialize();
            }, 1000)
        };

        let myLatlng = new google.maps.LatLng(30.3344316, -97.6791038);
        let mapOptions = {
            zoom: 14,
            center: myLatlng,
            mapTypeControlOptions: {
                mapTypeIds: ['roadmap', 'satellite', 'style_a', 'style_b']
            }
            // styles: snazzySyle
            // mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map'), mapOptions);
        geocoder = new google.maps.Geocoder();
        directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer({
            draggable: true, //will provide 'true' option in future,
            map: map
        });
        //Resize Function
        google.maps.event.addDomListener(window, "resize", function() {
            let center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
        });
        //listener for anytime the markers or path is moved to update the display
        directionsDisplay.addListener('directions_changed', function() {
            // if this has already been run, skip
            if (global_pdf.trip_dist) {
                //need to update time and distance...
                timeOfDeparture = new Date(Date.now() + 1000);
                updateDirectionsDisplay(directionsDisplay.getDirections());
            }
        });

        let mapStyle1 = new google.maps.StyledMapType(snazzySyle, {
            name: 'Grey Scale'
        });
        let mapStyle2 = new google.maps.StyledMapType(nightStyle, {
            name: 'Night Mode'
        });
        //Associate the styled map with the MapTypeId and set it to display.
        map.mapTypes.set('style_a', mapStyle1);
        map.mapTypes.set('style_b', mapStyle2);
        map.setMapTypeId('style_a');
        // map.setMapTypeId('style_b');
    }
    //function for adding the marker
    function addMarker(location, popUpText, sort) {
        // console.log(location);
        let labelObject;
        if (iconCount == 0) {
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
                text: labels[iconCount % labels.length]
            };
        }
        // Add the marker at the clicked location, and add the next-available label
        // from the array of alphabetical characters.
        let newMarker = new google.maps.Marker({
            position: location,
            label: labelObject,
            map: map,
            draggable: true //set to false to make items not dragganble
        })
        let infowindow = new google.maps.InfoWindow({
            content: popUpText
        });
        newMarker.addListener('click', function() {
            infowindow.open(map, newMarker);
        });
        addressMarkerArray.push(newMarker);
        // //attach the lat lng to the element
        if (!$($activeElement).attr('val')) {
            if (typeof location.lat === "function"){
                $($activeElement).attr('val', location);
            } else {
                // console.log("HERE 2")
                $($activeElement).attr('val', "(" + location.lat +","+ location.lng +")");
            }
        }
        iconCount = iconCount + 1;
        adjustMapBounds();
        if (sort) {
            updateMarkerOrder(sort);
        }
    }
    
    global_func.placeAddressOnMap = function(address, popUpText, sort) {
        // function to check if it's on list of dangerous dogs
        dangerousAddressSearch(popUpText);
        //geocode and attempt to map
        geocoder.geocode({
            'address': address
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                // console.log(results[0].geometry.location);
                addMarker(results[0].geometry.location, popUpText, sort);
                return true;
            } else {
                alert('Geocode was not successful for the following reason: ' + status + '\nPlease manually enter the address.');
                // console.log(activeElement);
                $($activeElement).parent().remove();
                global_func.adjustRowCount();
            }
        });
    }
    global_func.placeLatLngOnMap = function(coords, popUpText, sort) {
        addMarker(coords, popUpText, sort);
        return true;
    }
    let adjustMapBounds = function() {
        if (addressMarkerArray.length <= 1) {
            //move map to singular point
            map.setCenter(addressMarkerArray[0].getPosition());
        } else {
            let bounds = new google.maps.LatLngBounds();
            // showing only 2 visible 1 hidden (because of markers.length-1)
            for (let i = 0; i < addressMarkerArray.length; i++) {
                // extending bounds to contain this visible marker position
                bounds.extend(addressMarkerArray[i].getPosition());
            }
            // setting new bounds to visible markers of 2
            map.fitBounds(bounds);
        }
    }

    //a function to extract the lat lng from the draggable element
    let extractLATLNG = function(coords) {
        let latitude = Number(coords.split(',')[0].trim().slice(1, coords.length));
        let longitude = Number(coords.split(',')[1].trim().slice(0, -1));
        return {
            lat: latitude,
            lng: longitude
        };
    }

    //a function to update the numbering of the marker labels (or remove markers)
    let updateMarkerOrder = function(sort) {
        if (sort) {
            //reorder markers by drawing new markers
            let $addressRowSelection = $("#routableAddressRows > tr:not(.placeholder)");
            // first empty the array and clear map
            for (let i = 0; i < addressMarkerArray.length; i++) {
                addressMarkerArray[i].setMap(null);
            }
            addressMarkerArray = [];
            iconCount = 0;

            $addressRowSelection.each(function(elem) {
                let latLngObj = extractLATLNG($(this).children("td#location").attr('val'));
                let popUpText = $(this).children("td#location").text().trim();
                addMarker(latLngObj, popUpText)
                // newMarkerLocations.push( $(this).children("td#location").attr('val') );
            });
        } else {
            for (let i = 0; i < addressMarkerArray.length; i++) {
                addressMarkerArray[i].setMap(null);
            }

            for (let i = 0; i < taskListMarkerArray.length; i++) {
                taskListMarkerArray[i].setMap(null);
            }
        }
    }

    //a function to remove a specific marker
    let removeSpecificMarker = function(rowIndex) {
        iconCount = iconCount - 1;
        addressMarkerArray[rowIndex].setMap(null);
        addressMarkerArray.splice(rowIndex, 1);
    }
    //default is to smart route regardless of points....
    let smartRoutingOption = true;
    $("#smart-routing-on").on('click', function(){
        // console.log('clicked smarted routing on...')
        //turn smart routing off when you click the button
        $(this).hide();
        $("#smart-routing-off").show();
        smartRoutingOption = false;
    })
    $("#smart-routing-off").on('click', function(){
        // console.log('clicked smarted routing off...')

        //turn smart routing on when you click the button
        $(this).hide();
        $("#smart-routing-on").show();
        smartRoutingOption = true;
    })


    //a function to return the direction services api with a route to the map
    let calculateAndDisplayRoute = function() {
        //1. show actionable buttons
        // $("#app-actions").show();
        //clear existing points
        updateMarkerOrder(null);
        // directionsDisplay.setMap(null);
        addressMarkerArray = [];
        global_pdf.route_stops = [];
        directionsDisplay.setMap(map);
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
        let summaryPanel = document.getElementById('directions-panel');
        summaryPanel.innerHTML = '';
        //loop through list and sort into waypoints, start, and last

        $addressRowSelection.each(function(i) {
            //grab text and trim whitespace
            // console.log()
            let latLngObj = extractLATLNG($(this).children("td#location").attr('val'));
            caseArray.push($(this).children("td").eq(1).text());
            locationArray.push($(this).children("td#location").text().trim());
            peopleArray.push($(this).children("td").eq(7).text().trim());
            fpArray.push($(this).children("td").eq(3).text().trim());
            ppArray.push($(this).children("td").eq(4).text().trim());
            // console.log('calculating route...');
            // console.log($(this).children("td#location").text().trim());
            // console.log(latLngObj);
            global_pdf.route_stops.push(latLngObj);


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
        global_pdf.start = locationArray[0];
        global_pdf.end = locationArray[locationArray.length - 1];
        global_pdf.tasks = [];
        timeOfDeparture = new Date(Date.now() + 1000);
        //google's direction service
        directionsService.route({
            origin: start, //document.getElementById('start').value,
            destination: finish, //document.getElementById('end').value,
            waypoints: waypts,
            optimizeWaypoints: smartRoutingOption, //uncomment and it will make the best route for you....
            drivingOptions: {
                departureTime: timeOfDeparture,
                trafficModel: 'bestguess'
            },
            travelMode: 'DRIVING'
        }, function(response, status) {

            if (status === 'OK') {
                //if we get an OK response, add the directions, and show the appropriate elements
                directionsDisplay.setDirections(response);

                let route = response.routes[0];
                global_pdf.route_path = response.routes[0].overview_polyline;

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
                    global_pdf.tasks.push({
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
                global_pdf.trip_dist = "" + distanceCalc.toPrecision(2);
                global_pdf.trip_time = "" + timeCalc.toPrecision(2);
                summaryPanel.innerHTML += '<span id="finalRouteStats"><b>Trip Time:</b> ' + timeCalc.toPrecision(2) + ' mins | <b>Trip Distance:</b> ' + distanceCalc.toPrecision(2) + ' mi</span>';
                global_pdf.map_center = String(map.getCenter().toUrlValue());
                global_pdf.map_zoom = String(map.getZoom());
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
            $("#loading-route-overlay").hide('slow', function() {
                $("#loading-route-overlay").remove();
            });
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

    }

    let updateDirectionsDisplay = function(response) {
        let summaryPanel = document.getElementById('directions-panel');

        let route = response.routes[0];
        global_pdf.route_path = response.routes[0].overview_polyline;
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
            if (global_pdf.tasks.length > 0){
                global_pdf.tasks[i].leg_dist = legDistance;
                global_pdf.tasks[i].leg_time = legDuration;
            }

        }

        //update global pdf
        global_pdf.trip_dist = "" + distanceCalc.toPrecision(2);
        global_pdf.trip_time = "" + timeCalc.toPrecision(2);
        $("#finalRouteStats").html('<span id="finalRouteStats"><b>Trip Time:</b> ' + timeCalc.toPrecision(2) + ' mins | <b>Trip Distance:</b> ' + distanceCalc.toPrecision(2) + ' mi</span>');
        global_pdf.map_center = String(map.getCenter().toUrlValue());
        global_pdf.map_zoom = String(map.getZoom());
    }


    //function to ensure the remove button works after being moved in DOM
    global_func.validateRemoveButton = function() {
        //unbind and then bind bc internet
        $(".removeAddress").unbind('click').bind('click', function() {
            let rowIndex = $(this).parents("tr:first")[0].rowIndex;
            //remove row entry
            removeSpecificMarker(rowIndex - 1);
            $(this).parent().parent().remove();
            global_func.adjustRowCount();
            //everytime we update the order of our rows, we should
            updateMarkerOrder(map);
        });
    }
    //function to take the address from input and add it too routing list
    let addAddressFromInput = function(address) {
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
        $activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
        global_func.validateRemoveButton();
        global_func.adjustRowCount();
        global_func.placeAddressOnMap(address, address, false);
    }

    //everytime the DOM is updated, adjust list count
    global_func.adjustRowCount = function() {
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
        addPlaceholderRows(arrayLength);
    }
    let addPlaceholderRows = function(rowCount) {
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
    }


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
                updateMarkerOrder(map);
            } else {

                $(el).children("td.first").prepend('' + '<span id="count"></span>' +
                    '<button type="button" class="btn btn-sm btn-default removeAddress">' +
                    '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
                    '</button>');
                //extract a readable text
                let newAddress = $(el).children("td#location").text().trim() + ", Austin, TX";
                let popUpText = $(el).children("td#location").text().trim();
                //get the element so we can add latlngs to it later
                $activeElement = $(el).children("td#location");
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
                
                global_func.placeLatLngOnMap(extractLATLNG('('+latitude+','+longitude+')'), popUpText, sort);
            }

            // both of these functions will need to be run either way
            global_func.validateRemoveButton();
            global_func.adjustRowCount();

        } else {
            // console.log('missed');
        }
    }).on('drag', function(el) {
        //adding class to dragging func
        $(el).css('font-size', '11px');
        $(el).css('background-color', 'white');
        $(el).css('border', '1px #ddd solid');
        $(el).children().css('width', '10%');
    }).on('remove', function(el) {
        // console.log('item removed...');
        global_func.adjustRowCount();
        //TO DO - remove from map as well
    });

    //* UI functions *//
    //drop down seleection made
    $("#dropdownChoice > li").on('click', function() {
        let addressValue = $(this).attr('val');
        addAddressFromInput(addressValue + ", Austin, TX");
    });
    //user enter a new address and clicked the add button
    $("#addNewAddress").on('click', function() {
        if ($("#addressInput").val().length >= 5) {
            let addressValue = $("#addressInput").val().replace(/[.#!$%\^&\*;:{}=\-_`~()]/g,"").trim()
            addAddressFromInput(addressValue);
            $("#addressInput").val('');
        }
    });
    //user enter a new address and pressed enter
    $(document).keypress(function(e) {
        //if user presses enter while focused on input field
        if (e.which == 13 && $("#addressInput:focus").val()) {
            //if input value has contents greater than 5, check address
            if ($("#addressInput:focus").val().length >= 5) {
                //trigger addNewAddress click event
                $("#addNewAddress").trigger("click");
            }

        }
    });
    //user clicked the create route button
    $("#createRoute").on('click', function() {
        //add loading animation
        $("#map").prepend('<div id="loading-route-overlay">' +
            '<section class="loaders">' +
            '<span class="loader loader-route-quart"> </span> Generating Route...' +
            '</section>' +
            '</div>');
        calculateAndDisplayRoute();
    });
    //user clicked the rest button, so we start over
    $("#resetList").on('click', function() {
        //clear available task list items
        $("#availableAddressRows").html("");
        $("#directions-panel").html("");
        //clear routable addresses
        let $divGroup = $("#routableAddressRows > tr:not(.placeholder)");
        $divGroup.each(function(i) {
            $(this).remove()
        });
        global_func.adjustRowCount();
        //remove markers from map
        updateMarkerOrder(null);
        directionsDisplay.setMap(null);
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

        addressMarkerArray = [];
        iconCount = 0;
        $(".header-row th").removeClass("headerSortUp");
        $(".header-row th").removeClass("headerSortDown");
        initialize();
    });

    //when the webpage loads, run these functions:
    addPlaceholderRows(0);
    initialize();

    //enable the tablesorter.js
    $("#availableAddressTable").tablesorter({
        // third click on the header will reset column to default - unsorted
        sortReset: true,
        // Resets the sort direction so that clicking on an unsorted column will sort in the sortInitialOrder direction.
        sortRestart: true
    });

    /*
        this section will map these task list items!!!
    */
    let yek1 = 'AIzaSyBXAnW9slEyfpkJKdHxnz_29kF8pn14MA0',
        yek2 = 'AIzaSyALPWxESCeijSKpKHoduW0htKA6w0KIJnc',
        yek3 = 'AIzaSyBbnhwYIXT-MBTVIaDxS9kzbqIOmoeqcRU',
        yek4 = 'AIzaSyCRQEeXDjgRjRX7HVyGFLDQXCzlrty1NxI',
        yek5 = 'AIzaSyDgR0LEtKMow--eiBeyiCbypLhDMAKCE8E',
        yek6 = 'AIzaSyC6ag7eWl7tjpaLo94L3w2LYZO41vklZC8';
    let yeks = [yek1, yek2, yek3, yek4, yek5, yek6];


    function getTaskIcon(folderType) {
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
    }
    tasklistComplete = function() {
        $("#progress-group").css("height", "0px");
    }

    mapTaskListItem = function(obj) {
        let taskListTotal = obj.length;
        let progressNumber = 0;
        $("#progress-group").css("height", "20px");

        map.panTo(new google.maps.LatLng(30.2709246, -97.7481116));
        map.setZoom(11);
        let list = obj;
        let arrayPos = 0;
        function addressLoop() {
            if (arrayPos >= list.length) {
                tasklistComplete();
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
                    position: extractLATLNG('('+latitude+','+longitude+')'),
                    icon: getTaskIcon(list[arrayPos].type),
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
                              '<td class="b">' + $($tableRow).children("td:nth-child(3)").text() + '</td>' +
                              '<td class="c" id="location">' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
                              '<td class="a">' + $($tableRow).children("td:nth-child(5)").text() + '</td>' +
                              '<td class="a">' + $($tableRow).children("td:nth-child(6)").text() + '</td>' +
                              '<td class="a">' + $($tableRow).children("td:nth-child(7)").text() + '</td>' +
                              '<td class="a">' + $($tableRow).children("td:nth-child(8)").text() + '</td>' +
                              '<td class="c">' + $($tableRow).children("td:nth-child(9)").text() + '</td>' +
                              '<td class="c">' + $($tableRow).children("td:nth-child(10)").text() + '</td>' +
                              '<td class="b" id="pointLat">' + $($tableRow).children("td:nth-child(11)").text() + '</td>' +
                              '<td class="b" id="pointLng">' + $($tableRow).children("td:nth-child(12)").text() + '</td>' +
                              '</tr>');
                        //grab the active element because we want to be able to append to it later...
                        $activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                        //theses functions help with updates
                        global_func.validateRemoveButton();
                        global_func.adjustRowCount();
                        global_func.placeLatLngOnMap(extractLATLNG('('+latitude+','+longitude+')'), popUpText, false);
                        infowindow.close();
                    });

                });
                taskListMarkerArray.push(newTaskMarker);
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
                            icon: getTaskIcon(list[arrayPos].type),
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
                                      '<td class="b">' + $($tableRow).children("td:nth-child(3)").text() + '</td>' +
                                      '<td class="c" id="location">' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(5)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(6)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(7)").text() + '</td>' +
                                      '<td class="a">' + $($tableRow).children("td:nth-child(8)").text() + '</td>' +
                                      '<td class="c">' + $($tableRow).children("td:nth-child(9)").text() + '</td>' +
                                      '<td class="c">' + $($tableRow).children("td:nth-child(10)").text() + '</td>' +
                                      '<td class="b" id="pointLat">' + $($tableRow).children("td:nth-child(11)").text() + '</td>' +
                                      '<td class="b" id="pointLng">' + $($tableRow).children("td:nth-child(12)").text() + '</td>' +
                                      '</tr>');
                                //grab the active element because we want to be able to append to it later...
                                $activeElement = $("#routableAddressRows > tr:not(.placeholder):last-child").children("td#location");
                                //theses functions help with updates
                                global_func.validateRemoveButton();
                                global_func.adjustRowCount();
                                global_func.placeAddressOnMap(newAddress, popUpText, false);
                                infowindow.close();
                            });

                        });

                        taskListMarkerArray.push(newTaskMarker);
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
            tasklistComplete();
            return;
        } else {
            addressLoop();
        }

    };

    $("#dogDialog").hide();
    dangerousAddressSearch = function(input) {
        //see if address matches any part of the current list:
        // loop through dangerousDogArray
        let foundAddress = dangerousDogArray.filter( function(item, idx) {
            if(input.toUpperCase().indexOf(item.ADDRESS) >= 0){
                console.log('found', idx)
                return item;
            };
        });
        let dogsFound = '';
        // console.log(foundAddress);
        // if address is found in array
        if (foundAddress.length > 0){
            console.log('found matching dog owner address...')
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
                    console.log('dialog closed')
                    $("#dog-owner").html("");
                    $("#dog-address").html("");
                    $("#dog-description").html("");
                    dogsFound = '';
                    $("#dogDialog").hide();
                }
              });
        }
    }
    $("#close-caution-modal").on('click', function(){
        console.log('dialog closed')        
        // close dialog box on click
        $("#dogDialog").dialog("close");
        $("#dogDialog").hide();
    });

});

let dangerousDogArray = [
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
    }];