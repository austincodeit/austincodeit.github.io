$(document).ready(function() {
  let createFinalPDF = function() {
    // console.log(global_pdf);
    let $directionsText = $('#directions-panel')[0];
    let pdfOptions = {
      orientation: "portrait", // One of "portrait" or "landscape" (or shortcuts "p" (Default), "l")
      unit: "mm", //Measurement unit to be used when coordinates are specified. One of "pt" (points), "mm" (Default), "cm", "in"
      format: "letter" //One of 'a3', 'a4' (Default),'a5' ,'letter' ,'legal'
    };

    let pdf = new jsPDF(pdfOptions);
    /*formatting*/
    pdf.setFont("helvetica");
    pdf.setTextColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    let left_margin = 16;
    const PAGE_HEIGHT = 280;
    const PAGE_WIDTH = 200;
    let content_margin = 40;
    let page_count = 1;
    let labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    /* utility functions */
    let getRightMargin = function(obj) { //this function is to adjust width based on obj length
      return PAGE_WIDTH - (obj.length * 2);
    }
    /* this function will create an encoded string to add the markers to google's static image api */
    let createMarkerArray = function(markerArray) {
      let finalString = '';
      for (let i = 0; i < markerArray.length; i++) {
        if (i == markerArray.length-1) {
          finalString += "&markers=color:green%7Clabel:"+labels[i % labels.length]+"%7C" + String(markerArray[i].lat) + "," + String(markerArray[i].lng);
        } else {
          finalString += "&markers=color:red%7Clabel:"+labels[i % labels.length]+"%7C" + String(markerArray[i].lat) + "," + String(markerArray[i].lng);
        }
      }
      return finalString
    }

    let addLine = function(lineType, yValue) {
      if (lineType == "thin"){
        pdf.setLineWidth(0.25);
        pdf.setDrawColor(200, 200, 200); //add grey dividing line
        pdf.line(left_margin, yValue, PAGE_WIDTH, yValue); // horizontal line
      } else {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(15, 15, 15); //darker color for box
        pdf.line(left_margin, yValue, PAGE_WIDTH, yValue);
      }
    }

    /* setting up the header */
    let addHeader = function() {
      pdf.setFontSize(14);
      pdf.text(left_margin, 20, global_pdf.name); //inspector name
      pdf.setFontSize(10);
      pdf.text(left_margin, 27, '' + global_pdf.start + ' to ' + global_pdf.end); //route address
      pdf.text(getRightMargin(global_pdf.datestamp), 20, "" + global_pdf.datestamp); //today's date
      pdf.text(getRightMargin(global_pdf.timestamp), 27, "" + global_pdf.timestamp); //timestamp
      // console.log(global_pdf.date.length)
      addLine("header", 30);
      //code logo from url file
      //url, type, x, y, imageHeight, imageWidth
      pdf.addImage(codeImgURL, 'JPEG', PAGE_WIDTH / 2, 5, 18, 18);
      addFooter(); //add footer
    }

    /* setting up the footer */
    let addFooter = function() {
      pdf.setFontSize(8);
      pdf.setTextColor(70, 70, 70);
      let footerText = 'City of Austin | Open Data Portal | jsPDF | GitHub'
      let footerMargin = PAGE_WIDTH / 2 - 20;
      let footerHeight = PAGE_HEIGHT - 18;
      pdf.text(footerMargin, footerHeight, footerText); //add footer text
      pdf.text(PAGE_WIDTH, footerHeight, String(page_count)); //add page number
      pdf.setFontType("normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
    }


    let $element = $('#sampleImg');
    let $mapElement = $('#map');
    let mapWidth = 640 //Math.floor(mapElement.width());
    let mapHeight = 400 //Math.floor(mapElement.height());
    let google_1 = "https://maps.googleapis.com/maps/api/staticmap";
    let google_2 = "?center=" + global_pdf.map_center;
    let google_3 = "&zoom=" + global_pdf.map_zoom;
    let google_4 = "&size=640x400";
    let google_5 = createMarkerArray(global_pdf.route_stops);
    let google_6 = "&path=weight:4%7Ccolor:blue%7Cenc:" + global_pdf.route_path;
    let google_k = "&key=AIzaSyCSjAnT5cJ03MwURghAT1nZrLz4InNRpP0";

    let pdfImgWidth = mapWidth * (184 / mapWidth);
    let pdfImgHeight = mapHeight * (105 / mapHeight);
    // let mapImgWidth = 184;
    // let mapImgHeight = 105;
    let picMarginX = 10 + PAGE_WIDTH / 2;
    let picMarginY = content_margin - 10;

    // $(element).attr("src",google_1+google_2+google_3+google_4+google_5+google_6+"&maptype=roadmap"+google_k);
    // console.log(google_1 + google_2 + google_3 + google_4 + google_5 + google_6 + "&maptype=roadmap" + google_k);

    function addGoogleMapImage() {

      let $canvas = document.getElementById("canvasImg")
      let ctx = $canvas.getContext('2d');;
      let img = new Image();
      img.onload = function() {
        //the image has been loaded...
        $canvas.width = mapWidth;
        $canvas.height = mapHeight;
        ctx.drawImage(img, 0, 0, mapWidth, mapHeight);
        let dataUrl = $canvas.toDataURL('image/png', 1.0);

        pdf.addImage(dataUrl, 'JPEG', left_margin, content_margin - 5, pdfImgWidth, pdfImgHeight);
        pdf.setFontType("bold");
        pdf.text(left_margin, content_margin + pdfImgHeight + 20, 'Trip Time: ' + global_pdf.trip_time + " minutes"); //final row
        pdf.text(left_margin + 80, content_margin + pdfImgHeight + 20, 'Trip Distance: ' + global_pdf.trip_dist + " miles"); //final row
        pdf.setFontType("normal");
        // pdf.output('datauri');
        page_count = page_count + 1;
        addTaskContents();
      }
      img.crossOrigin = "anonymous"; // This enables CORS
      img.src = google_1 + google_2 + google_3 + google_4 + google_5 + google_6 + "&maptype=roadmap" + google_k;

    }

    function addTaskContents() {
      pdf.addPage();
      addHeader();
      /* setting up task contents*/
      let tasklist = global_pdf.tasks;
      let inner_margin_A = left_margin + 20;

      for (let i = 0; i < global_pdf.tasks.length; i++) { //for each task, add a new line

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(15, 15, 15); //darker color for box
        pdf.rect(left_margin, content_margin - 3, 5, 5); // empty checkbox
        //X value (from left), Y value (from top), content
        pdf.text(left_margin+1, content_margin+1, labels[i % labels.length]); //row 1
        pdf.text(inner_margin_A, content_margin, tasklist[i].folder_num); //row 1
        pdf.text(inner_margin_A + 60, content_margin, '' + tasklist[i].folder); //row 1
        // pdf.text(inner_margin_A+150,content_margin,'  <Notes>'); //row 1

        pdf.text(inner_margin_A, content_margin + 5, '' + tasklist[i].people); //row 2
        pdf.text(inner_margin_A, content_margin + 10, 'FP: ' + tasklist[i].fp); //row 2
        pdf.text(inner_margin_A + 60, content_margin + 10, 'PP: ' + tasklist[i].pp); //row 2
        // if(i ==0){
        //   pdf.text(inner_margin_A, content_margin + 15, 'Time: ' + tasklist[i].leg_time + ''); //row 3
        //   pdf.text(inner_margin_A + 60, content_margin + 15, 'Distance: ' + tasklist[i].leg_dist + ''); //row 3
        //
        // } else {
        pdf.text(inner_margin_A, content_margin + 15, 'Time: ' + tasklist[i].leg_time + ''); //row 3
        pdf.text(inner_margin_A + 60, content_margin + 15, 'Distance: ' + tasklist[i].leg_dist + ''); //row 3
        // }

        //if we are on the last leg, add the trip total distance,
        if (i == global_pdf.tasks.length - 1) {
          content_margin += 40;
          pdf.setFontType("bold");
          pdf.text(left_margin, content_margin, 'Trip Time: ' + global_pdf.trip_time + " minutes"); //final row
          pdf.text(left_margin + 80, content_margin, 'Trip Distance: ' + global_pdf.trip_dist + " miles"); //final row
        } else if (content_margin >= PAGE_HEIGHT - 80) {
          //check current page height, if we need to go to a new page do that,
          pdf.addPage();
          page_count = page_count + 1;
          //and add new footer
          addFooter()
          content_margin = 30;
        } else {
          //else add a new line
          addLine("thin", content_margin + 18);
          content_margin += 27;
        }

      }
      function callback(){
        alert("done!");
      }
      // $("#loading-overlay").fadeOut("slow");
      // pdf.output( type, options, callback )
      pdf.output('datauri', { } , callback); //end of script

    }

    addHeader(); //add header w footer inside function
    addGoogleMapImage(); //we will add the map first, then add the task contents to complete the function
  } //end of createPDF function


  $("#createPDF").on('click', function() {
    console.log('printing....');
    $("#loading-overlay").fadeIn("slow");
    createFinalPDF();
  });

  // setTimeout(function(){
  //   $("#app-action").show();
  //   $("#createPDF").trigger('click');
  // }, 3000)

});
