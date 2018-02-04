var margin = {top: 20, right: 20, bottom: 40, left: 60};
var width = 800 - margin.left - margin.right;
var height = 200 - margin.top - margin.bottom;

// TimezoneはJSTに変換してある前提
var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S+09:00");

// ----- Scale -----
var x = d3.scaleTime()
    .rangeRound([0, width]);
var eleY = d3.scaleLinear()
    .rangeRound([height, 0]);
var latY = d3.scaleLinear()
    .rangeRound([height, 0]);
var lonY = d3.scaleLinear()
    .rangeRound([height, 0]);

// ----- Axis -----
var xAxis = d3.axisBottom(x)
    .ticks(20)
    .tickFormat(d3.timeFormat("%H:%M"));
var eleYaxis = d3.axisLeft(eleY)
    .ticks(12);
var latYaxis = d3.axisLeft(latY)
    .ticks(5);
var lonYaxis = d3.axisLeft(lonY)
    .ticks(5);

// ----- 折れ線グラフ -----
var eleLine = d3.line()
    .x(function(d) { return x(parseTime(d.time)); })
    .y(function(d) { return eleY(d.z); });
var latLine = d3.line()
    .x(function(d) { return x(parseTime(d.time)); })
    .y(function(d) { return latY(d.lat); });
var lonLine = d3.line()
    .x(function(d) { return x(parseTime(d.time)); })
    .y(function(d) { return lonY(d.lon); });

// ----- 描画領域 -----
var elevation = d3.select("#elevation_graph")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var latitude = d3.select("#lat_graph")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var longitude = d3.select("#lon_graph")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// load file
d3.json("/static/data/nabewari_trail_with_time.json", function(error, data) {
    if (error) throw error;

    // ----- Scale -----
    x.domain(d3.extent(data, function(d) { return parseTime(d.time); }));

    eleY.domain(d3.extent(data, function(d) { return d.z; }));
    latY.domain(d3.extent(data, function(d) { return d.lat; }));
    lonY.domain(d3.extent(data, function(d) { return d.lon; }));

    // 折れ線グラフを描画
    drawLine(elevation, data, xAxis, eleYaxis, "Elevation [m]", eleLine);
    drawLine(latitude, data, xAxis, latYaxis, "Latitude [deg]", latLine);
    drawLine(longitude, data, xAxis, lonYaxis, "Longitude [deg]", lonLine);
});


// 折れ線グラフを描画する
function drawLine(selection, data, xAxis, yAxis, yLabel, line) {
    // ----- x Axis -----
    selection.append("g")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
      .append("text")
	.attr("fill", "#000")
	.attr("text-anchor", "center")
    	.attr("x", width/2)
    	.attr("y", 30)
	.text("Time");

    // ----- y Axis -----
    selection.append("g")
      .call(yAxis)
    .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text(yLabel);

    // ----- Line chart -----
    selection.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);
}
