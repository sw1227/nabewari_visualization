// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var step;
var clock;
var trackballControls;
var flyControls;

// onloadに設定
window.onload = init;
window.addEventListener('resize', onResize, false);


// ------------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ------------------------------------------------
function init() {
    clock = new THREE.Clock(); // trackballControls用
    
    // ----- Scene, Camera, Renderer Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(); // Camera
    renderer = createRenderer(); // Renderr

    var lights = createLight(); // 複数のLight
    lights.forEach(function(l) {
	scene.add(l) // LightはMeshと同様にscene.addする必要がある
    });


    // ----- Helper -----
    // statsをアニメーション中に呼び出すことでフレームレートを表示する
//    stats = initStats();

    // 座標軸を表示するHelper
//    var axes = new THREE.AxisHelper(20);
//    scene.add(axes);

    // GUIから変数の値を変更する
    controls = new Controls();
    gui = createGui();

    // マウスで視点移動
    trackballControls = createTrackball();
//    flyControls = createFly();

    // ----- Mesh -----
    // Mesh 1: 地形
    plane = createTerrain();
    scene.add(plane);


    // ----- Render -----
    // Rendererの出力をHTMLに追加してRender
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // アニメーション
    step = 0;
    // render()でrequestAnimationFrame(render)してアニメーションにする
    render(); 
}



// ------------------------------------------------
// ----- 各要素を生成する関数 -----
// ------------------------------------------------

// Scene
function createScene() {
    var scene = new THREE.Scene();
    //    scene.fog = new THREE.FogExp2(0xffffff, 0.01);
    return scene;
}

// Camera
function createCamera() {
    var camera = new THREE.PerspectiveCamera(45,
					     window.innerWidth/window.innerHeight,
					     0.1, 1000);
    camera.position.x = -60;
    camera.position.y = 80;
    camera.position.z = 60;
    camera.lookAt(scene.position);

    return camera;
}

// Renderer
function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 影を有効にする
    renderer.shadowMap.enabled = true;

    return renderer;
}


// Light
function createLight() {
    // 1. SpotLight
    //    var spotLight = new THREE.SpotLight(0xffffff);
    //    spotLight.position.set(0, 100, 0);
    

    // 2. AmbientLight
    //    var ambientLight = new THREE.AmbientLight(0x0c0c0c);
    var ambientLight = new THREE.AmbientLight(0xffffff);
    return [ambientLight];
    //    return [spotLight, ambientLight];
}

function generateSprite() {
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// 地形
function createTerrain() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments


    for (var i=0; i<planeGeometry.vertices.length; i++) {
	planeGeometry.vertices[i].setZ(nabewari2[i]);
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();

    // Points
    var material = new THREE.PointsMaterial({size: 1.5,
					     sizeAttenuation: true,
					     color: 0xffffff,
					     transparent: true,
					     blending: THREE.AdditiveBlending,
					     depthWrite: false,
					     map: generateSprite()
					    });
    var plane = new THREE.Points(planeGeometry, material);
    plane.sortParticles = true;
    
    //    var plane = THREE.SceneUtils.createMultiMaterialObject(planeGeometry,
    //    [material]);

    // 影を受けられるようにする
    //    plane.receiveShadow = true;

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
    
    return plane;
}

// ------------------------------------------------
// ----- アニメーションのための関数 -----
// ------------------------------------------------
function render() {
//    stats.update(); // フレームレート表示用
    var delta = clock.getDelta();// trackballControls用

    
    // マウスで視点移動
    trackballControls.update(delta);
//    flyControls.update(delta);

    // アニメーションにする。setIntervalよりも良い。
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// ------------------------------------------------
// ----- マウスで視点移動するための関数 -----
// ------------------------------------------------
function createTrackball() {
    trackballControls = new THREE.TrackballControls(camera);
    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;

    return trackballControls;
}

function createFly() {
    flyControls = new THREE.FlyControls(camera);
    flyControls.movementSpeed = 2;
    flyControls.domElement = document.querySelector("#WebGL-output");
    flyControls.rollSpeed = Math.PI / 48;
    flyControls.autoForward = true;
    flyControls.dragToLook = false;

    return flyControls;
}

// ------------------------------------------------
// ----- フレームレートを表示するための関数 -----
// ------------------------------------------------
function initStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.bottom = '0px';
    // HTMLにStats用のdivを作っておく
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}

// ------------------------------------------------
// ----- 変数の値をGUIで変更するための関数 -----
// ------------------------------------------------
function Controls() {

}

function createGui() {
    var gui = new dat.GUI();

    return gui;
}


// ------------------------------------------------
// ----- 自動的にリサイズするコールバック関数 -----
// ------------------------------------------------

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
