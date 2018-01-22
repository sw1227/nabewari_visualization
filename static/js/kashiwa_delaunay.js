// Variables
var camera;
var scene;
var renderer;
var controls;
//var stats;
var clock;
var orbitControls;
var flyControls;
var glWidth = window.innerWidth;
var glHeight = window.innerHeight - $('nav').innerHeight();
var delaunay;
// nabewari_demを2Dにする
var nabewari_tile = [];


// onloadに設定
window.onload = init;
window.addEventListener('resize', onResize, false);


// ------------------------------------------------
// ----- ウィンドウのロード時に実行する関数 -----
// ------------------------------------------------
function init() {
    clock = new THREE.Clock(); // orbitControls用
    
    // ----- Scene, Camera, Renderer Lightが基本的な構成要素となる -----
    scene = createScene(); // Scene
    camera = createCamera(-40, 60, -40, scene.position, glWidth/glHeight); // Camera
    renderer = createRenderer(glWidth, glHeight, antiAlias=true); // Renderer

    var ambientLight = createAmbientLight(0xffffff);
    scene.add(ambientLight);


    // ----- Helper -----
    stats = createStats();

    // マウスで視点移動
    orbitControls = createOrbit();

    // ----- Mesh -----
    // Wireframe
    wireframe = createWireframe();
    scene.add(wireframe);

    while (kashiwa.length) {
	nabewari_tile.push(kashiwa.splice(0, 256))
    };

    // Delaunay
    createDelaunay(); // これだけ関数内でscene.addしちゃっててアレ
    // Number
    createNumber();
    // Map Texture
    map = createMap();
//    scene.add(map);


    // ----- Render -----
    // Rendererの出力をHTMLに追加してRender
    document.getElementById("WebGL-output").appendChild(renderer.domElement);

    // アニメーション
    render(); 
}



// ------------------------------------------------
// ----- 各要素を生成する関数 -----
// ------------------------------------------------

// 標高のスケール変換
function scaled_z(z) {
    return (z - 5.0)/2.0;
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
    var num_points = 400;
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
    var pointsMaterial = new THREE.PointsMaterial({size: 5,
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
    
    var maxDistance = 40;
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
								 linewidth: 2 });
		var lineMesh = new THREE.Line(lineGeometry, lineMaterial);
		lineMesh.rotation.x = -0.5 * Math.PI;
		scene.add(lineMesh);
	    }
	}
    }
}

function createNumber() {
    //  柏
    positions = [[19.77991111107258,38.5597121097],
		 [-16.13745777776785, 15.536452982860283],
		 [-17.257031111148535, 25.753388652674403],
		 [11.016746666609833, 36.950184009720033],
		 [-2.9346844445171882, 19.635082136301207],
		 [31.344284444458026, -10.520684474568043]];
    names = ["/static/img/kashiwa/kashiwa_sprite.png", "/static/img/kashiwa/ut_sprite.png",
	     "/static/img/kashiwa/stadium_sprite.png", "/static/img/kashiwa/chiba_sprite.png",
	     "/static/img/kashiwa/gan_sprite.png", "/static/img/kashiwa/tanaka_sprite.png"]

    for (var i=0; i<positions.length; i++) {
	pos = positions[i];
	var textureLoader = new THREE.TextureLoader();
	var numberMap = textureLoader.load(names[i]);
	var numberMaterial = new THREE.SpriteMaterial( { map: numberMap, color: 0xffffff,
							 opacity: 0.95} );
	var sprite = new THREE.Sprite( numberMaterial );

	sprite.position.set(pos[0], 15, pos[1]);
	sprite.scale.set(2.5, 25, 2.5);
	scene.add(sprite);
    }
}


// 地図のテクスチャマッピング
function createMap() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/img/kashiwa/kashiwa_map.png');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture, side: THREE.DoubleSide, color: 0xaaaaaa});
//    var textureMaterial = new THREE.MeshPhongMaterial({ transparent: false, map: THREE.ImageUtils.loadTexture('/static/mixed.jpg') });
    
    var plane = new THREE.Mesh(planeGeometry, textureMaterial);
    
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;
    
    return plane;
}

function createWireframe() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						255, 255); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
	planeGeometry.vertices[i].setZ(scaled_z(kashiwa[i])-1);
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();


    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/img/kashiwa/kashiwa_map.png');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture,
						       side: THREE.DoubleSide,
						       transparent: false,
						       color: 0x888888});

    var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x2260ff,
							 wireframe: true,
							 transparent: true,
							 blending: THREE.AdditiveBlending});
    
    var plane = new THREE.Mesh(planeGeometry, textureMaterial);
    
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
    var delta = clock.getDelta();// orbitControls用

    // マウスで視点移動
    orbitControls.update(delta);

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
