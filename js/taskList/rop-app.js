$(document).ready(function(){

		let openDataLink  = 'https://data.austintexas.gov/resource/icyb-dhz7.json'

		$.ajax({
				url: openDataLink,
				type: "GET",
				data: {
					"$limit" : 6000,
					"$$app_token" : "n89g7s9iUyusfWDEHDHMtGcVT"
				}
		}).done(function(data) {

			//prep dataset by sorting & counting data incidents
			let sortedData = _.sortBy(data, 'activitydate');
			// console.log(sortedData);
			let counts = _.countBy(sortedData,'activitydate');
			let uniqueProp = _(data).chain().flatten().pluck('registeredaddress').unique().value();

			//1 get total count add add it to the dash-total panel
			$("#full-count").html(data.length);
			$("#full-prop-count").html(uniqueProp.length);
			//variables for typeChart
			let bscCount=0, citeCount=0, inspectCount=0, novCount=0, warningCount=0, nullCount=0;

			//variables for timelineChart
			//value = count, key = date that was counted
			let timeSeriesData = _.map(counts, function(value, key){
				let _d = new Date(key);
				let yr = _d.getFullYear();

				if (yr == 216){ yr = 2016; console.log(yr);}
				let mth = _d.getMonth();
				let day = _d.getDate();
				return [ Date.UTC(yr,mth,day),  value	];
			});
				// [Date.UTC(2013,5,9),3],

			// console.log(dataCounted);

			let activityCounts = _.countBy(sortedData,'activitytype');
			let zipCodeCount = _.countBy(data,'zipcode');

			let activityValues = _.values(activityCounts);
			let activityKeys = _.keys(activityCounts);

			let zipValues = _.values(zipCodeCount);
			let zipKeys = _.keys(zipCodeCount);

			let activityTypeChart = Highcharts.chart('container-type', {
				chart: {
						type: 'bar'
				},
				title: {
						text: 'Activities by Type'
				},
				xAxis: {
						categories: activityKeys
				},
				yAxis: {
						title: {
								text: ''
						}
				},
				series: [{
						name: ['Total Count'],
						data: activityValues,
						dataLabels: {
	            enabled: true,
	            // color: '#FFFFFF',
	            align: 'right',
	            // format: '{point.y:.1f}', // one decimal
	            // y: 10, // 10 pixels down from the top
	            style: {
	                // fontSize: '10px',
	                // fontFamily: 'Verdana, sans-serif'
	            }
	        }
				}]
			}); //end of myChart

			let timelineChart = Highcharts.chart('container-time', {
        // chart: {
        //     zoomType: 'x'
        // },
        title: {
            text: 'Activity Counts Over Time'
        },
        // subtitle: {
        //     text: document.ontouchstart === undefined ?
        //             'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        // },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },
        series: [{
            type: 'area',
            name: 'Activities',
            data: timeSeriesData
        }]
    });
		let zipCountChart = Highcharts.chart('container-zip', {
			chart: {
					type: 'column'
			},
			title: {
					text: 'ROP Acivitiy by Zip Code'
			},
			xAxis: {
					categories: zipKeys
			},
			yAxis: {
					title: {
							text: ''
					}
			},
			series: [{
					name: ['Total Count'],
					data: zipValues,
					dataLabels: {
						enabled: true,
						// color: '#FFFFFF',
						align: 'right',
						// format: '{point.y:.1f}', // one decimal
						// y: 10, // 10 pixels down from the top
						style: {
								// fontSize: '10px',
								// fontFamily: 'Verdana, sans-serif'
						}
				}
			}]
		}); //end of myChart



					//variables for leaflet (geojson)
					var markers = L.markerClusterGroup();

					function dateFormatting(d){
						let _d = new Date(d);
						let yr = _d.getFullYear();
						let mth = _d.getMonth();
						let day = _d.getDate();
						return ""+mth+"/"+day+"/"+yr;
					}

					function onEachFeature(feature, layer) {
							let popUpHTML = '<table><tr><th>Name: </th><td> '+ feature.properties.name +'</td></tr>'+
							'<tr><th>Activity Type: </th><td> '+ feature.properties.activityType +'</td></tr>'+
							'<tr><th>Activity Date: </th><td> '+ dateFormatting(feature.properties.activityDate) +'</td></tr>';

					    // does this feature have a property named popupContent?
					    if (feature.properties) {
					        layer.bindPopup(popUpHTML);
					    }
					}

					let geojsonFeature = _.map(data, function(value, key){
						return {
										"type": "Feature",
										"properties": {
												"id": key,
												"name": value.registeredaddress,
												"activityDate": value.activitydate,
												"activityType": value.activitytype,

										},
										"geometry": value.location_1
//										{
												// "type": "Point",
												// "coordinates": [-104.99404, 39.75621]
	//									}
									}
				});

					// console.log(data);


				/* LEAFLET SECTION!!!*/
				let myMap = L.map('leaflet-map').setView([30.2741121,-97.7521457], 12);
				// https: also suppported.
				let OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
					maxZoom: 18,
					attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				}).addTo(myMap);

				// L.geoJSON(geojsonFeature, {
				//     onEachFeature: onEachFeature
				// }).addTo(mymap);
				let geojsonLayer = L.geoJSON(geojsonFeature, {
				    onEachFeature: onEachFeature
				});
				markers.addLayer(geojsonLayer);
				myMap.addLayer(markers);
				myMap.fitBounds(markers.getBounds());


		}); //end of ajax request
  });
