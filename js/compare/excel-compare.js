
$(document).ready(function(){
    
    var print_compare_results = function(output){
        console.log(output);
        var sheetNames = Object.keys(output) //the name of each spreadsheet
        var sheetCount = sheetNames.length; //get number of spreadsheets
        $("#spreadsheet-count").html(sheetCount);
        // console.log(sheetNames);
        // console.log(sheetCount);
        _.each(output, function(elem, idx){
            var rowCount = elem.length;
            var colCount = elem[0].length;
            $("#spreadsheet-list").append('<li class="collection-item"><div>'+idx+'<span class="new badge" data-badge-caption="cols">'+colCount+'</span><span class="new badge" data-badge-caption="rows">'+rowCount+'</span></div></li>')
        });

        
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
        var to_csv = function to_csv(workbook) {
            var result = [];
            workbook.SheetNames.forEach(function(sheetName) {
                var csv = X.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                if(csv.length){
                    result.push("SHEET: " + sheetName);
                    result.push("");
                    result.push(csv);
                }
            });
            return result.join("\n");
        };
        var to_fmla = function to_fmla(workbook) {
            var result = [];
            workbook.SheetNames.forEach(function(sheetName) {
                var formulae = X.utils.get_formulae(workbook.Sheets[sheetName]);
                if(formulae.length){
                    result.push("SHEET: " + sheetName);
                    result.push("");
                    result.push(formulae.join("\n"));
                }
            });
            return result.join("\n");
        };
        var to_html = function to_html(workbook) {
            HTMLOUT.innerHTML = "";
            workbook.SheetNames.forEach(function(sheetName) {

                var htmlstr = X.write(workbook, {sheet:sheetName, type:'string', bookType:'html'});
                HTMLOUT.innerHTML += htmlstr;
            });
            return "";
        };
        return function process_wb(wb) {
            global_wb = wb;
            var output = to_json(wb)  
            print_compare_results(output)
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
            
            e.stopPropagation();
            e.preventDefault();
            do_file(e.dataTransfer.files);
        }
        function handleDragover(e) {
            $(this).css("background","#607d8b");
            console.log('hover');
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
        // $("#my-drop-box").hover(function(){
        //     $(this).css("background", "#F00");
        // });
        // fun
        drop.addEventListener('dragenter', handleDragover, false);
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
});