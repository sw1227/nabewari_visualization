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
    renderer = createRenderer(glWidth, glHeight); // Renderer

    var ambientLight = createAmbientLight(0xffffff);
    scene.add(ambientLight);


    // ----- Helper -----
    // statsをアニメーション中に呼び出すことでフレームレートを表示する
    stats = createStats();

    // マウスで視点移動
    trackballControls = createTrackball();


    // ----- Mesh -----
    // Mesh 1: 地形
    plane = createTerrain();
    scene.add(plane);


    // ----- Render -----
    // Rendererの出力をHTMLに追加してRender
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // アニメーション
    step = 0;
    render(); 
}


// ------------------------------------------------
// ----- 各要素を生成する関数 -----
// ------------------------------------------------

// 地形
function createTerrain() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    // アニメーション用にコメントアウト
    // for (var i=0; i<planeGeometry.vertices.length; i++) {
    // 	planeGeometry.vertices[i].setZ(nabewari2[i]);
    // }

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
    stats.update(); // フレームレート表示用
    var delta = clock.getDelta();// trackballControls用

    // マウスで視点移動
    trackballControls.update(delta);
//    flyControls.update(delta);

    // 点をアニメーション
    // 0からnabewari2[i]にもっていく
    max_step = 50;
    if (step <= max_step){
//	rate = (Math.tanh(6*(step-max_step/2)/max_step) + 1) / 2.0; // sigmoid
	rate = 1 - Math.exp(-step/10.0) * Math.cos(Math.PI*step/20.0); // wave
	for (var i=0; i<plane.geometry.vertices.length; i++) {
	    plane.geometry.vertices[i].setZ(nabewari2[i]*rate);
	}
	plane.geometry.verticesNeedUpdate = true;
	plane.geometry.computeFaceNormals();
    }

    // アニメーションにする。setIntervalよりも良い。
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    step += 1;// ほぼ60FPSで回せていれば、60step = 1secのはず
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
