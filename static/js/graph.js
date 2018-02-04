var margin = {top: 20, right: 20, bottom: 20, left: 50};
var width = 800 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;

// TimezoneはJSTに変換してある前提
var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S+09:00");

// Scale
var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

// Axis
var xAxis = d3.axisBottom(x)
    .ticks(20)
    .tickFormat(d3.timeFormat("%H:%M"));
var yAxis = d3.axisLeft(y)
    .ticks(12);

// 標高の折れ線グラフ
var line = d3.line()
    .x(function(d) { return x(parseTime(d.time)); })
    .y(function(d) { return y(d.z); });

// 標高グラフの描画領域
var elevation = d3.select("#elevation_graph")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// load file
d3.json("/static/data/nabewari_trail_with_time.json", function(error, data) {
    if (error) throw error;

    x.domain(d3.extent(data, function(d) { return parseTime(d.time); }));
    y.domain(d3.extent(data, function(d) { return d.z; }));

    // x Axis
    elevation.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)

    // y Axis
    elevation.append("g")
      .call(yAxis)
    .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Elevation [m]");

    // Line chart
    elevation.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);
});
