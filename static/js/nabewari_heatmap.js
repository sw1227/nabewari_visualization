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
const tilePixels = 384; // 標高データのピクセル数: tilePixels x tilePixels
// 表示タイル座標群左上のタイル座標: タイル途中の時は以下のように小数を用いればよい
const fromTile = [14, 14523.5, 6464.5];

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
    camera = createCamera(0, 20, 60,  [0, 20, 0], glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats();
    controls = createOrbit(camera);

    // ----- Mesh -----
    // ヒートマップ
    var heatmap = createMap(size=[tileSize, tileSize], shape=[tilePixels-1, tilePixels-1],
			    imgPath='/static/img/heatmap.png');
    scene.add(heatmap);
    // 地図のテクスチャ
    var mapPlane = createMap(size=[tileSize, tileSize], shape=[1, 1],
			     imgPath='/static/img/heatmap.png', color=0x888888);
    scene.add(mapPlane);

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

    // 標高データを読み込む
    d3.csv("/static/data/heatmap_dem_small.csv", function(error, csvData) {
	if (error) throw error;
	var demData = csvData.columns.map(function(d) { return +d; });
	demData.pop(); // np.savetxt()で末尾に余分な","がつくため削除

	updatePoints(heatmap, demData.map(zScale));
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
