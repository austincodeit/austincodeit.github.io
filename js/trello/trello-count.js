
$(document).ready(function(){


    var print_results = function(cardData, lists){
        // console.log(output);
        var cardList = cardData["cards"];
        //groupby list ID
        var newList = _.groupBy(cardList, 'idList');
        console.log(newList);
        var cardKeys = Object.keys(newList) //the name of each spreadsheet
        let finalOutput = [];
        //loop through the array of keys
        cardKeys.map(function(_card_key, idx){
            console.log(_card_key, idx);
            //get arrayPosition of ID match
            let lookUpId = 0;
            let replacementName = "";
            lists.forEach(function(elem){
                if (_card_key === elem.id){
                   finalOutput.push({name: elem.name, count: newList[_card_key].length })
                }
            });
            return replacementName;
        })
        console.log(finalOutput)
        
        var listCount = finalOutput.length; //get number of lsits
        $("#spreadsheet-count").html(listCount);
        // console.log(sheetNames);
        // console.log(sheetCount);
        //first lets get the general summary and also filter out unusable sheets
        var totalCount = 0;
        _.each(finalOutput, function(elem, idx){
            var rowCount = elem.count;
            totalCount = totalCount + Number(rowCount);
            var elemName = elem.name;
            $("#card-list").append('<li class="collection-item"><div>'+(idx+1)+". "+elemName+'<span class="new badge" data-badge-caption="cards">'+rowCount+'</span></div></li>');
        });

        $("#complete-card-count").html(totalCount);
        
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