
$(document).ready(function(){


    var print_results = function(cardData, lists){
        let finalOutput = [];
        // console.log(output);
        var cardList = cardData["cards"];
        //groupby list ID
        var newList = _.groupBy(cardList, 'idList');
        console.log(newList);
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
        
        console.log(finalOutput)
        
        var listCount = finalOutput.length; //get number of lsits
        $("#spreadsheet-count").html(listCount);
        // console.log(sheetNames);
        // console.log(sheetCount);
        //first lets get the general summary and also filter out unusable sheets
        var totalCount = 0, openCount = 0, closedCount = 0;
        console.log(finalOutput)
        _.each(finalOutput, function(elem, idx){
            console.log(elem)
            totalCount = totalCount + Number(elem["count"]);
            openCount = openCount + Number(elem["open"]);
            closedCount = closedCount + Number(elem["closed"]);
            var elemName = elem.name;
            $("#card-list").append('<li class="collection-item"><div>'+(idx+1)+". "+elemName+
            '<span class="new badge blue" data-badge-caption="closed">'+elem["closed"]+'</span>'+
            '<span class="new badge red" data-badge-caption="open">'+elem["open"]+'</span>'+
            '<span class="new badge" data-badge-caption="total">'+elem["count"]+'</span>'+
            '</div></li>');
        });

        $("#complete-card-count").html(totalCount);
        $("#open-card-count").html(openCount);
        $("#closed-card-count").html(closedCount);
        
        // $("#loading-overlay").fadeOut();
        // console.log('done')
    }
    

    // $('select').formSelect();
    /** onload settings **/
    $(".compare-results").hide()
    $("#err-display").hide();
    
    
    $("#startCountingBoards").on('click', function(){
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
                
                
            });
            
        });
    });
    
    
});