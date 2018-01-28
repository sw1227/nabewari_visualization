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

const tileSize = 100; // 画面内でのタイルの大きさ: tileSize x tileSize
const tilePixels = 256; // 標高データのピクセル数: tilePixels x tilePixels

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
    camera = createCamera(15, 30, 90, scene.position, glWidth/glHeight); // Camera
    scene.add(createAmbientLight(0xffffff)); // Light
    renderer = createRenderer(glWidth, glHeight); // Renderer
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // ----- Helper -----
    stats = createStats();
    controls = createTrackball(camera);

    // ----- Mesh -----
    // 地形のWireframe
    var wireframe = createWireframe(size=[tileSize, tileSize], shape=[tilePixels-1, tilePixels-1]);
    scene.add(wireframe);
    // 地図のテクスチャ
    var mapPlane = createMap(size=[tileSize, tileSize], shape=[1, 1],
			     imgPath='/static/img/nabewari_std.png', color=0x888888);
    scene.add(mapPlane);


    // 標高データを読み込む
    d3.csv("/static/data/small_dem.csv", function(error, data) {
	if (error) throw error;
	demData = data.columns.map(function(d) { return +d; });
	demData.pop(); // np.savetxt()で末尾に余分な","がつくため削除

	updatePoints(wireframe, demData.map(zScale));
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
