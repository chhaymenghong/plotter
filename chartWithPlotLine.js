/**
 * With plot line
 * **/
$(function () {
    $.get('http://localhost:3004/data', function(result) {

        const limit = 50;

        /** Wind data **/
        let windSpeedData = result.map(r => {
           return [r.time, r.windSpeed, r.windCode]
        });
        let windCodeData = result.map(r => {
            return [r.time, r.windCode]
        });
        let windCodeEmergency = windCodeData.filter((r) => r[1] >= 3).map((r) => {
            let windCode = r[1]; let time = r[0];
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
        createGraph('container1', data)
    });

    function createGraph(id, data) {
        console.time('line');
        window.chart = Highcharts.chart(id, {
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
            navigator: {
                enabled: true
            },
            time: {
                useUTC: false
            },
            title: {
                text: 'Drawing ' + data.windSpeedData.length + ' points'
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
        console.timeEnd('line');
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
