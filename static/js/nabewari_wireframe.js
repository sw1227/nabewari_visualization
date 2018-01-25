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
    renderer = createRenderer(glWidth, glHeight); // Renderer
    var ambientLight = createAmbientLight(0xffffff); // Light
    scene.add(ambientLight);

    // ----- Helper -----
    stats = createStats();
    controls = createTrackball();

    // ----- Mesh -----
    // 地形のWireframe
    wireframe = createWireframe(size=[100, 100], shape=[255, 255]);
    scene.add(wireframe);
    // 地図のテクスチャ
    map = createMap(size=[100, 100], imgPath='/static/img/mixed.jpg');
    scene.add(map);

    // ----- Render -----
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // 標高データを読み込んでAnimationを開始
    d3.csv("/static/data/dem_test.csv", function(error, data) {
	if (error) throw error;
	demData = data.columns.map(function(d) { return +d; });

	updatePoints(wireframe, demData);

	// Animation
	render();
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
