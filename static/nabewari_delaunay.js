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
var delaunay;
// nabewari_demを2Dにする
var nabewari_tile = [];
while (nabewari_dem.length) {
    nabewari_tile.push(nabewari_dem.splice(0, 256))
};

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
    // 1. Trail
    trail = createTrail();
    scene.add(trail);
    // 2. Delaunay
    createDelaunay(); // これだけ関数内でscene.addしちゃっててアレ
    // 3. Number
    createNumber();

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
    //scene.fog = new THREE.FogExp2(0xffffff, 0.01);
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
    var renderer = new THREE.WebGLRenderer({ antialias: true });
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

// 周囲の格子点の乗る平面の方程式に基づき、任意の点における高さを計算
function calc_z(x, y, tile) {
    var z; // return this
    fx = Math.floor(x);
    fy = Math.floor(y);
    zb = tile[255-fy][fx+1];
    zc = tile[255-fy-1][fx];
    if ((x-fx) + (y-fy) < 1) {
	za = tile[255-fy][fx];
	z = (zb - za) * (x - fx) + (zc - za) * (y - fy) + za;
    } else {
	zd = tile[255-fy-1][fx+1];
	z = (zd - zc) * (x - fx - 1) + (zd - zb) * (y - fy - 1) + zd;
    }
    return scaled_z(z);
}

// 単純に左下の格子点のzを採用するversion
function calc_z_test(x, y, tile) {
    var z;
    fx = Math.floor(x);
    fy = Math.floor(y);
    return scaled_z(tile[255-fy][fx]);
}

function createDelaunay() {
    // 平面上にランダムに点を配置したGeometry
    var delaunayGeometry = new THREE.Geometry();
    var num_points = 4000;
    var points = []; // 各点の[x, y]の配列
    var points_z = []; // 各点のzの配列

    // (x, y) は -50 to +50であることに注意
    for (var i=0; i<num_points; i++) {
	x = 100*Math.random()-50;
	y = 100*Math.random()-50;
	z = calc_z( (x+50)*255.0/100, (y+50)*255.0/100, nabewari_tile);
	delaunayGeometry.vertices.push(new THREE.Vector3(x, y, z));
	points.push([x, y]);
	points_z.push(z);
    }
    var pointsMaterial = new THREE.PointsMaterial({size: 2,
						   sizeAttenuation: true,
						   color: 0xffffff,
						   transparent: true,
						   blending: THREE.AdditiveBlending,
						   depthWrite: false,
						   map: generateSprite()
						  });

    var delaunayMesh = new THREE.Points(delaunayGeometry, pointsMaterial);
    delaunayMesh.sortParticles = true;
    delaunayMesh.rotation.x =  -0.5 * Math.PI;
    delaunayMesh.position.x = 0;
    delaunayMesh.position.y = 0;
    delaunayMesh.position.z = 0;
    scene.add(delaunayMesh);

    // ドロネー三角形分割
    var delaunay = new delaunator(points);// mapbox/delaunatorを使用
    triangles = delaunay.triangles;// 頂点のindexが入っている
    
    var maxDistance = 10;
    for (var i=0; i < triangles.length-1; i++) {
	if (i%3 != 2){
	    var lineGeometry = new THREE.Geometry();
	    v1 = new THREE.Vector3(points[triangles[i]][0],
				   points[triangles[i]][1],
				   points_z[triangles[i]])
	    v2 = new THREE.Vector3(points[triangles[i+1]][0],
				   points[triangles[i+1]][1],
				   points_z[triangles[i+1]])
	    // 端の方の長すぎる辺は見ばえが悪いので描画しない
	    if (v1.distanceTo(v2) < maxDistance) {
		lineGeometry.vertices.push(v1);
		lineGeometry.vertices.push(v2);
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x2260ff,
		//var lineMaterial = new THREE.LineBasicMaterial({ color: 0x20407f,
								 blending: THREE.AdditiveBlending,
								 transparent: true,
								 linewidth: 1 });
		var lineMesh = new THREE.Line(lineGeometry, lineMaterial);
		lineMesh.rotation.x = -0.5 * Math.PI;
		scene.add(lineMesh);
	    }
	}
    }
}

function createNumber() {
    var positions = [[105.06221795547754, 204.77331868093461, 660],
		     [99.99701333325356, 207.12072599260136, 672.53],
		     [78.92840296262875, 207.35904092073906, 795.12],
		     [74.85060740727931, 213.0547383466037, 792.92],
		     [71.01553777768277, 205.07121354003903, 876.53],
		     [70.30386536265723, 193.45319981547073, 942.83],
		     [61.241450192872435, 176.77051365678199, 1038.5],
		     [63.458994251675904, 163.18568351992872, 1111],
		     [64.17066666670144, 156.42889862449374, 1156.33]];
    var names = ["/static/Number2.png", "/static/Number3.png", "/static/Number4.png",
		 "/static/Number5.png", "/static/Number6.png", "/static/Number7.png",
		 "/static/Number8.png", "/static/Number9.png", "/static/Number10.png"]
    for (var i=0; i<positions.length; i++) {
	pos = positions[i]
	var textureLoader = new THREE.TextureLoader();
	var numberMap = textureLoader.load(names[i]);
	var numberMaterial = new THREE.SpriteMaterial( { map: numberMap, color: 0xffffff} );
	//var numberMaterial = new THREE.SpriteMaterial( { color: 0xffffff} );
	var sprite = new THREE.Sprite( numberMaterial );
	sprite.position.set(pos[0]*100.0/255-50,
			    //			    calc_z(pos[0], pos[1], nabewari_tile),
			    scaled_z(pos[2])+5,
			    pos[1]*100.0/255-50);

	sprite.scale.set(2, 14, 2);
	scene.add(sprite);
    }

    // 鍋割山荘
    var textureLoader = new THREE.TextureLoader();
    var numberMap = textureLoader.load("/static/nabewari_sanso.png");
    var numberMaterial = new THREE.SpriteMaterial( { map: numberMap, color: 0xffffff} );
    //var numberMaterial = new THREE.SpriteMaterial( { color: 0xffffff} );
    var sprite = new THREE.Sprite( numberMaterial );
    sprite.position.set(gpx_test[gpx_test.length-1]["x"]*100.0/255-50,
			scaled_z(gpx_test[gpx_test.length-1]["ele"])+8,
			gpx_test[gpx_test.length-1]["y"]*100.0/255-50);

    sprite.scale.set(2.5, 30, 2.5);
    scene.add(sprite);
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
    //    trackballControls = new THREE.TrackballControls(camera);
    trackballControls = new THREE.OrbitControls(camera);
    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.0;
    trackballControls.panSpeed = 1.0;
//    trackballControls.staticMoving = true;
    trackballControls.minPolarAngle = 0; // radians
    trackballControls.maxPolarAngle = Math.PI; // radians
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
