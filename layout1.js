/**
 * 1. First get all the data
 * **/
$(function () {
    let OPTIONS = {
        pixelPerPoints: 5
    };
    let DATA;
    let map = {};
    queryData().then(response => {
        DATA = formatData(response.weatherData, response.eventsData);
        init(DATA);
    });

    function formatData(weatherData, eventsData) {
        let windSpeedData = weatherData.map(r => {
            return [r.time, r.windSpeed, r.windCode]
        });

        let windSpeedStatusData = windSpeedData
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

        return {
            windSpeedData: windSpeedData,
            windSpeedStatusData: windSpeedStatusData,
            eventsData: eventsData,
        };
    }

    function drawChart(data, $dom) {
        map[$dom.attr('identifier')] = Highcharts.chart($dom[0], {
            chart: {
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                events: {
                    selection: selectionHandler,
                    load: function(e) {
                        addWindSpeedStatusData(e);
                        addEventsData(e);
                    }
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    color: 'pink',
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
                    data: data,
                    lineWidth: 0.5,
                    name: 'Time series'
                }
            ],
            credits: {
                enabled: false
            }
        });
    }

    /** Only add wind speed status whens at at least 30 seconds per tick **/
    function addWindSpeedStatusData(e) {
        const chart = e.target;
        const xAxis = chart.xAxis[0];
        let tISecond = xAxis.tickInterval / 1000;
        if ( tISecond <= 30 ) {
            let points = DATA.windSpeedStatusData.filter(d => d.time >= xAxis.min && d.time <= xAxis.max);
            addAnnotations(chart, points);
        }
    }

    function addEventsData(e) {
        const xAxis = e.target.xAxis[0];
        let tickIntervalInMilli = xAxis.tickInterval;
        let points = DATA.eventsData
            .filter(d => d.start >= xAxis.min && d.start <= xAxis.max && d.end <= xAxis.max && (d.duration / tickIntervalInMilli) >= .1);
        addPlotBands(e.target, points);
    }

    function selectionHandler(e) {
        const xAxis = e.xAxis[0];
        const dom = $(e.target.renderTo);
        const sampledData = sampleIfNeed(filterDataForTimeRange(xAxis.min, xAxis.max, DATA.windSpeedData), dom);
        destroyChart(e.target);
        drawChart(sampledData, dom);
        e.preventDefault();
    }

    function filterDataForTimeRange(minTime, maxTime, dataPoints) {
        return dataPoints.filter(p => {
            return p[0] >= minTime && p[0] <= maxTime;
        });
    }

    function sampleIfNeed(dataPoints, dom) {
        let dataPointsLen = dataPoints.length;
        let numAllowedPoints = dom.width() / OPTIONS.pixelPerPoints;
        let isSamplingNeeded = isTooManyPoints(dataPointsLen, numAllowedPoints);
        if (isSamplingNeeded) {
            return averageSample(dataPoints, dataPointsLen, numAllowedPoints);
        }
        return dataPoints;
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

    function isTooManyPoints(dataPoints, numAllowedPoints) {
        return dataPoints > numAllowedPoints;
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

    function queryData() {
        let weatherPromise = $.get('http://localhost:3004/data');
        let eventsPromise = $.get('http://localhost:3006/data');
        return Promise.all([weatherPromise, eventsPromise]).then(response => {
            let weatherData = response[0];
            let eventsData = response[1];
            return {
                weatherData: weatherData,
                eventsData: eventsData
            };
        });
    }

    function destroyChart(chart) {
        // bug in annotation modules
        Highcharts.defaultOptions.annotations = [];
        chart.destroy();
    }

    function addAnnotations(chart, data) {
        data.forEach(d => {
            chart.addAnnotation({
                labelOptions: {
                    backgroundColor: d.color,
                    verticalAlign: 'top',
                    y: 15
                },
                id: d.time,
                labels: [{
                    point: {
                        xAxis: 0,
                        yAxis: 0,
                        x: d.time,
                        y: d.windSpeed
                    },
                    text: d.text
                }]
            });
        });
    }

    function addPlotBands(chart, data) {
        const xAxis = chart.xAxis[0];
        data.map(d => {
            return {
                color: '#93bcff',
                from: d.start,
                to: d.end
            }
        }).forEach(d => xAxis.addPlotBand(d));
    }

    /** Create dashboard layout and start drawing **/
    function init(data) {
        const layoutConfig = {
            content: [{
                type: 'row',
                content: [
                    {
                        type: 'component',
                        componentName: 'chartComponent',
                        componentState: {id: 1}
                    },
                    {
                        type: 'column',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chartComponent',
                                componentState: {id: 2}
                            },
                            {
                                type: 'component',
                                componentName: 'chartComponent',
                                componentState: {id: 3}
                            }
                        ]
                    }]
                    // {
                    //     type: 'component',
                    //     componentName: 'chartComponent',
                    //     componentState: {id: 2}
                    // }]
            }]
        };
        const myLayout = new GoldenLayout( layoutConfig );
        myLayout.registerComponent( 'chartComponent', function(container, state) {
            chartComponent(container, data, state)
        });
        myLayout.init();
    }


    function chartComponent(container, data, state) {
        const dom = container.getElement();
        dom.attr('identifier', state.id);
        container.on( 'open', openHandler.bind(null, dom, data));

        function openHandler(dom, data) {
            const sampleData = sampleIfNeed(data.windSpeedData, dom);
            drawChart(sampleData, dom);
            let timeoutHandler;
            container.on( 'resize', function() {
                if (timeoutHandler) {
                    clearTimeout(timeoutHandler);
                }
                timeoutHandler = setTimeout(function() {
                    console.log('resizing');
                    redrawChart(dom);
                }, 50);
            } );
            container.on( 'destroy', destroy );
        }
    }

    function redrawChart(dom) {
        const chart = map[dom.attr('identifier')];
        const min = chart.xAxis[0].min;
        const max = chart.xAxis[0].max;
        destroyChart(chart);
        drawChart(sampleIfNeed(filterDataForTimeRange(min, max, DATA.windSpeedData), dom), dom);
    }

    function destroy() {

    }
});
