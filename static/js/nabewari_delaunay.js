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
const fromTile = [13, 7262, 3232]; // 表示タイル座標群左上のタイル座標

// タイル内でのpixel座標を画面内でのx, yに変換する関数
var xyScale = xyScale(tileSize, tilePixels);

// 標高[m]を座標に変換する関数
function zScale(z) {
    return (z - 350) / 40.0;
}


// ------------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ------------------------------------------------
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
    controls = createTrackball(camera);

    // ----- Mesh -----
    // 鍋割山荘のデータを読み込む
    d3.json("/static/data/nabewari_sanso.json", function(error, sansoJson) {
	if (error) throw error;
	var sanso = createSpritesFromJson(sansoJson, [2.5, 30, 2.5], xyScale, zScale, fromTile);
	scene.add(sanso[0]);
    });

    // 登山道番号のデータを読み込む
    d3.json("/static/data/nabewari_numbers_latlon.json", function(error, numberJson) {
	if (error) throw error;
	var numbers = createSpritesFromJson(numberJson, [2, 14, 2], xyScale, zScale, fromTile);
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

	// 標高データを2Dにする
	// TODO: csvを2Dにしておける？
	var nabewariTile = [];
	while (demData.length) {
	    nabewariTile.push(demData.splice(0, 256))
	};

	// Delaunay
	var delaunay = createDelaunay([tileSize, tileSize], nabewariTile, 4000);
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
