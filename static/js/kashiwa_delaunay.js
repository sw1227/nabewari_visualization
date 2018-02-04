// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var clock;

var glWidth = window.innerWidth;
var glHeight = window.innerHeight - $('nav').innerHeight();

// 自動的にリサイズする
window.addEventListener('resize', function() {
    glWidth = window.innerWidth;
    glHeight = window.innerHeight - $('nav').innerHeight();
    camera.aspect = glWidth / glHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(glWidth, glHeight);
}, false);

const tileSize = 100; // 画面内でのタイルの大きさ: tileSize x tileSize
const tilePixels = 256; // 標高データのピクセル数: tilePixels x tilePixels
const fromTile = [13, 7280, 3219]; // 表示タイル座標群左上のタイル座標

// タイル内でのpixel座標を画面内でのx, yに変換する関数
var xyScale = xyScale(tileSize, tilePixels);

// 標高[m]を座標に変換する関数
function zScale(z) {
    return (z - 5.0)/2.0;
}


// ----------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ----------------------------------------------
window.onload = function() {
    clock = new THREE.Clock(); // Controls用
    
    // ----- Scene, Camera, Renderer, Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(15, 30, 90, scene.position, glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight, antiAlias=true); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats();
    controls = createOrbit(camera);

    // ----- Mesh -----
    // ランドマークのデータを読み込む
    d3.json("/static/data/kashiwa_sprites.json", function(error, json) {
	if (error) throw error;
	var landmarks = createSpritesFromJson(json, [2.5, 25, 2.5], xyScale, zScale, fromTile,
					      opacity=0.9);
	landmarks.forEach(function(d) {
	    scene.add(d);
	});
    });

    // 標高データを読み込む
    d3.csv("/static/data/kashiwa_dem.csv", function(error, csvData) {
	if (error) throw error;
	var demData = csvData.columns.map(function(d) { return +d; });
	demData.pop(); // np.savetxt()で末尾に余分な","がつくため削除

	// 地図を地形にマッピングしたもの
	var textureMap = createMap(size=[tileSize, tileSize], shape=[tilePixels-1, tilePixels-1],
				   imgPath="/static/img/kashiwa/kashiwa_map.png", color=0x888888);
	scene.add(textureMap);
	updatePoints(textureMap, demData.map(function(d) { return zScale(d)-1; }));

	// 標高データを2Dにする
	var kashiwaTile = [];
	while (demData.length) {
	    kashiwaTile.push(demData.splice(0, 256))
	};

	// Delaunay
	var delaunay = createDelaunay([tileSize, tileSize], kashiwaTile, 400, xyScale, zScale,
				      maxDistance=40, showPoints=true, pointSize=5);
	delaunay.forEach(function(d) {
	    scene.add(d);
	});

	render(); // Animation
    });
}

// --------------------------------------
// ----- フレームごとに呼ばれる関数 -----
// --------------------------------------
function render() {
    stats.update();
    controls.update(clock.getDelta());

    // Animation
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
