// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var step;
var clock;
var demData;

var glWidth = window.innerWidth;
var glHeight = window.innerHeight - $('nav').innerHeight();
const MAX_STEP = 50;

// 自動的にリサイズする
window.addEventListener('resize', function() {
    glWidth = window.innerWidth;
    glHeight = window.innerHeight - $('nav').innerHeight();
    camera.aspect = glWidth / glHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(glWidth, glHeight);
}, false);


// ----------------------------------------------
// ----- ウィンドウのロード時に呼ばれる関数 -----
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
    stats = createStats(); // フレームレート
    controls = createTrackball(); // マウスで視点移動

    // ----- Mesh -----
    // 地形の点群
    plane = createPoints(size=[100, 100], shape=[255, 255], texture=blueLuminary());
    scene.add(plane);

    // ----- Render -----
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // 標高データを読み込んでAnimationを開始
    d3.csv("/static/data/dem_test.csv", function(error, data) {
	if (error) throw error;
	demData = data.columns.map(function(d) { return +d; });

	// Animation
	step = 0;
	render();
    });
}


// --------------------------------------
// ----- フレームごとに呼ばれる関数 -----
// --------------------------------------
function render() {
    stats.update(); // フレームレート表示用
    controls.update(clock.getDelta()); // マウスで視点移動

    // 平面から地形へのアニメーション
    if (step <= MAX_STEP){
	var rate = wave(step/MAX_STEP);
	updatePoints(plane, demData.map(function(d) { return rate*d; }));
    }

    // アニメーションにする。setIntervalよりも良い。
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    step += 1; // ほぼ60FPSで回せていれば、60step = 1secのはず
}
