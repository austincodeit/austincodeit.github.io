
$(document).ready(function(){
    /** returns numbers in first array, not found in second array 
     * https://stackoverflow.com/questions/18383636/compare-2-arrays-of-objects-with-underscore-to-find-the-differnce
     * **/
    var testIfColumnsMatchUp = function(workbookSheets){
        localStorage.setItem('test', JSON.stringify(workbookSheets) )
        var columnsMatch = true;

        //create array of headers
        var headerArray = []
        _.each(workbookSheets, function(item){
            var adjustedArray = item[0].map( function(val){
                return val.toUpperCase()
            })
            headerArray.push(adjustedArray)
        });

        headerArray.map( function(item, idx){

            headerArray.map( function(subItem){
                var found = _.difference( item, subItem).length
                console.log(found)
                if (found > 0){
                    columnsMatch = false
                }

            })
            console.log(item)
            console.log(idx)
        })
        // _names.map( function( n ){
        //     var arrayWithoutN = 
        //     var diffArray = _.difference(workbookSheets[n][0], )
        // })
        // for each key
        // loop through object and compare first row
        if (columnsMatch === false){
            alert("\n\nThe column names/order do not match, fix it first :)\n\n");
            throw new Error("Columns dont match");
            $("#loading-overlay").fadeOut();
        } else {
            // throw new Error("Columns do match");            
        }
    }
    
    // if (localStorage.getItem('test')){
    //     testIfColumnsMatchUp( JSON.parse(localStorage.getItem('test')) )
    // }

    var difference = function(array){
        var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
     
        var containsEquals = function(obj, target) {
         if (obj == null) return false;
         return _.any(obj, function(value) {
           return _.isEqual(value, target);
         });
       };
     
       return _.filter(array, function(value){ return ! containsEquals(rest, value); });
     };

    var print_compare_results = function(output){
        // console.log(output);
        var sheetNames = Object.keys(output) //the name of each spreadsheet
        var sheetCount = sheetNames.length; //get number of spreadsheets
        $("#spreadsheet-count").html(sheetCount);
        // console.log(sheetNames);
        // console.log(sheetCount);
        var objectsToCompare = {...output};  //make copy of source
        
        // WE NEED TO MAKE SURE THE COLUMNS MATCH UP
        testIfColumnsMatchUp(objectsToCompare)

        //first lets get the general summary and also filter out unusable sheets
        _.each(output, function(elem, idx){
            var rowCount = elem.length;
            var colCount = elem[0].length;
            $("#spreadsheet-list").append('<li class="collection-item"><div>'+idx+'<span class="new badge" data-badge-caption="cols">'+colCount+'</span><span class="new badge" data-badge-caption="rows">'+rowCount+'</span></div></li>');
            //if the row count of the sheet is more than one row, use it to compare
            if (rowCount <= 1){
                /// delete from copy
                delete objectsToCompare[idx]
            }
        });

        //now we look for things in one sheet that are not in the others...
        _.each(objectsToCompare, function(elem, idx){

            _.each(objectsToCompare, function(subElem, subIdx){
                if (idx !== subIdx){
                    $("#compare-sheets").append("<div class='card-panel blue-grey lighten-5'><h6>Rows in sheet <b>"+idx+"</b>, not found in sheet <b>"+subIdx+"</b> </h6></div>")
                    var tableHtml ='<table>'
                    var notFoundArray = difference(elem, subElem)
                    // console.log(notFoundArray);
                    _.each(notFoundArray, function(arr){
                        // console.log(arr);
                        var rowHtml = '<tr>'
                        _.each(arr, function(cell){
                            console.log(cell)
                            rowHtml += '<td>'+ cell +'</td>' 
                        })
                        rowHtml += '</tr>'
                        console.log(rowHtml)
                        tableHtml += rowHtml
                    })
                    tableHtml += '</table>'
                    $("#compare-sheets").append( tableHtml )
                }

            })

        })
        // console.log(arrayToCompare);
        $("#loading-overlay").fadeOut();
        // console.log('done')
    }
    var X = XLSX;
    var XW = {
        /* worker message */
        msg: 'xlsx'
        /* worker scripts */
        // worker: './xlsxworker.js'
    };

    var global_wb;
    var process_wb = (function() {
        var OUT = document.getElementById('out');
        var HTMLOUT = document.getElementById('htmlout');
        var get_format = (function() {
            var radios = document.getElementsByName( "format" );
            return function() {
                for(var i = 0; i < radios.length; ++i) if(radios[i].checked || radios.length === 1) return radios[i].value;
            };
        })();
        var to_json = function to_json(workbook) {
            var result = {};
            workbook.SheetNames.forEach(function(sheetName) {
                var roa = X.utils.sheet_to_json(workbook.Sheets[sheetName], {header:1});
                if(roa.length) result[sheetName] = roa;
            });
            // console.log(result);
            return result;
            // return JSON.stringify(result);
        };
        // var to_csv = function to_csv(workbook) {
        //     var result = [];
        //     workbook.SheetNames.forEach(function(sheetName) {
        //         var csv = X.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        //         if(csv.length){
        //             result.push("SHEET: " + sheetName);
        //             result.push("");
        //             result.push(csv);
        //         }
        //     });
        //     return result.join("\n");
        // };
        // var to_fmla = function to_fmla(workbook) {
        //     var result = [];
        //     workbook.SheetNames.forEach(function(sheetName) {
        //         var formulae = X.utils.get_formulae(workbook.Sheets[sheetName]);
        //         if(formulae.length){
        //             result.push("SHEET: " + sheetName);
        //             result.push("");
        //             result.push(formulae.join("\n"));
        //         }
        //     });
        //     return result.join("\n");
        // };
        // var to_html = function to_html(workbook) {
        //     HTMLOUT.innerHTML = "";
        //     workbook.SheetNames.forEach(function(sheetName) {

        //         var htmlstr = X.write(workbook, {sheet:sheetName, type:'string', bookType:'html'});
        //         HTMLOUT.innerHTML += htmlstr;
        //     });
        //     return "";
        // };
        return function process_wb(wb) {
            global_wb = wb;
            var output = to_json(wb)  
            // console.log(Object.keys(output).length)
            if (Object.keys(output).length > 0){
                $(".compare-results").show();
                print_compare_results(output);
            } else {
                $("#err-display").show();
            }
            // if(OUT.innerText === undefined) OUT.textContent = output;
            // else OUT.innerText = output;
            // if(typeof console !== 'undefined') console.log("output", new Date());
        };
    })();

    var setfmt = window.setfmt = function setfmt() { if(global_wb) process_wb(global_wb); };
    var b64it = window.b64it = (function() {
        var tarea = document.getElementById('b64data');
        return function b64it() {
            if(typeof console !== 'undefined') console.log("onload", new Date());
            var wb = X.read(tarea.value, {type:'base64', WTF:false});
            process_wb(wb);
        };
    })();

    var do_file = (function() {
        var rABS = typeof FileReader !== "undefined" && (FileReader.prototype||{}).readAsBinaryString;

        // var domrabs = document.getElementsByName("userabs")[0];
        // if(!rABS) domrabs.disabled = !(domrabs.checked = false);
        // var use_worker = typeof Worker !== 'undefined';
        // var domwork = document.getElementsByName("useworker")[0];
        // domwork.disabled;
        // if(!use_worker) domwork.disabled = !(domwork.checked = false);
        // var xw = function xw(data, cb) {
        //     var worker = new Worker(XW.worker);
        //     worker.onmessage = function(e) {
        //         switch(e.data.t) {
        //             case 'ready': break;
        //             case 'e': console.error(e.data.d); break;
        //             case XW.msg: cb(JSON.parse(e.data.d)); break;
        //         }
        //     };
        //     worker.postMessage({d:data,b:rABS?'binary':'array'});
        // };
        return function do_file(files) {
            // rABS = domrabs.checked;
            // use_worker = domwork.checked;
            use_worker = false;
            var f = files[0];
            // console.log('f: ', f)
            
            var reader = new FileReader();
            reader.onload = function(e) {
                if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
                var data = e.target.result;
                // console.log('data: ',data)
                // if(!rABS) data = new Uint8Array(data);
                if(use_worker) xw(data, process_wb);
                else process_wb(X.read(data, {type: rABS ? 'binary' : 'array'}));
            };
            if(rABS) reader.readAsBinaryString(f);
            else reader.readAsArrayBuffer(f);
        };
    })();

    (function() {
        var drop = document.getElementById('drop');
        if(!drop.addEventListener) return;
        function handleDrop(e) {
            $(this).css("background","#90a4ae");
            $("#drop").html("file accepted");
            $("#loading-overlay").fadeIn("slow");
            e.stopPropagation();
            e.preventDefault();
            let files = e.dataTransfer.files
            console.log(files)
            setTimeout(function(){
                console.log(files)
                do_file(files);
            }, 1000)
        }
        function handleDragover(e) {
            $(this).parent().css("background","#607d8b");
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }

        function handleDragleave(e) {
            $(this).parent().css("background","#546e7a");
            e.stopPropagation();
            e.preventDefault();
        }
        drop.addEventListener('dragenter', handleDragover, false);
        drop.addEventListener('dragleave', handleDragleave, false);
        drop.addEventListener('dragover', handleDragover, false);
        drop.addEventListener('drop', handleDrop, false);
    })();

    (function() {
        $("#xlf").on('click', function() {
            function handleFile(e) { do_file(e.target.files); }
            xlf.addEventListener('change', handleFile, false);
        })
        
    })();

    // $('select').formSelect();
    /** onload settings **/
    $(".compare-results").hide()
    $("#err-display").hide();
    
    
    
});