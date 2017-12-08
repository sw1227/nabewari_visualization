// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var clock;
var trackballControls;
var flyControls;
var glWidth = window.innerWidth;
var glHeight = window.innerHeight - $('nav').innerHeight();

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
    stats = initStats();

    // マウスで視点移動
    trackballControls = createTrackball();

    // ----- Mesh -----
    // 1. Point Cloud
    points = createPoints();
    scene.add(points);
    // 2. Wire Frame
    wireframe = createWireframe();
    scene.add(wireframe);
    // 3. Map Texture
    map = createMap();
    scene.add(map);
    // 4. Trail
    trail = createTrail();
    scene.add(trail); 

    // ----- Render -----
    // Rendererの出力をHTMLに追加してRender
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // アニメーション
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
					     glWidth/glHeight,
					     0.1, 1000);
    camera.position.x = -60;
    camera.position.y = 40;
    camera.position.z = -60;
    camera.lookAt(scene.position);

    return camera;
}

// Renderer
function createRenderer() {
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000000));
    renderer.setSize(glWidth, glHeight);

    return renderer;
}


// Light
function createLight() {
    // 1. SpotLight
    //    var spotLight = new THREE.SpotLight(0xffffff);
    //    spotLight.position.set(0, 100, 0);
    

    // 2. AmbientLight
    var ambientLight = new THREE.AmbientLight(0xffffff);
    return [ambientLight];
    //    return [spotLight, ambientLight];
}

// Point Cloudの点の表示を指定
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

// 標高のスケール変換
function scaled_z(z) {
    return (z - 350) / 40.0;
}
// 地形のPoint Cloud
function createPoints() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
	planeGeometry.vertices[i].setZ(scaled_z(nabewari_dem[i]));
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();

    // Points
    var pointsMaterial = new THREE.PointsMaterial({size: 1,
					     sizeAttenuation: true,
					     color: 0xffffff,
					     transparent: true,
					     blending: THREE.AdditiveBlending,
					     depthWrite: false,
					     map: generateSprite()
					    });

    var plane = new THREE.Points(planeGeometry, pointsMaterial);
    
    plane.sortParticles = true;

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
    
    return plane;
}

// 地形のWire Frame
function createWireframe() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
	planeGeometry.vertices[i].setZ(scaled_z(nabewari_dem[i]));
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();

    var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x2260ff,
							 wireframe: true,
							 transparent: true,
							 blending: THREE.AdditiveBlending});
    
    var plane = new THREE.Mesh(planeGeometry, wireframeMaterial);
    
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
    
    return plane;
}

// 地図のテクスチャマッピング
function createMap() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/nabewari_std.png');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture, side: THREE.DoubleSide, color: 0x888888});
//    var textureMaterial = new THREE.MeshPhongMaterial({ transparent: false, map: THREE.ImageUtils.loadTexture('/static/mixed.jpg') });
    
    var plane = new THREE.Mesh(planeGeometry, textureMaterial);
    
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
    
    return plane;
}

function createTrail() {
    // 登山道のGeometry
    var geometry = new THREE.Geometry();
    for (var p of gpx_test) {
	geometry.vertices.push(new THREE.Vector3(p["x"]*100.0/255-50,
						 -p["y"]*100.0/255+50,
						 scaled_z(p["ele"])));
    }
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 15 });
    var line = new THREE.Line(geometry, lineMaterial);

    line.rotation.x =  -0.5 * Math.PI;
    line.position.x = 0;
    line.position.y = 0;
    line.position.z = 0;
    return line;
}

// ------------------------------------------------
// ----- アニメーションのための関数 -----
// ------------------------------------------------
function render() {
    stats.update(); // フレームレート表示用
    var delta = clock.getDelta();// trackballControls用

    // マウスで視点移動
    trackballControls.update(delta);

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
    // Align bottom-left
    stats.domElement.style.position = 'relative';
    stats.domElement.style.left = '0px';
    stats.domElement.style.bottom = '0px';
    // HTMLにStats用のdivを作っておく
    document.getElementById("Stats-output").appendChild(stats.domElement);
    return stats;
}

// ------------------------------------------------
// ----- 自動的にリサイズするコールバック関数 -----
// ------------------------------------------------
function onResize() {
    glWidth = window.innerWidth;
    glHeight = window.innerHeight - $('nav').innerHeight();
    camera.aspect = glWidth / glHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(glWidth, glHeight);
}
