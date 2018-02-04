


// --------------
// ----- d3 -----
// --------------

// 各グラフ領域のmargin, 大きさ
var margin = {top: 20, right: 20, bottom: 40, left: 60};
var width = 400 - margin.left - margin.right;
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
    .ticks(6)
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
    drawLine(elevation, data, xAxis, eleYaxis, "Elevation [m]", eleLine, "steelblue");
    drawLine(latitude, data, xAxis, latYaxis, "Latitude [deg]", latLine, "coral");
    drawLine(longitude, data, xAxis, lonYaxis, "Longitude [deg]", lonLine, "mediumseagreen");

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
	var pixelX = lonToX(d.lon, fromTile[0]) - 256*fromTile[1];
	var pixelY = latToY(d.lat, fromTile[0]) - 256*fromTile[2];
	var focusX = xyScale(pixelX);
	var focusY = xyScale(pixelY);
	var elevation = zInterpolator(tile);
	focus.position.set(focusX, zScale(elevation(pixelX, tilePixels-pixelY)), focusY)
    }
});


// 折れ線グラフを描画する
function drawLine(selection, data, xAxis, yAxis, yLabel, line, color) {
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
      .attr("stroke", color)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);
}





// --------------------
// ----- Three.js -----
// --------------------

// Variables
var camera;
var scene;
var renderer;
var controls;
var clock;
var focus;
var tile = [];

var glWidth = $("#WebGL-output").innerWidth();
var glHeight = $("#WebGL-output").innerHeight();

const tileSize = 100; // 画面内でのタイルの大きさ: tileSize x tileSize
const tilePixels = 256; // 標高データのピクセル数: tilePixels x tilePixels
const fromTile = [13, 7262, 3232]; // 表示タイル座標群左上のタイル座標

// タイル内でのpixel座標を画面内でのx, yに変換する関数
var xyScale = xyScale(tileSize, tilePixels);

// 標高[m]を座標に変換する関数
function zScale(z) {
    return (z - 350) / 40.0;
}


// ----------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ----------------------------------------------
window.onload = function() {
    clock = new THREE.Clock(); // Controls用
    
    // ----- Scene, Camera, Renderer, Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(15, 30, 90, new THREE.Vector3(200, 0, 100), glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight, antiAlias=true); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    controls = createOrbit(camera);

    // ----- Mesh -----
    // 地形のWireframe
    var wireframe = createWireframe(size=[tileSize, tileSize], shape=[tilePixels-1, tilePixels-1]);
    scene.add(wireframe);

    // マウスの位置に連動して動く点
    focus = createSprite([0, 0, 30], [1, 1, 1], "static/img/red.png");
    scene.add(focus);

    // 鍋割山荘のデータを読み込む
    d3.json("/static/data/nabewari_sanso.json", function(error, sansoJson) {
	if (error) throw error;
	var sanso = createSpritesFromJson(sansoJson, [2, 24, 2], xyScale, zScale, fromTile);
	scene.add(sanso[0]);
    });

    // 登山道番号のデータを読み込む
    d3.json("/static/data/nabewari_numbers_latlon.json", function(error, numberJson) {
	if (error) throw error;
	var numbers = createSpritesFromJson(numberJson, [1.5, 10.5, 1.5], xyScale, zScale, fromTile);
	numbers.forEach(function(n) {
	    scene.add(n);
	});
    });

    // GPXに基づくデータを読み込む
    d3.json("/static/data/nabewari_trail_latlon.json", function(error, trailJson) {
	if (error) throw error;
	var trail = createTrail(trailJson, xyScale, zScale, fromTile); // GPXの軌跡
	scene.add(trail);
    });

    // 標高データを読み込む
    d3.csv("/static/data/small_dem.csv", function(error, csvData) {
	if (error) throw error;
	var demData = csvData.columns.map(function(d) { return +d; });
	demData.pop(); // np.savetxt()で末尾に余分な","がつくため削除

	updatePoints(wireframe, demData.map(zScale));

	while (demData.length) {
	    tile.push(demData.splice(0, 256))
	};

	render(); // Animation
    });
}


// --------------------------------------
// ----- フレームごとに呼ばれる関数 -----
// --------------------------------------
function render() {
    controls.update(clock.getDelta());

    // Animation
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
