/**
 * Generate weather and Azimuth angles
 */

let fs = require('fs');

generateData();

function generateData() {
    let startMilli = new Date('2000-01-01T01:00:00').getTime();

    let weatherData = {};
    let azimuthData = {};
    let data = fakeData(startMilli, 1);
    weatherData.data = data.weather;
    azimuthData.data = data.azimuth;

    let weatherJson = JSON.stringify(weatherData);
    let azimuthJson = JSON.stringify(azimuthData);

    fs.writeFile('./data/fake/weather.json', weatherJson, 'utf8', () => console.log('done'));
    fs.writeFile('./data/fake/azimuth.json', azimuthJson, 'utf8', () => console.log('done'));
}


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
