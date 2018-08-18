function createData(startTime, days, intervalCb, downSample) {
    var rawData = intervalCb(startTime, days);
    var sampledData = largestTriangleThreeBuckets(rawData, downSample || 0);
    return {
        rawData: rawData,
        sampledData: sampledData,
        originalSampledData: sampledData.slice(0)
    };
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

    sampled[sampled_index++] = data[a]; // Always add the first point

    for (var i = 0; i < threshold - 2; i++) {

        // Calculate point average for next bucket (containing c)
        var avg_x = 0,
            avg_y = 0,
            avg_range_start = floor(( i + 1 ) * every) + 1,
            avg_range_end = floor(( i + 2 ) * every) + 1;
        avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

        var avg_range_length = avg_range_end - avg_range_start;

        for (; avg_range_start < avg_range_end; avg_range_start++) {
            avg_x += data[avg_range_start][0] * 1; // * 1 enforces Number (value may be Date)
            avg_y += data[avg_range_start][1] * 1;
        }
        avg_x /= avg_range_length;
        avg_y /= avg_range_length;

        // Get the range for this bucket
        var range_offs = floor((i + 0) * every) + 1,
            range_to = floor((i + 1) * every) + 1;

        // Point a
        var point_a_x = data[a][0] * 1, // Enforce Number (value may be Date)
            point_a_y = data[a][1] * 1;

        max_area = area = -1;

        for (; range_offs < range_to; range_offs++) {
            // Calculate triangle area over three buckets
            area = abs(( point_a_x - avg_x ) * ( data[range_offs][1] - point_a_y ) -
                ( point_a_x - data[range_offs][0] ) * ( avg_y - point_a_y )
            ) * 0.5;
            if (area > max_area) {
                max_area = area;
                max_area_point = data[range_offs];
                next_a = range_offs; // Next a is this b
            }
        }

        sampled[sampled_index++] = max_area_point; // Pick this point from the bucket
        a = next_a; // This a is the next a (chosen b)
    }

    sampled[sampled_index++] = data[data_length - 1]; // Always add last

    return sampled;
}

function oneSecondInterval(startTime, days) {
    var result = [];
    var previousY = 0;
    var totalIncrement = days * 24 * 3600; // increment 1 second at a time
    for (var i = 0; i < totalIncrement; i++) {
        var x = startTime + i * 1000;
        var y = previousY + (Math.random() * 100) - 50;
        result.push([x, y]);
        previousY = y;
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
    return originalData.filter(function (data) {
        return data.x >= min && data.x <= max;
    });
}

function setupReset(data, chart) {
    document.getElementById('rest').addEventListener('click', function(){
        chart.series[0].setData(data.originalSampledData, true, true, true);
    });
}

function streamData(e) {
    var serie = e.target.series[0];
    var previousY;
    setInterval(function () {
        var latestPoint = serie.data[serie.data.length - 1];
        previousY = latestPoint.y;

        var x = latestPoint.x + 1000 * 3600;
        var y = previousY + (Math.random() * 10000) - 5000;
        console.log(serie.data.length);
        serie.addPoint([x, y], true, true, true);
    }, 1000);
}

function zoomHandler(e) {
    var min = Math.floor(e.xAxis[0].min);
    var max = Math.ceil(e.xAxis[0].max);
    var originalData = e.target.series[0].data;
    var newData = filterDataAfterZoom(min, max, originalData);
    e.preventDefault();
    e.target.series[0].setData(newData, true);
}

function addPlotLine(xAxis, value, label, color) {
    xAxis.addPlotLine({
        color: color,
        width: 2,
        label: {
            text: label
        },
        value: value
    });
}

window.Utils = {
    filterDataAfterZoom: filterDataAfterZoom,
    oneHourInterval: oneHourInterval,
    oneSecondInterval: oneSecondInterval,
    largestTriangleThreeBuckets: largestTriangleThreeBuckets,
    createData: createData,
    setupReset: setupReset,
    streamData: streamData,
    zoomHandler: zoomHandler,
    addPlotLine: addPlotLine
};
