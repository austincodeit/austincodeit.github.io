(function($, _) {
        /**
         * inittial load section
        */
        let _initTasks = {
            clickEvents: function(){
                $("#loadTaskList").on('click', _tableMod.loadTaskList )
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
                  });
            },
            responsive: function() {
                //function needed for mobile changes
                let $window = $(window);

                //when the window is resized, if it is mobile sized width, we update the UI
                $window.resize(function resize() {
                    $draggableTable1 = $('#availableAddressRows > tr');
                    $draggableTable2 = $('#routableAddressRows > tr');
                    $mobileAddButton = $('#availableAddressRows > tr > td.first > a');
                    if ($window.width() < 768) {
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
            getOpenData: function( ) {
                $.ajax({
                    url: this.openDataLink,
                    type: "GET",
                    data: {
                      "$limit": this.appRecordLimit,
                      "$$app_token": this.appToken
                    }
                }).done(function(data) {
                    let nameArray = _.chain(data).pluck('assigneduser').uniq().value();
                    //names we don't want to map
                    let removeArray = this.doNotInclude;
                    let filterArray = nameArray.filter(function(name){
                        if (removeArray.indexOf(name) < 0){
                            return name;
                        }
                    })
                    //set up autocomplete w jquery ui plugin
                    $("#inspectorID").autocomplete({
                      source: filterArray
                    });
                    //assign results object to higher variable for search purposes...
                    return data;
                })
            }
        }

        let _mapMod = {
            animated: true,
            placeAddressOnMap: function(newAddress, popUpText, false){

            },
            closeMenu: function( ) {
                
                this.setMenuStyle( );
            },
            setMenuStyle: function( ) {  }
        };

        let _printMod = {
            name: '',
            datestamp: _utilityMod.dateFormatting(Date.now()),
            timestamp: new Date().toLocaleTimeString(),
        }

        let _tableMod = {
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
            loadTaskList: function(){
                $("#availableAddressRows").html("");
                let chosenName = $("#inspectorID").val().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim()
                if ($("#inspectorID").val().length >= 2) {
                  //then reset the value after task list is in the process of loading
                  $("#inspectorID").val('');
                }
                let filteredData = _.filter(openData, function(row) { //filter the data returned by assignedUser
                    return row.assigneduser == chosenName;
                })
                //loop through filtered results and append data to table#availableAddressRows
                let uniqueAddressArray = [], filteredAddressArray = [], addCheck;
                $(filteredData).each(function(i) {

                    $("#availableAddressRows").append('<tr>' +
                      '<td class="first">' + nullCheck(filteredData[i].type) + '</td>' +
                      // '<td class="b">' + nullCheck(filteredData[i].subtype) + '</td>' +
                      '<td class="b" id='+nullCheck(filteredData[i].foldernumber)+'>' + nullCheck(filteredData[i].foldernumber) + '</td>' +
                      '<td class="c" id="location">' + nullCheck(filteredData[i].foldername) + '</td>' +
                      '<td class="a">' + nullCheck(filteredData[i].priority1) + '</td>' +
                      '<td class="a">' + nullCheck(filteredData[i].priority2) + '</td>' +
                      '<td class="a">' + dateFormatting(filteredData[i].duetostart) + '</td>' +
                      '<td class="a">' + dateFormatting(filteredData[i].duetoend) + '</td>' +
                      '<td class="c">' + nullCheck(filteredData[i].peoplename) + '</td>' +
                      '<td class="c">' + nullCheck(filteredData[i].housenumber) + ' ' + nullCheck(filteredData[i].streetname) + '</td>' +
                      '<td class="b" id="pointLat">' + nullCheck(filteredData[i].latitude) + '</td>' +
                      '<td class="b" id="pointLng">' + nullCheck(filteredData[i].longitude) + '</td>' +        
                      '</tr>');
              
                        /*
                            this section will send these items to the map!!!
                        */
                      //make sure address is NOT NULL
                      addCheck = filteredData[i].foldername;
                      if ( (nullCheck(addCheck).length > 1) && (uniqueAddressArray.indexOf(addCheck) < 0) ){
                          uniqueAddressArray.push(addCheck);
                          filteredAddressArray.push(filteredData[i])
                      }
                  });
                //this will sort by type descendingly, so CC, CV, OL, etc....
                let filteredAndSortedArray = _.sortBy(filteredAddressArray, function(row) { return row.type; })
                // console.log(filteredAndSortedArray);
                mapTaskListItem(filteredAndSortedArray);

                //a nod to the table sort to let it know to check itself
                $('#availableAddressTable').trigger('update');
                //in case we are in mobile we need to freeze the draggable rows and enable the button add.
                $window.trigger('resize');
                //if we are mobile, we need to add the mobileAdd button and class
                $('#availableAddressRows > tr').children("td.first").prepend('' +
                    '<a type="button" class="btn btn-sm btn-default mobileAdd">' +
                    '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>' +
                '</a>');
                this.validateAddButton();
            },
            validateAddButton: function(){
                $("a.mobileAdd").unbind('click').bind('click', function(elem) {
                    //for every element in the row...
                    let $tableRow = $(this).parent().parent()[0];
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
                      '<td class="c" id="location" >' + $($tableRow).children("td:nth-child(4)").text() + '</td>' +
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
                    this.validateRemoveButton();
                    this.adjustRowCount();
                    _mapMod.placeAddressOnMap(newAddress, popUpText, false);
                })
            },
            validateRemoveButton: function(){
                //unbind and then bind bc internet
                $(".removeAddress").unbind('click').bind('click', function() {
                    let rowIndex = $(this).parents("tr:first")[0].rowIndex;
                    //remove row entry
                    removeSpecificMarker(rowIndex - 1);
                    $(this).parent().parent().remove();
                    this.adjustRowCount();
                    //everytime we update the order of our rows, we should
                    updateMarkerOrder(map);
                });
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
            }
    }

        let _routeMod = {}
        

        let _utilityMod = {
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
            nullCheck: function(string) {
                //this function is to change undefined or N/A strings into blanks
                return ( string ? string : '' )
            }       
        }
})(jQuery, _ );