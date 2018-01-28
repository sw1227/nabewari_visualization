// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var step;
var clock;
var demData;
var plane;

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

const tileSize = 100; // 画面内でのタイルの大きさ: tileSize x tileSize
const tilePixels = 256; // 標高データのピクセル数: tilePixels x tilePixels

// 標高[m]を座標に変換する関数
function zScale(z) {
    return (z - 350) / 40.0;
}


// ----------------------------------------------
// ----- ウィンドウのロード時に呼ばれる関数 -----
// ----------------------------------------------
window.onload = function() {
    clock = new THREE.Clock(); // Controls用

    // ----- Scene, Camera, Renderer Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(15, 30, 90, scene.position, glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats(); // フレームレート
    controls = createTrackball(camera); // マウスで視点移動

    // ----- Mesh -----
    // 地形の点群
    plane = createPoints(size=[tileSize, tileSize], shape=[tilePixels-1, tilePixels-1],
			 texture=blueLuminary());
    scene.add(plane);


    // 標高データを読み込んでAnimationを開始
    d3.csv("/static/data/small_dem.csv", function(error, data) {
	if (error) throw error;
	demData = data.columns.map(function(d) { return zScale(+d); });
	demData.pop(); // np.savetxt()で末尾に余分な","がつくため削除

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
