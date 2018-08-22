/**
 * With plot line
 * **/
$(function () {
    $('#redraw').on('click', redraw);
    let weatherPromise = $.get('http://localhost:3004/data');
    let eventsPromise = $.get('http://localhost:3006/data');
    let windSpeedData;
    let windCodeData;
    let windCodeAnnotation;
    let eventsData;
    let chart;
    let sampledData;
    let width = 1000;
    let pointPerPx = 1;
    Promise.all([weatherPromise, eventsPromise]).then(function (data) {
        let weatherData = data[0];
        let eventsData = data[1];
        console.log("original: " + weatherData.length);
        formatData(weatherData);
        sampledData = sampleIfNeed(windSpeedData);
        console.log("sampled: " + sampledData.length);
        draw('container1', sampledData);
    });

    function selectionHandlers(e) {
        console.log(e);
        // let currentData = e.target.chart.series[0].options.data;
        let min = e.xAxis[0].min;
        let max = e.xAxis[0].max;
        // get data within this range
        let data = getDataWithinRange(min, max, windSpeedData); // range on the initial data set coz it has everything in it
        chart.destroy(); // destroy and recreate the graph
        draw('container1', data);
        e.preventDefault();

    }

    function formatData(weatherData) {
        /** event data **/

        /** Wind data **/
        windSpeedData = weatherData.map(r => {
            return [r.time, r.windSpeed]
        });
        windCodeData = weatherData.map(r => {
            return [r.time, r.windCode]
        });
        windCodeAnnotation = windCodeData.filter((r) => r[1] >= 3).map((r) => {
            let windCode = r[1];
            let time = r[0];
            return {
                color: getColor(windCode),
                value: time,
                label: {
                    text: getLabel(windCode),
                    verticalAlign: 'middle',
                    textAlign: 'center'
                },
                width: 5
            }
        });
    }

    function draw(id, data) {
        let start = window.performance.now();
        chart = Highcharts.chart(id, {
            chart: {
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                events: {
                    selection: selectionHandlers
                }
            },
            plotOptions: {
                series: {
                    color: '#081317',
                }
            },
            time: {
                useUTC: false
            },
            title: {
                text: 'Drawing ' + ( data.length ) + ' data points'
            },
            subtitle: {
                text: 'Wind Speed at 5 seconds interval'
            },
            tooltip: {
                valueDecimals: 2
            },
            xAxis: {
                type: 'datetime'
                // plotLines: data.windCodeEmergency
            },
            yAxis: {
                labels: {
                    format: '{value} km/h'
                },
                title: {
                    text: "Wind Speed"
                }
            },
            series: [
                {
                    data: data.slice(0, data.length),
                    lineWidth: 0.5,
                    name: 'Time series'
                }
            ],
            credits: {
                enabled: false
            }
        });
        let end = window.performance.now();
        let time = end - start;
        $('#time1').text('Rendered in: ' + Math.trunc(time) + ' ms');
    }

    function getDataWithinRange(minTime, maxTime, dataPoints) {
        let dataWithinRange = dataPoints.filter(p => {
           return p[0] >= minTime && p[0] <= maxTime;
        });
        return sampleIfNeed(dataWithinRange);
    }
    // [time, windSpeed]
    function sampleIfNeed(dataPoints) {
        let dataPointsLen = dataPoints.length;
        let numAllowedPoints = width / pointPerPx;
        let isSamplingNeeded = isTooBig(dataPointsLen, numAllowedPoints);
        if (isSamplingNeeded) {
            return averageSample(dataPoints, dataPointsLen, numAllowedPoints);
        }
        console.log('no need to sample');
        return dataPoints;
    }

    function isTooBig(dataPoints, numAllowedPoints) {
        return dataPoints > numAllowedPoints;
    }

    function averageSample(dataPoints, dataPointsLen, numAllowedPoints) {
        let samplePoints = [];
        let pointsPerBin = Math.floor(dataPointsLen / numAllowedPoints);
        let start = 0;
        let end = 0;

        for (let step = 1; step <= numAllowedPoints; step++) {
            start = end;
            end += pointsPerBin;
            let slice = dataPoints.slice(start, end);
            let avg = average(slice);
            samplePoints.push( [dataPoints[start][0], avg] );
        }
        return samplePoints;
    }

    function average(list) {
        return list.reduce( ( p, c ) => p + c[1], 0 ) / list.length;
    }

    function getColor(code) {
        switch (code) {
            case 5:
                return '#D84315';
            case 4:
                return '#FF8A65';
            case 3:
                return '#FFCCBC';
        }
    }

    function getLabel(code) {
        switch (code) {
            case 5:
                return 'Emergency';
            case 4:
                return 'Critical';
            case 3:
                return 'Marginal';
        }
    }

    function redraw() {
        chart.destroy();
        draw('container1', sampledData);
    }
});
