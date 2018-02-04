// -------------------
// ----- Leaflet -----
// -------------------
var leafletMap = L.map('leaflet_map').setView([35.437,139.144], 15);

L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a> contributors'
}).addTo(leafletMap);

var marker = L.marker([35.443905,139.141607]).addTo(leafletMap)
    .bindPopup('Nabewari hut<br><img width="150" src="/static/bokka_num/nabewari.JPG"><br>');

d3.json("/static/data/bokka_route.geojson", function(error, geojson) {
    if (error) throw error;
    L.geoJSON(geojson).addTo(leafletMap);
});

// --------------
// ----- d3 -----
// --------------

// 各グラフ領域のmargin, 大きさ
var margin = {top: 20, right: 20, bottom: 40, left: 60};
var width = 600 - margin.left - margin.right;
var height = 200 - margin.top - margin.bottom;

var svg = d3.select("#line_chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", 3*(height + margin.top + margin.bottom))
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// TimezoneはJSTに変換してある前提
var parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S+09:00");
var bisectDate = d3.bisector(function(d) { return parseTime(d.time); }).left;
var formatEle = function(e) { return d3.format(",.1f")(e) + " [m]"; };
var formatDegree = function(e) { return d3.format(",.4f")(e) + " [deg]"; };

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
var elevation = svg.append("g")
    .attr("class", "elevation")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");
var latitude = svg.append("g")
    .attr("class", "latitude")
    .attr("transform", "translate(" + 0 + ","  +
	  (height + margin.top + margin.bottom) + ")");
var longitude = svg.append("g")
    .attr("class", "longitude")
    .attr("transform", "translate(" + 0 + ","  +
	  2*(height + margin.top + margin.bottom) + ")");

// ----- マウスに追尾する要素 -----
// 縦線（折れ線より奥でOK）
var verticalLine = svg.append("line")
    .attr("class", "vertical")
    .style("display", "none")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 2*(margin.top + margin.bottom) + 3*height);


// load file
d3.json("/static/data/nabewari_trail_with_time.json", function(error, data) {
    if (error) throw error;

    // ----- Scale -----
    x.domain(d3.extent(data, function(d) { return parseTime(d.time); }));

    eleY.domain(d3.extent(data, function(d) { return d.z; }));
    latY.domain(d3.extent(data, function(d) { return d.lat; }));
    lonY.domain(d3.extent(data, function(d) { return d.lon; }));

    // ----- 折れ線グラフを描画 -----
    drawLine(elevation, data, xAxis, eleYaxis, "Elevation [m]", eleLine);
    drawLine(latitude, data, xAxis, latYaxis, "Latitude [deg]", latLine);
    drawLine(longitude, data, xAxis, lonYaxis, "Longitude [deg]", lonLine);

    // ----- マウスに近い位置のデータに対するフォーカス(折れ線の手前に描画) -----
    var eleFocus = elevation.append("g")
	.attr("class", "focus")
	.style("display", "none");
    var latFocus = latitude.append("g")
	.attr("class", "focus")
	.style("display", "none");
    var lonFocus = longitude.append("g")
	.attr("class", "focus")
	.style("display", "none");

    eleFocus.append("circle")
	.attr("r", 4);
    latFocus.append("circle")
	.attr("r", 4);
    lonFocus.append("circle")
	.attr("r", 4);

    eleFocus.append("text")
	.attr("x", 10)
	.attr("dy", ".35em");
    latFocus.append("text")
	.attr("x", 10)
	.attr("dy", ".35em");
    lonFocus.append("text")
	.attr("x", 10)
	.attr("dy", ".35em");

    // ----- マウス位置を取得するためのoverlay -----
    svg.append("rect")
	.attr("class", "overlay")
	.attr("width", width)
	.attr("height", 2*(margin.top + margin.bottom) + 3*height)
	.on("mouseover", function() {
	    verticalLine.style("display", null);
	    eleFocus.style("display", null);
	    latFocus.style("display", null);
	    lonFocus.style("display", null);
	})
	.on("mouseout", function() {
	    verticalLine.style("display", "none");
	    eleFocus.style("display", "none");
	    latFocus.style("display", "none");
	    lonFocus.style("display", "none");
	})
	.on("mousemove", onMouseMove);

    function onMouseMove() {
	var mouseX = d3.mouse(this)[0];
	// 縦線の位置を更新
	verticalLine
	    .attr("x1", mouseX)
	    .attr("x2", mouseX);
	// 値を表示
	var x0 = x.invert(mouseX); // mouseXに対応する時刻
	var i = bisectDate(data, x0, 1);
	var dLeft = data[i-1];
	var dRight = data[i];
	var d = ( (x0 - parseTime(dLeft.time)) > (parseTime(dRight.time) - x0) ) ? dRight : dLeft;
	eleFocus.attr("transform", "translate(" + x(parseTime(d.time)) + "," + eleY(d.z) + ")");
	latFocus.attr("transform", "translate(" + x(parseTime(d.time)) + "," + latY(d.lat) + ")");
	lonFocus.attr("transform", "translate(" + x(parseTime(d.time)) + "," + lonY(d.lon) + ")");
	eleFocus.select("text").text(formatEle(d.z));
	latFocus.select("text").text(formatDegree(d.lat));
	lonFocus.select("text").text(formatDegree(d.lon));
	marker.setLatLng(L.latLng(d.lat, d.lon));
    }

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
