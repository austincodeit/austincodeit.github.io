
$(document).ready(function(){
    var excel_results = [];
    var print_results = function(cardData, lists, reset){
        updateLocalStorage();
        displayDate();
        
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
        // console.log(sheetCount);
        //first lets get the general summary and also filter out unusable sheets
        var completeCount = 0, openCount = 0, archivedCount = 0;
        // console.log(finalOutput)
        _.each(finalOutput, function(elem, idx){
            // console.log(elem)
            archivedCount = archivedCount + Number(elem["closed"]);
            var elemName = elem.name;
            if (elemName !== "Complete"){
                openCount = openCount + Number(elem["open"]);
                //write to DOM
                $("#card-list").append('<li class="collection-item"><div>'+(idx+1)+". "+elemName+
                '<span class="new badge red darken-1" data-badge-caption="open">'+elem["open"]+'</span>' +
                '</div></li>');
                //write to EXCEL object
                excel_results.push( {"Stage": elemName, "Count": elem["open"]} )
            } else {
                completeCount = completeCount + Number(elem["open"]);

            }
        });

        //continue writing to EXCEL object
        excel_results.push( {"Stage": "  ", "Count": "  " } )
        excel_results.push( {"Stage": "Active Stages","Count": activeStageCount } )
        excel_results.push( {"Stage": "  ", "Count": "  " } )     
        //continue writing to DOM   
        $("#complete-card-count").html(completeCount);
        $("#open-card-count").html(openCount);
        $("#closed-card-count").html(archivedCount);
        //continue writing to EXCEL object
        excel_results.push( {"Stage": "Total Archived", "Count": archivedCount } )
        excel_results.push( {"Stage": "Total Open", "Count": openCount } )
        excel_results.push( {"Stage": "Total Completed", "Count": completeCount } )
        
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

    var displayDate = function(){
        var dateObj = new Date(Date.now());
        var timeString = dateObj.toLocaleTimeString()
        var dateString = dateObj.toLocaleDateString()
        $("#get-date").html(dateString+" @ "+timeString);
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
    console.log(getTimeString());
    
    /* section for writing data to excel for export */
    var X = XLSX;
    $("#printListToExcel").on('click', function(){

        /* make the worksheet */
        var ws = XLSX.utils.json_to_sheet(excel_results);
        
        /* add to workbook */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Trello_Counts_"+getDateString()+"");

        /* generate an XLSX file */
        XLSX.writeFile(wb, "Trello_Counts_"+getTimeString()+".xlsx");
    })

});