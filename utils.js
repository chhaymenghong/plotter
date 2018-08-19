function createData(startTime, days, intervalCb, downSample) {
    let rawData = intervalCb(startTime, days);
    let sampledData = largestTriangleThreeBuckets(rawData, downSample || 0);
    return {
        rawData: rawData,
        sampledData: sampledData,
        originalSampledData: sampledData.slice(0)
    };
}


function largestTriangleThreeBuckets(data, threshold) {
    let floor = Math.floor,
        abs = Math.abs;

    let data_length = data.length;
    if (threshold >= data_length || threshold === 0) {
        return data; // Nothing to do
    }

    let sampled = [],
        sampled_index = 0;

    // Bucket size. Leave room for start and end data points
    let every = (data_length - 2) / (threshold - 2);

    let a = 0,  // Initially a is the first point in the triangle
        max_area_point,
        max_area,
        area,
        next_a;

    sampled[sampled_index++] = data[a]; // Always add the first point

    for (let i = 0; i < threshold - 2; i++) {

        // Calculate point average for next bucket (containing c)
        let avg_x = 0,
            avg_y = 0,
            avg_range_start = floor(( i + 1 ) * every) + 1,
            avg_range_end = floor(( i + 2 ) * every) + 1;
        avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

        let avg_range_length = avg_range_end - avg_range_start;

        for (; avg_range_start < avg_range_end; avg_range_start++) {
            avg_x += data[avg_range_start][0] * 1; // * 1 enforces Number (value may be Date)
            avg_y += data[avg_range_start][1] * 1;
        }
        avg_x /= avg_range_length;
        avg_y /= avg_range_length;

        // Get the range for this bucket
        let range_offs = floor((i + 0) * every) + 1,
            range_to = floor((i + 1) * every) + 1;

        // Point a
        let point_a_x = data[a][0] * 1, // Enforce Number (value may be Date)
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
    let result = [];
    let previousY = 0;
    let totalIncrement = days * 24 * 3600; // increment 1 second at a time
    for (let i = 0; i < totalIncrement; i++) {
        let x = startTime + i * 1000;
        let y = previousY + (Math.random() * 100) - 50;
        result.push([x, y]);
        previousY = y;
    }
    return result;
}

function oneHourInterval(startTime, days) {
    let result = [];
    let totalIncrement = days * 24;
    let hourInMilli = 3600000;
    for (let i = 0; i < totalIncrement; i++) {
        let x = startTime + i * hourInMilli;
        let y = (Math.random() * 100) - 50;
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
    let serie = e.target.series[0];
    let previousY;
    setInterval(function () {
        let latestPoint = serie.data[serie.data.length - 1];
        previousY = latestPoint.y;

        let x = latestPoint.x + 1000 * 3600;
        let y = previousY + (Math.random() * 10000) - 5000;
        serie.addPoint([x, y], true, true, true);
    }, 1000);
}

function zoomHandler(e) {
    let min = Math.floor(e.xAxis[0].min);
    let max = Math.ceil(e.xAxis[0].max);
    let originalData = e.target.series[0].data;
    let newData = filterDataAfterZoom(min, max, originalData);
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
