/**
 * Features
 * - Load 10 days worth of data and every second, add a new data point.
 * - Zoom on down sample data, not the original data.
 * - 1 chart 1 serie.
 */

$(function () {
    var api = window.Utils;
    var startMilli = new Date('2000-01-01T01:00:00').getTime();
    var days = 1;
    var data = api.createData(startMilli, days, api.oneSecondInterval);
    createGraph('container1', data);
    // createGraph('container2', data);

    function createGraph(id, data) {
        console.time('line');
         Highcharts.chart(id, {
            chart: {
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                events: {
                    load: api.streamData
                }
            },
            plotOptions: {
                series: {
                    color: 'purple',
                    // boostThreshold: 100000000000 // use this to overwrite when boost should kick in
                    // for live data, we dont need this and should instead rely on keep the data point constants
                    // by delete the previous one when addPoint
                }
            },
            time: {
                useUTC: false
            },
            title: {
                text: 'Down sample ' + data.rawData.length + ' points to ' + data.sampledData.length + ' points'
            },
            subtitle: {
                text: 'Add one new point per second at 1 hour interval'
            },
            tooltip: {
                valueDecimals: 2
            },
            xAxis: {
                type: 'datetime'
            },
            series: [{
                data: data.sampledData,
                lineWidth: 0.5,
                name: 'Time series'
            }],
            // boost: {
            //     enabled: true, // only kicks in at 5000 data points by default. overwrite with option above
            //     debug: {
            //         showSkipSummary: true
            //     }
            // },
            credits: {
                enabled: false
            }
        });
        console.timeEnd('line');
    }
});
