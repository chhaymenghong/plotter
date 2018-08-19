/**
 * With plot line
 * **/
$(function () {
    $.get('http://localhost:3004/data', function (result) {
        const limit = 60;

        /** Wind data **/
        let windSpeedData = result.map(r => {
            return [r.time, r.windSpeed, r.windCode]
        });
        let windCodeData = result.map(r => {
            return [r.time, r.windCode]
        });
        let windCodeEmergency = windCodeData.filter((r) => r[1] >= 3).map((r) => {
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

        /** Temperature data **/
        const temperatureData = result.map(r => {
            return [r.time, r.temperature, r.temperatureCode];
        });


        let data = {
            windSpeedData: windSpeedData.slice(0, limit),
            windCodeData: windCodeData.slice(0, limit),
            windCodeEmergency: windCodeEmergency.slice(0, limit),

            temperatureData: temperatureData.slice(0, limit)
        };
        drawGraphWithPlotLine('container1', data);
        let data2 = [
            {
                name: 'Wind Speed',
                data: windSpeedData.slice(0, limit),
            },
            {
                name: 'Temperature',
                data: temperatureData.slice(0, limit)
            }
        ];
        drawSyncGraph('container2', data2);
    });

    function drawGraphWithPlotLine(id, data) {
        let start = window.performance.now();
        Highcharts.chart(id, {
            chart: {
                zoomType: 'x',
                panning: true,
                panKey: 'shift'
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
                text: 'Drawing ' + ( data.windSpeedData.length + data.windCodeEmergency.length ) + ' data points'
            },
            subtitle: {
                text: 'Wind Speed at 5 seconds interval'
            },
            tooltip: {
                valueDecimals: 2
            },
            xAxis: {
                type: 'datetime',
                plotLines: data.windCodeEmergency
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
                    data: data.windSpeedData,
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

    function drawSyncGraph(id, data) {

        /**
         * Override this so that when moving mouse in the empty space between the two charts, the vertical crosshair shows up
         */
        Highcharts.Pointer.prototype.reset = function () {
            return undefined;
        };

        /**
         * In order to synchronize tooltips and crosshairs, override the
         * built-in events with handlers defined on the parent element.
         */
        $('#' + id).bind('mousemove touchmove touchstart', function (e) {
            Highcharts.charts.forEach(chart => {
                // Find coordinates within the chart
                let event = chart.pointer.normalize(e.originalEvent);
                // Get the hovered point
                let point = chart.series[0].searchPoint(event, true);
                if (point) {
                    point.onMouseOver(); // Move the marker
                }
            });
        });


        let start = window.performance.now();
        data.forEach((d, i) => {
            $('<div class="chart">')
                .appendTo('#' + id)
                .highcharts({
                    chart: {
                        zoomType: 'x',
                        spacingTop: 20,
                        spacingBottom: 20,
                        panning: true,
                        panKey: 'shift'
                    },
                    time: {
                        useUTC: false
                    },
                    title: {
                        text: d.name,
                        align: 'left',
                    },
                    legend: {
                        enabled: false
                    },
                    exporting: {
                        enabled: false
                    },
                    // Customize tooltip placement
                    tooltip: {
                        positioner: function () {
                            return {
                                // right aligned
                                x: this.chart.chartWidth - this.label.width,
                                y: 10 // align to title
                            };
                        },
                        borderWidth: 0,
                        backgroundColor: 'none',
                        pointFormat: '{point.y}' + (i === 0 ? ' Km/h' : ' C'),
                        headerFormat: '',
                        shadow: false,
                        style: {
                            fontSize: '18px'
                        },
                        valueDecimals: 2
                    },
                    xAxis: {
                        crosshair: true, // to show the line
                        type: 'datetime',
                        events: {
                            setExtremes: syncExtremes
                        },
                    },
                    yAxis: {
                        title: {
                            text: null
                        }
                    },

                    series: [
                        {
                            data: d.data,
                            lineWidth: 0.5,
                            name: 'Time series',
                            color: Highcharts.getOptions().colors[i],
                        }
                    ],
                    credits: {
                        enabled: false
                    }
                });
        });
        let end = window.performance.now();
        let time = end - start;
        $('#time2').text('Rendered in: ' + Math.trunc(time) + ' ms');
    }

    /**
     * Synchronize zooming through the setExtremes event handler.
     */
    function syncExtremes(e) {
        let thisChart = this.chart;

        // Prevent feedback loop
        if (e.trigger !== 'syncExtremes') {
            Highcharts.each(Highcharts.charts, function (chart) {
                // only reset its counterpart, not itself since we are already zooming on itself
                if (chart !== thisChart) {
                    if (chart.xAxis[0].setExtremes) { // It is null while updating
                        chart.xAxis[0].setExtremes(
                            e.min,
                            e.max,
                            true,
                            true,
                            { trigger: 'syncExtremes' }
                        );
                    }
                }
            });
        }
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
});
