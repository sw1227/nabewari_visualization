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

// 標高[m]を座標に変換
function zScale(z) {
    return (z - 350) / 40.0;
}


// ----------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ----------------------------------------------
window.onload = function() {
    clock = new THREE.Clock(); // Controls用
    
    // ----- Scene, Camera, Renderer Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(-60, 40, -60, scene.position, glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight, antiAlias=true); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats();
    controls = createOrbit(camera);

    // ----- Mesh -----
    // 地形のWireframe
    var wireframe = createWireframe(size=[100, 100], shape=[255, 255]);
    scene.add(wireframe);
    // 地図のテクスチャ
    var mapPlane = createMap(size=[100, 100], imgPath='/static/img/nabewari_std.png',
			     color=0x888888);
    scene.add(mapPlane);
    // 鍋割山荘
    var nabewari = createSprite([61.81884841155261*100.0/255-50,
			       zScale(1265.65710830688)+8,
			       121.58329560409766*100.0/255-50],
			      [2.5, 30, 2.5], "/static/img/nabewari_sanso.png");
    scene.add(nabewari);

    // 登山道番号のデータを読み込む
    d3.json("/static/data/nabewari_numbers.json", function(error, numberJson) {
	if (error) throw error3;
	var numbers = createNumbers(numberJson, zScale); // 登山道番号のSprite
	numbers.forEach(function(n) {
	    scene.add(n);
	});
    });

    // GPXに基づくデータを読み込む
    d3.json("/static/data/nabewari_trail.json", function(error, trailJson) {
	if (error) throw error2;
	var trail = createTrail(trailJson, zScale); // GPXの軌跡
	scene.add(trail);
    });

    // 標高データを読み込む
    d3.csv("/static/data/nabewari_dem.csv", function(error, csvData) {
	if (error) throw error1;
	var demData = csvData.columns.map(function(d) { return +d; });
	updatePoints(wireframe, demData.map(zScale));

	render(); // Animation
    });
}


// --------------------------------------
// ----- フレームごとに呼ばれる関数 -----
// --------------------------------------
function render() {
    stats.update();
    controls.update(clock.getDelta());

    // アニメーション
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
