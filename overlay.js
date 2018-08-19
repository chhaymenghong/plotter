$(function () {
    $.get('http://localhost:3004/data', function(result) {
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

        let data = {
            // windSpeedData: windSpeedData.slice(0, 50),
            // windCodeData: windCodeData.slice(0, 50),
            // windCodeEmergency: windCodeEmergency.slice(0, 50)
            windSpeedData: windSpeedData,
            windCodeData: windCodeData,
            windCodeEmergency: windCodeEmergency
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
                    color: '#ffd264',
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
