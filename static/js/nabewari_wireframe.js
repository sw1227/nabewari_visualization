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
    camera = createCamera(-60, 40, -60, scene.position, glWidth/glHeight); // Camera
    renderer = createRenderer(glWidth, glHeight); // Renderr

    var ambientLight = createAmbientLight(0xffffff);
    scene.add(ambientLight);


    // ----- Helper -----
    // statsをアニメーション中に呼び出すことでフレームレートを表示する
    stats = createStats();

    // マウスで視点移動
    trackballControls = createTrackball();

    // ----- Mesh -----
    points = createPoints();
    scene.add(points);
    wireframe = createWireframe();
    scene.add(wireframe);
    map = createMap();
    scene.add(map);

    // ----- Render -----
    // Rendererの出力をHTMLに追加してRender
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // アニメーション
    render(); 
}



// ------------------------------------------------
// ----- 各要素を生成する関数 -----
// ------------------------------------------------

// 地形のPoint Cloud
function createPoints() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						127, 127); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
    	planeGeometry.vertices[i].setZ(nabewari2[2*i]);
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();

    // Points
    var pointsMaterial = new THREE.PointsMaterial({size: 2,
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
						127, 127); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
    	planeGeometry.vertices[i].setZ(nabewari2[2*i]);
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
						127, 127); // Segments

    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/img/mixed.jpg');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture, side: THREE.DoubleSide});
//    var textureMaterial = new THREE.MeshPhongMaterial({ transparent: false, map: THREE.ImageUtils.loadTexture('/static/img/mixed.jpg') });
    
    var plane = new THREE.Mesh(planeGeometry, textureMaterial);
    
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = -10;
    plane.position.z = 0;
    
    return plane;
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
// ----- 自動的にリサイズするコールバック関数 -----
// ------------------------------------------------
function onResize() {
    glWidth = window.innerWidth;
    glHeight = window.innerHeight - $('nav').innerHeight();
    camera.aspect = glWidth / glHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(glWidth, glHeight);
}
