// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var clock;
var demData;

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


// ----------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ----------------------------------------------
window.onload = function() {
    clock = new THREE.Clock(); // Controls用
    
    // ----- Scene, Camera, Renderer Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(-60, 40, -60, scene.position, glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats();
    controls = createTrackball(camera);

    // ----- Mesh -----
    // 地形のWireframe
    var wireframe = createWireframe(size=[100, 100], shape=[255, 255]);
    scene.add(wireframe);
    // 地図のテクスチャ
    var mapPlane = createMap(size=[100, 100], imgPath='/static/img/mixed.jpg');
    scene.add(mapPlane);


    // 標高データを読み込んでAnimationを開始
    d3.csv("/static/data/dem_test.csv", function(error, data) {
	if (error) throw error;
	demData = data.columns.map(function(d) { return +d; });
	updatePoints(wireframe, demData);

	render(); // Animation
    });
}


// --------------------------------------
// ----- フレームごとに呼ばれる関数 -----
// --------------------------------------
function render() {
    stats.update(); // フレームレート表示用
    controls.update(clock.getDelta()); // マウスで視点移動

    // アニメーション
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
