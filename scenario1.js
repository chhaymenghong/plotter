/**
 * With plot line
 * **/
$(function () {
    $('#redraw').on('click', redraw);
    let weatherPromise = $.get('http://localhost:3004/data');
    let eventsPromise = $.get('http://localhost:3006/data');
    let windSpeedData;
    let windCodeAnnotation;
    let events;
    let chart;
    let sampledData;
    let width = $('#container1').width();
    let pixelPerPoints = 5; // this along with width control the visual quality of the chart
    Promise.all([weatherPromise, eventsPromise]).then(function (data) {
        let weatherData = data[0];
        let eventsData = data[1];
        console.log("original: " + weatherData.length);
        formatData(weatherData, eventsData);
        sampledData = sampleIfNeed(windSpeedData);
        console.log("sampled: " + sampledData.length);
        draw('container1', sampledData);
    });

    function formatData(weatherData, eventsData) {
        /** event data **/

        /** Wind data **/
        windSpeedData = weatherData.map(r => {
            return [r.time, r.windSpeed, r.windCode]
        });
        windCodeAnnotation = windSpeedData
            .filter((r) => {
                let windCode = r[2];
                return windCode >= 3;
            })
            .map((r) => {
                let time = r[0];
                let windSpeed = r[1];
                let windCode = r[2];
                return {
                    color: getColor(windCode),
                    text: getLabel(windCode),
                    time: time,
                    windSpeed: windSpeed
                };
            });
        events = eventsData;
    }

    function draw(id, data) {
        let start = window.performance.now();
        chart = Highcharts.chart(id, {
            chart: {
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                events: {
                    selection: selectionHandlers,
                    load: function(e) {
                        addStatus(e);
                        addEvents(e);
                    }
                }
            },
            legend: {
                enabled: false
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

    /** Add annotation when the tick level is 30 second interval **/
    function addStatus(e) {
        console.log(e);
        let tickIntervalInSecond = (e.target.xAxis[0].tickInterval)/ 1000;
        console.log(tickIntervalInSecond);
        // show plotline at 1/2 mn tick interval
        if ( tickIntervalInSecond <= 30 ) {
            let data = windCodeAnnotation.filter(d => {
                return d.time >= e.target.xAxis[0].min && d.time <= e.target.xAxis[0].max;
            });
            console.log(data.length);
            data.forEach(w => {
                e.target.addAnnotation({
                    labelOptions: {
                        backgroundColor: w.color,
                        verticalAlign: 'top',
                        y: 15
                    },
                    labels: [{
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: w.time,
                            y: w.windSpeed
                        },
                        text: w.text
                    }]
                });
            });





        }
    }

    function addEvents(e) {
        let tickIntervalInMilli = (e.target.xAxis[0].tickInterval);
        let min = e.target.xAxis[0].min;
        let max = e.target.xAxis[0].max;
        let data = events.filter(d => {
            let inRange = d.start >= min && d.end <= max;
            // console.log(d.duration/60);
            let fiftyPercentOfTick = (d.duration / tickIntervalInMilli) >= .1;
            return inRange && fiftyPercentOfTick;
        });
        if (data.length > 0) {
            console.log(data[0].labelStart);
        }
        // data.map(w => {
        //     return [[w.start, 250], [w.end, 250]]
        // }).forEach(w => {
        //     e.target.addSeries({
        //         data: [w[0], w[1]],
        //         color: 'aliceblue'
        //     }, true, false);
        // });

        data.map(w => {
            return {
                color: '#93bcff',
                from: w.start,
                to: w.end,
                // label: {
                //     text: w.labelStart
                // }
            }
        }).forEach(w => {
            e.target.xAxis[0].addPlotBand(w);
        });
        console.log(data.length);
        // console.log(e);
        // console.log('tick: ' + tickIntervalInSecond);
    }

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

    function getDataWithinRange(minTime, maxTime, dataPoints) {
        let dataWithinRange = dataPoints.filter(p => {
           return p[0] >= minTime && p[0] <= maxTime;
        });
        return sampleIfNeed(dataWithinRange);
    }
    // [time, windSpeed]
    function sampleIfNeed(dataPoints) {
        let dataPointsLen = dataPoints.length;
        let numAllowedPoints = width / pixelPerPoints;
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
        chart.annotations.forEach(e => {
            e.destroy(); // destroy and recreate the graph
        });
        chart.destroy();
        draw('container1', sampledData);
    }
});
