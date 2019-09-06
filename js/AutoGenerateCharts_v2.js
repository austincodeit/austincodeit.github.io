function myFunction(zone) {
    if (!zone) {
        zone = "C1"
    }
    DrawCharts(zone);

    //IMAGE OF ZONE
    document.getElementById("zone-screenshot").src="./imgs/zones/Map_"+ zone +".png";
    //HREF OF ZONE
    document.getElementById("zone-link").href="./imgs/zones/Map_"+ zone +".png";
    //TEXT OF ZONE
    $.ajax({
        url: "data/IMN-textfiles/" + zone + "INTRO.txt",
        dataType: "text",
        success: function(data) {
            $("#about-zone-text").html(data);
            // console.log(data)
            // console.log('data retrieved');
        }
    });
}


//to prevent overlapping charts, this function removes the old canvas and adds a new empty one
function drawReset(){
    $("#populationCanvas").remove()
    $("#canvas-holder1").append('<canvas id="populationCanvas" width="400" height="300" />');
    $("#housingCanvas").remove()
    $("#canvas-holder2").append('<canvas id="housingCanvas" width="400" height="300" />');
    $("#incomeCanvas").remove()
    $("#canvas-holder3").append('<canvas id="incomeCanvas" width="400" height="300" />');
    $("#demographicCanvas").remove()
    $("#canvas-holder4").append('<canvas id="demographicCanvas" width="400" height="300" />');
    $("#complaintCanvas").remove()
    $("#canvas-holder5").append('<canvas id="complaintCanvas" width="400" height="300" />');
}

function DrawCharts(zone) {
    drawReset();

    var incomeData = [],
        demographicData = [],
        housingData = [],
        housingUnitData = [],
        complaintData = [],
        councilDistData = [],
        populationData = [],
        populationDistData = [];

    var json1 = d3.csv("data/mdc_v4.csv", function(d) {
        json1 = d;
        
        for (var i = 0; i < json1.length; i++) {
            incomeData.push(parseInt(json1[i][zone + "Income"]));
            councilDistData.push(json1[i][zone + "Cdistrict"]);
            housingData.push(parseInt(json1[i][zone + "Rent"]));
            housingUnitData.push(parseInt(json1[i][zone + "HousingUnit"]));
            populationData.push(parseInt(json1[i][zone + "TotalPopulation"]));
            populationDistData.push(parseInt(json1[i][zone + "PopulationDist"]));
            complaintData.push(json1[i][zone + "Comp"]);
            demographicData.push(parseInt(json1[i][zone + "Demo"]));
        }
        const numberWithCommas = function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        const getPercentValue = function(arr, idx){
            var arrSum = arr.reduce( function(total, current) {
                if (current){
                    return Number(total) + Number(current);
                }
                return total;
            });
            var percent = ( (arr[idx]/arrSum)*100 ).toFixed(1);
            return "("+percent+"%)";
        }
        $("#totalPopHolder").html(numberWithCommas(populationData[0]));
        $("#housingUnitHolder").html(numberWithCommas(housingUnitData[0]));
        $("#councilDistHolder").html(councilDistData[0]);
        $("#zone-selection").html(zone);

        var populationChart = new Chart(document.getElementById("populationCanvas"), {
            type: 'horizontalBar',
            data: {
                labels: ["Less than 9", "10 to 19", "20 to 29", "30 to 39", "40 to 49", "50 to 59", "60 to 69", "70 to 79", "Over 80"],
                datasets: [{
                    backgroundColor: "rgba(11,124,179,.5)",
                    borderColor: "rgba(150,150,150,0.5)",
                    borderWidth: 1,
                    data: populationDistData
                }]
            },
            options: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataArray = data.datasets[0].data;
                            let IndexOfAray = tooltipItem.index;
                            return " "+numberWithCommas(tooltipItem.xLabel) + " "+getPercentValue(dataArray, IndexOfAray);
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            autoSkip: false,
                            userCallback: function(val){
                                return numberWithCommas(val);
                            }
                        },
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'People within Range'
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Age Range'
                        }
                    }]
                }
            }
        });

        var housingChart = new Chart(document.getElementById("housingCanvas"), {
            type: 'doughnut',
            data: {
                labels: ["Owners", "Renters"],
                datasets: [{
                    backgroundColor: ["#D95B43", "#ECD078"],
                    borderColor: "rgb(255,255,255)",
                    borderWidth: 1.25,
                    data: housingData
                }]
            },
            options: {
                legend: {
                    reverse: true
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataArray = data.datasets[0].data;
                            let IndexOfAray = tooltipItem.index;
                            return " "+data.labels[IndexOfAray]+": "+numberWithCommas(dataArray[IndexOfAray]) + " "+getPercentValue(dataArray, IndexOfAray);
                        }
                    }
                }
            }
        });

        var incomeChart = new Chart(document.getElementById("incomeCanvas"), {
            type: 'bar',
            data: {
                labels: ["Less than $14,999", "$15,000 to $24,999", "$25,000 to $34,999", "$35,000 to $49,999", "$50,000 to $74,999", "$75,000 to $99,999", "$100,000 to $149,999", "$150,000 to $199,999", "$200,000 or more"],
                datasets: [{
                    backgroundColor: "rgba(234,228,61,0.5)",
                    borderColor: "rgba(150,150,150,0.5)",
                    borderWidth: 1,
                    data: incomeData
                }]
            },
            options: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataArray = data.datasets[0].data;
                            let IndexOfAray = tooltipItem.index;
                            return " "+numberWithCommas(tooltipItem.yLabel) + " "+getPercentValue(dataArray, IndexOfAray);
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            autoSkip: false,
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            userCallback: function(val){
                                return numberWithCommas(val);
                            }
                        }
                    }]
                }
            }
        });
        var demographicChart = new Chart(document.getElementById("demographicCanvas"), {
            type: 'doughnut',
            data: {
                labels: ["White", "Black", "Asian", "Biracial/Other"],
                datasets: [{
                    backgroundColor: ["#ECD078", "#D95B43", "#C02942", "#53777A"],
                    borderColor: "rgb(255,255,255)",
                    borderWidth: 1.25,
                    data: demographicData
                }]
            },
            options: {
                legend: {
                    reverse: true
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataArray = data.datasets[0].data;
                            let IndexOfAray = tooltipItem.index;
                            return " "+data.labels[IndexOfAray]+": "+numberWithCommas(dataArray[IndexOfAray]) + " "+getPercentValue(dataArray, IndexOfAray);
                        }
                    }
                }
            }
        });

        var complaintChart = new Chart(document.getElementById("complaintCanvas"), {
            type: 'line',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    backgroundColor: ["rgba(230,37,59,.5)"],
                    pointRadius: 3,
                    data: complaintData,
                    fill: true
                }]
            },
            options: {
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let dataArray = data.datasets[0].data;
                            let IndexOfAray = tooltipItem.index;
                            return " "+numberWithCommas(tooltipItem.yLabel) + " "+getPercentValue(dataArray, IndexOfAray);
                        }
                    }
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        },
                        gridLines: {
                            display: false
                            // drawTicks: false
                        },
                    }],
                    yAxes: [{
                        display: true,
                        gridLines: {
                            display: false
                            // drawTicks: false
                        },
                        ticks: {
                            userCallback: function(val){
                                return numberWithCommas(val);
                            }
                        }
                    }]
                }
            }
        });

    });


}

myFunction("C1"); //load N1 when page loads
