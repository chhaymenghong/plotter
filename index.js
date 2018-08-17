$(function () {


    // Highcharts.chart('container2', {
    //
    //     chart: {
    //         zoomType: 'x',
    //         // add stuff periodically
    //         events: {
    //             load: function () {
    //
    //                 // set up the updating of the chart each second
    //                 var series = this.series[0];
    //                 var xAxis = this.axes[0];
    //                 setInterval(function () {
    //                     var x = (new Date()).getTime(), // current time
    //                         y = Math.random();
    //                     series.addPoint([x, y], true, true, true);
    //                     if (y > 0.8) {
    //                         xAxis.addPlotLine({
    //                                 color: '#FF0000', // Red
    //                                 width: 2,
    //                                 label: {
    //                                     text: 'fault'
    //                                 },
    //                                 value: x // Position, you'll have to translate this to the values on your x axis
    //                             });
    //
    //                     }
    //                     // console.log(series.data.length);
    //
    //                 }, 1000);
    //             }
    //         }
    //     },
    //
    //
    //
    //     title: {
    //         text: 'Highcharts drawing ' + n + ' points'
    //     },
    //
    //     subtitle: {
    //         text: 'Using the Boost module'
    //     },
    //
    //     tooltip: {
    //         valueDecimals: 2
    //     },
    //
    //     xAxis: {
    //         type: 'datetime'
    //     },
    //
    //     series: [{
    //         data: (function () {
    //             // generate an array of random data
    //             var data = [],
    //                 time = (new Date()).getTime(),
    //                 i;
    //
    //             for (i = -90; i <= 0; i += 1) {
    //                 data.push({
    //                     x: time + i * 1000,
    //                     y: Math.random()
    //                 });
    //             }
    //             return data;
    //         }()),
    //         lineWidth: 0.5,
    //         name: 'Hourly data points'
    //     }],
    //
    //     credits: {
    //         enabled: false
    //     },
    //     boost: {
    //         enabled: true,
    //         debug: {
    //             showSkipSummary: true
    //         }
    //     }
    //
    // });


    var startTime = new Date('2000-01-01T01:00:00').getTime(); // in milisecond
    var data = createData(startTime, 15);
    createGraph('container1', data);


    /**
     * Generate time series data for this range
     */
    function createData(startTime, days) {
        var rawData = oneSecondInterval(startTime, days);
        var sampledData = largestTriangleThreeBuckets(rawData, 1000);
        return {
            rawData: rawData,
            sampledData: rawData
        };
    }

    function oneSecondInterval(startTime, days) {
        var result = [];
        var totalIncrement = days * 24 * 3600; // increment 1 second at a time
        for (var i = 0; i < totalIncrement; i++) {
            var x = startTime + i * 1000;
            // var y = (Math.random() * 100) - 50;
            var y = 2 * Math.sin(i / 100) + Math.random();
            result.push([x, y]);
        }
        return result;
    }

    function oneHourInterval(startTime, days) {
        var result = [];
        var totalIncrement = days * 24;
        var hourInMilli = 3600000;
        for (var i = 0; i < totalIncrement; i++) {
            var x = startTime + i * hourInMilli;
            var y = (Math.random() * 100) - 50;
            result.push([x, y]);
        }
        return result;
    }

    function filterDataAfterZoom(min, max, originalData) {
        return originalData.filter(function(data) {
            return data.x >= min && data.x <= max;
        });
    }

    /**
     * Create graph
     */
    function createGraph(id, data) {
        function liveData() {
            // set up the updating of the chart each second
            // var series = this.series[0];
            // setInterval(function () {
            //     var latestPoint = series.data[series.data.length - 1];
            //     // console.log(latestPoint);
            //     var x = latestPoint.x + (1000 * 10);
            //     console.log(x);
            //     var y = (Math.random() * 6) - 3;
            //     series.addPoint([x, y], true, false, true);
            //
            // }, 1000);
        }
        console.time('line');
        var a = Highcharts.chart(id, {
            chart: {
                zoomType: 'x',
                events: {
                    load: liveData,
                    selection: function(e) {
                        // var min = Math.floor(e.xAxis[0].min);
                        // var max = Math.ceil(e.xAxis[0].max);
                        // var originalData = e.target.series[0].data;
                        // console.log('original: ' + originalData.length);
                        // var newData = filterDataAfterZoom(min, max, originalData);
                        // console.log('new data: ' + newData.length);
                        // e.preventDefault();
                        // e.target.series[0].setData(newData, true);
                        // console.log(e);
                    }
                }

            },
            time: {
                useUTC: false
            },

            title: {
                text: 'Highcharts drawing ' + data.sampledData.length + ' points'
            },

            subtitle: {
                text: 'Using the Boost module'
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
                name: 'Secondly data points'
            }],

            boost: {
                enabled: true,
                debug: {
                    showSkipSummary: true
                }
            },

            credits: {
                enabled: false
            }

        });
        window.test = a;
        console.timeEnd('line');
    }


    function largestTriangleThreeBuckets(data, threshold) {
        var floor = Math.floor,
            abs = Math.abs;

        var data_length = data.length;
        if (threshold >= data_length || threshold === 0) {
            return data; // Nothing to do
        }

        var sampled = [],
            sampled_index = 0;

        // Bucket size. Leave room for start and end data points
        var every = (data_length - 2) / (threshold - 2);

        var a = 0,  // Initially a is the first point in the triangle
            max_area_point,
            max_area,
            area,
            next_a;

        sampled[ sampled_index++ ] = data[ a ]; // Always add the first point

        for (var i = 0; i < threshold - 2; i++) {

            // Calculate point average for next bucket (containing c)
            var avg_x = 0,
                avg_y = 0,
                avg_range_start  = floor( ( i + 1 ) * every ) + 1,
                avg_range_end    = floor( ( i + 2 ) * every ) + 1;
            avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

            var avg_range_length = avg_range_end - avg_range_start;

            for ( ; avg_range_start<avg_range_end; avg_range_start++ ) {
                avg_x += data[ avg_range_start ][ 0 ] * 1; // * 1 enforces Number (value may be Date)
                avg_y += data[ avg_range_start ][ 1 ] * 1;
            }
            avg_x /= avg_range_length;
            avg_y /= avg_range_length;

            // Get the range for this bucket
            var range_offs = floor( (i + 0) * every ) + 1,
                range_to   = floor( (i + 1) * every ) + 1;

            // Point a
            var point_a_x = data[ a ][ 0 ] * 1, // Enforce Number (value may be Date)
                point_a_y = data[ a ][ 1 ] * 1;

            max_area = area = -1;

            for ( ; range_offs < range_to; range_offs++ ) {
                // Calculate triangle area over three buckets
                area = abs( ( point_a_x - avg_x ) * ( data[ range_offs ][ 1 ] - point_a_y ) -
                    ( point_a_x - data[ range_offs ][ 0 ] ) * ( avg_y - point_a_y )
                ) * 0.5;
                if ( area > max_area ) {
                    max_area = area;
                    max_area_point = data[ range_offs ];
                    next_a = range_offs; // Next a is this b
                }
            }

            sampled[ sampled_index++ ] = max_area_point; // Pick this point from the bucket
            a = next_a; // This a is the next a (chosen b)
        }

        sampled[ sampled_index++ ] = data[ data_length - 1 ]; // Always add last

        return sampled;
    }

});
