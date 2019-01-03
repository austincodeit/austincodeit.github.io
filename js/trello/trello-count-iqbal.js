//everything is wrapped in this function which executes after the document is ready!
$(document).ready(function(){
    // excel_results is an object which will populate with all the data to be exported to Excel
    var excel_results = [];
    // print_results is a function which does the heavy lifting in this application
    var print_results = function(cardData, lists, reset){
        //updateLocalStorage.... I created this function to save the "secret token" in the localStorage cache
        updateLocalStorage();
        //display the date
        $("#get-date").html (getDisplayDate() );
        
        let finalOutput = [];
        // console.log(output);
        var cardList = cardData["cards"];
        //groupby list ID
        var newList = _.groupBy(cardList, 'idList');
        // console.log(newList);
        //loop through the list grouped by ID
        _.each(newList, function(card, idx){
            //group by each list by status (closed or NOT)
            let openTickets = _.countBy(card, 'closed');
            let closedCount = openTickets.true ? openTickets.true : 0
            lists.forEach(function(elem){
                // console.log(elem);
                if (idx === elem.id){
                   finalOutput.push({name: elem.name, count: newList[idx].length, open: openTickets.false, closed: closedCount })
                }
            });
        })
        
        // console.log(finalOutput)
        
        var activeStageCount = finalOutput.length-1; //get number of lsits
        $("#list-count").html(activeStageCount); //minus 1 because we won't count complete column as an "ACTIVE" stage
        // console.log(sheetNames);
        var projKey = "Active Stages: "+activeStageCount;
        //first lets get the general summary and also filter out unusable sheets
        var completeCount = 0, openCount = 0; //archivedCount = 0;
        // console.log(finalOutput)
        _.each(finalOutput, function(elem, idx){
            // console.log(elem)
            // archivedCount = archivedCount + Number(elem["closed"]);
            var elemName = elem.name;
            if (elemName !== "Complete"){
                openCount = openCount + Number(elem["open"]);
                //write to DOM
                $("#card-list").append('<li class="collection-item"><div>'+(idx+1)+". "+elemName+
                '<span class="new badge red darken-1" data-badge-caption="open">'+elem["open"]+'</span>' +
                '</div></li>');
                //write to EXCEL object
                excel_results.push( {[projKey]: (idx+1)+". "+elemName, "Count": elem["open"]} )
            } else {
                completeCount = completeCount + Number(elem["open"]);

            }
        });

        //continue writing to EXCEL object
        excel_results.push( {[projKey]: "  ", "Count": "  " } )
        //continue writing to DOM   
        $("#complete-card-count").html(completeCount);
        $("#open-card-count").html(openCount);
        //$("#closed-card-count").html(archivedCount);
        $("#total-card-count").html(openCount+completeCount); //+archivedCount);
        //continue writing to EXCEL object
        excel_results.push( {[projKey]: "TOTAL Open Cards", "Count": openCount } )
        excel_results.push( {[projKey]: "TOTAL Completed Cards", "Count": completeCount } )
        //excel_results.push( {[projKey]: "  ", "Count": "  " } )     
        //excel_results.push( {[projKey]: "Archived Cards", "Count": archivedCount } )
        excel_results.push( {[projKey]: "TOTAL Cards", "Count": openCount+completeCount }) // + archivedCount } )
        
        if (reset){
            finalOutput = [];
            $("#card-list .collection-item").remove()
            setTimeout(function(){
                $("#startCountingBoards").trigger('click')
            }, 250)
        }
        // $("#loading-overlay").fadeOut();
        // console.log('done')
    }
    

    // $('select').formSelect();
    /** onload settings **/
    $(".compare-results").hide()
    $("#err-display").hide();
    $("#loading-display").fadeOut();
    $("#reset-section").hide();
    
    // this function is fired when the user clicks the "COUNT" button at the very beginning
    $("#startCountingBoards").on('click', function(){
        $("#loading-display").fadeIn();
        $("#start-section").hide();

        let keyInput = $("#_my_key").val();
        let tokenInput = $("#_my_token").val();
        keyInput = "27992b2f9daad361db38d07e1b581c51";
        let myUrl = "https://api.trello.com/1/boards/ijWiW7ag?cards=all&key="+keyInput+"&token="+tokenInput;
        let listUrl = "https://api.trello.com/1/boards/ijWiW7ag?lists=all&key="+keyInput+"&token="+tokenInput;
        
        $.ajax({
            url: listUrl,
            type: "GET"
        }).done(function(listData) {
            let lists = listData["lists"];

            $.ajax({
                url: myUrl,
                type: "GET"
            }).done(function(cardData) {

                print_results(cardData, lists);
                $(".compare-results").show()
                $("#loading-display").hide();
                $("#reset-section").show();
                
            });
            
        });
    });
    
    /* Reset application and start over */
    $("#resetApp").on('click', function(){
        
        $("#reset-section").hide();
        $("#start-section").show();
        $(".compare-results").hide()
        print_results([], [], true);
    })

    /* working with localStorage  */
    var updateLocalStorage = function(){
        localStorage.setItem("token",  $("#_my_token").val() );
    }
    //on load, add used token
    if( localStorage.getItem("token") ){
        $("#_my_token").val( localStorage.getItem("token") )
    }

    //these Date and Time functions below are for utility purposes
    var getDisplayDate = function(){
        var dateObj = new Date(Date.now());
        //var timeString = dateObj.toLocaleTimeString()
        var dateString = dateObj.toLocaleDateString()
        return dateString //+" @ "+timeString;
    }

    var getDateString = function(){
        var dateObj = new Date(Date.now());
        var dateString = dateObj.toLocaleDateString()
        // console.log(dateString.replace("/","-"))
        return dateString.replace(/\//g,"-");
    }
    var getTimeString = function(){
        var dateObj = new Date(Date.now());
        var timeString = dateObj.getTime();
        // console.log(timeString )
        return timeString
    }
    console.log("The time is: ", getTimeString());
    
    /* section for writing data to excel for export */
    // var X = XLSX;
    $("#printListToExcel").on('click', function(){
        /* generate a new workbook with the first two rows */
        var ws = XLSX.utils.aoa_to_sheet([
            ["ACD Trello Card Count Results as of "+getDisplayDate()+""]
        ]);

        /* this array controls the column order in the generated sheet */
        // var header = ["x", "y", "z"];

        /* add row objects to sheet starting from cell A4 */
        XLSX.utils.sheet_add_json(ws, excel_results, {origin:"A4"});

        /* edit the column widths */
        var wscols = [
            {wch:37},
            {wch:5.7}
        ];
        ws['!cols'] = wscols;

        /* create workbook and add sheet to workbook */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Trello_Counts_"+getDateString()+"");

        /* generate an XLSX file */
        XLSX.writeFile(wb, "Trello_Counts_"+getTimeString()+".xlsx");
    })

});