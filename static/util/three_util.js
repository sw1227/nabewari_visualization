// -----------------------------------------------
// ----- フレームレートを表示するstatsを生成 -----
// -----------------------------------------------
function createStats() {
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms
    // Align bottom-left
    stats.domElement.style.position = 'relative';
    stats.domElement.style.left = '0px';
    stats.domElement.style.bottom = '0px';
    // HTMLにStats用のdivを作っておく
    // TODO jsで動的につくれば良い気がする
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}


// ---------------------------------------------------
// ----- マウスで視点移動するためのControlを生成 -----
// ---------------------------------------------------
function createTrackball() {
    var trackballControls = new THREE.TrackballControls(camera);

    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;

    return trackballControls;
}

function createOrbit() {
    var orbitControls = new THREE.OrbitControls(camera);
    orbitControls.rotateSpeed = 1.0;
    orbitControls.zoomSpeed = 1.0;
    orbitControls.panSpeed = 1.0;

    orbitControls.minPolarAngle = 0; // radians
    orbitControls.maxPolarAngle = Math.PI; // radians
    return orbitControls;
}

function createFly() {
    var flyControls = new THREE.FlyControls(camera);

    flyControls.movementSpeed = 2;
    flyControls.domElement = document.querySelector("#WebGL-output");
    flyControls.rollSpeed = Math.PI / 48;
    flyControls.autoForward = true;
    flyControls.dragToLook = false;

    return flyControls;
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
function createCamera(x, y, z, target, aspect) {
    var camera = new THREE.PerspectiveCamera(45,
					     aspect,
					     0.1, 1000);
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
    camera.lookAt(target);

    return camera;
}

// Renderer
function createRenderer(width, height, antiAlias=false) {
    var renderer = new THREE.WebGLRenderer({ antialias: antiAlias });
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(width, height);

    return renderer;
}

// Light - color: hex (0x******)
function createAmbientLight(color) {
    var ambientLight = new THREE.AmbientLight(color);
    return ambientLight;
}

function createSpotLight(x, y, z, color) {
    var spotLight = new THREE.SpotLight(color);
    spotLight.position.set(x, y, z);
    return spotLight;
}

// 青く光る点
function generateSprite() {
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(canvas.width/2, canvas.height/2, 0,
						canvas.width/2, canvas.height/2, canvas.width/2);
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
