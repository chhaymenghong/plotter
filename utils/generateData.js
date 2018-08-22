/**
 * Generate weather and Azimuth angles
 */

let fs = require('fs');
let JSONStream = require('JSONStream');

generateData();

function generateData() {
    let startMilli = new Date('2000-01-01T01:00:00').getTime();
    fakeWeatherAndAzimuthData(startMilli);
    fakeEventsData(startMilli);
}

function fakeEventsData(startMilli) {
    let eventData = {data: []};
    let start = startMilli;
    let end = start;
    let days = 30;
    let endMilli = start + days * 86400000;
    while (end < endMilli) {
        let duration = randomDuration();
        end += duration;
        if (end > endMilli ) {
            break;
        }
        if (Math.random() > 0.5 ) {
            let label = randomLabel();
            eventData.data.push({
                duration: duration,
                start: start,
                end: end,
                labelStart: label.labelStart,
                labelEnd: label.labelEnd
            });
        }
        start = end;
    }
    console.log(eventData.data.length);
    let eventDataJson = JSON.stringify(eventData);
    fs.writeFile('./data/fake/events30day.json', eventDataJson, 'utf8', () => console.log('done'));

    function randomLabel() {
        let i = Math.floor(Math.random() * 3);
        switch (i) {
            case 0:
                return {
                    labelStart: 'SOA',
                    labelEnd: 'EOA'
                };
            case 1:
                return {
                    labelStart: 'Offline',
                    labelEnd: 'Online'
                };
            case 2:
                return {
                    labelStart: 'Start',
                    labelEnd: 'End'
                }
        }
    }
    function randomDuration() {
        let slot = Math.floor(Math.random() * 7);
        switch (slot) {
            case 0:
                return 600; // 10mn
            case 1:
                return 1200; // 20mn
            case 2:
                return 3600; // 1hr
            case 3:
                return 7200; // 2hr
            case 4:
                return 86400; // 1day
            case 5:
                return 172800; // 2 days
            case 6:
                return 864000 // 10 days
        }
    }
}

function fakeWeatherAndAzimuthData(startMilli) {
    let weatherData = {};
    let azimuthData = {};
    let data = fakeData(startMilli, 1);
    weatherData.data = data.weather;
    azimuthData.data = data.azimuth;

    let weatherJson = JSON.stringify(weatherData);
    let azimuthJson = JSON.stringify(azimuthData);

    fs.writeFile('./data/fake/weather1Day.json', weatherJson, 'utf8', () => console.log('done'));
    fs.writeFile('./data/fake/azimuth1Day.json', azimuthJson, 'utf8', () => console.log('done'));

    data = fakeData(startMilli, 30);
    weatherData.data = data.weather;
    azimuthData.data = data.azimuth;

    weatherJson = JSON.stringify(weatherData);
    azimuthJson = JSON.stringify(azimuthData);

    fs.writeFile('./data/fake/weather30Day.json', weatherJson, 'utf8', () => console.log('done'));
    fs.writeFile('./data/fake/azimuth30Day.json', azimuthJson, 'utf8', () => console.log('done'));

    function fakeData(startMilli, days) {
        let weather = [];
        let azimuth = [];

        let totalIncrement = days * 24 * 720; // increment 5 seconds interval
        for (let i = 0; i < totalIncrement; i++) {
            let time = startMilli + i * 5000;

            weather.push({
                time: time,
                windSpeed: Math.ceil(Math.random() * 500),
                windCode: Math.ceil(Math.random() * 5), // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
                windDirection: Math.ceil(Math.random() * 360),
                windDirectionCode: Math.ceil(Math.random() * 5), // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
                temperature: ( Math.random() * 100 ) - 50, // -50 to 50
                temperatureCode: Math.ceil(Math.random() * 5) // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
            });

            azimuth.push({
                time: time,
                azimuthAngle: Math.random() * 360,
                azimuthAngleCode: Math.ceil(Math.random() * 5) // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
            });
        }
        return {
            weather: weather,
            azimuth: azimuth
        };
    }
}

// function streamFakeData(startMilli, days) {
//     let transformStream = JSONStream.stringify();
//     let outputStream = fs.createWriteStream( "./data/fake/weather365Day.json" );
//     transformStream.pipe( outputStream );
//
//     let totalIncrement = days * 24 * 3600;
//     console.log(totalIncrement);
//     for (let i = 0; i < totalIncrement; i++) {
//         let time = startMilli + i * 5000;
//
//         let a = {
//             time: time,
//             windSpeed: Math.ceil(Math.random() * 500),
//             windCode: Math.ceil(Math.random() * 5), // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
//             windDirection: Math.ceil(Math.random() * 360),
//             windDirectionCode: Math.ceil(Math.random() * 5), // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
//             temperature: ( Math.random() * 100 ) - 50, // -50 to 50
//             temperatureCode: Math.ceil(Math.random() * 5) // 0 - 5 ( out of service, operational, deviation, marginal, critical, emergency )
//         };
//         transformStream.write(a);
//     }
//     transformStream.end();
//     outputStream.on(
//         "finish",
//         function handleFinish() {
//             console.log( "done" );
//
//         }
//     );
// }
