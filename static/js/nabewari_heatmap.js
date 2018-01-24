// Variables
var camera;
var scene;
var renderer;
var controls;
var stats;
var clock;
var orbitControls;
var flyControls;
var glWidth = window.innerWidth;
var glHeight = window.innerHeight - $('nav').innerHeight();
var delaunay;
var nabewari_tile;

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
    var target = new THREE.Vector3(0, 20, 0);
    camera = createCamera(0, 20, 60, target, glWidth/glHeight); // Camera
    renderer = createRenderer(glWidth, glHeight); // Renderr

    var ambientLight = createAmbientLight(0xffffff);
    scene.add(ambientLight);

    // ----- Helper -----
    // statsをアニメーション中に呼び出すことでフレームレートを表示する
    stats = createStats();

    // マウスで視点移動
    orbitControls = createOrbit();

    // Axis
//     var axis = new THREE.AxisHelper(100);
//    scene.add(axis);

    // ----- Mesh -----
    // 4. Wire Frame
    wireframe = createWireframe();
    scene.add(wireframe);
    // 5. Map Texture
    map = createMap();
    scene.add(map);

    // nabewari_demを2Dにする
    nabewari_tile = [];
    while (nabewari_dem.length) {
	nabewari_tile.push(nabewari_dem.splice(0, 768))
    };

    // 3. Number
    createNumber();
    // 2. Delaunay
//    createDelaunay(); // これだけ関数内でscene.addしちゃっててアレ



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
    return (z - 350) / 40.0;
}

// 周囲の格子点の乗る平面の方程式に基づき、任意の点における高さを計算
function calc_z(x, y, tile) {
    var z; // return this
    fx = Math.floor(x);
    fy = Math.floor(y);
    zb = tile[767-fy][fx+1];
    zc = tile[767-fy-1][fx];
    if ((x-fx) + (y-fy) < 1) {
	za = tile[767-fy][fx];
	z = (zb - za) * (x - fx) + (zc - za) * (y - fy) + za;
    } else {
	zd = tile[767-fy-1][fx+1];
	z = (zd - zc) * (x - fx - 1) + (zd - zb) * (y - fy - 1) + zd;
    }
    return scaled_z(z);
}

// 単純に左下の格子点のzを採用するversion
function calc_z_test(x, y, tile) {
    var z;
    fx = Math.floor(x);
    fy = Math.floor(y);
    return scaled_z(tile[767-fy][fx]);
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
	z = calc_z( (x+50)*767.0/100, (y+50)*767.0/100, nabewari_tile) + 1;
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

    var positions = [[676.2488718219101, 563.09327472373843],
		     [655.9880533330142, 572.48290397040546],
		     [571.713611850515, 573.43616368295625],
		     [555.4024296291173, 596.2189533864148],
		     [540.0621511107311, 564.2848541601561],
		     [537.2154614506289, 517.8127992618829],
		     [500.96580077148974, 451.08205462712795],
		     [509.8359770067036, 396.74273407971486],
		     [512.6826666668057, 369.71559449797496]];
    var names = ["/static/img/numbers/Number2.png", "/static/img/numbers/Number3.png", "/static/img/numbers/Number4.png",
		 "/static/img/numbers/Number5.png", "/static/img/numbers/Number6.png", "/static/img/numbers/Number7.png",
		 "/static/img/numbers/Number8.png", "/static/img/numbers/Number9.png", "/static/img/numbers/Number10.png"]
    for (var i=0; i<positions.length; i++) {
	pos = positions[i]
	var textureLoader = new THREE.TextureLoader();
	var numberMap = textureLoader.load(names[i]);
	var numberMaterial = new THREE.SpriteMaterial( { map: numberMap, color: 0xffffff} );
	//var numberMaterial = new THREE.SpriteMaterial( { color: 0xffffff} );
	var sprite = new THREE.Sprite( numberMaterial );
	sprite.position.set(pos[0]*100.0/767-50,
			    //scaled_z(pos[2])+5,
			    calc_z(pos[0], 767-pos[1], nabewari_tile)+5,
			    pos[1]*100.0/767-50);


	sprite.scale.set(2, 14, 2);
	scene.add(sprite);
    }

    // 鍋割山荘
    var textureLoader = new THREE.TextureLoader();
    var numberMap = textureLoader.load("/static/img/nabewari_sanso.png");
    var numberMaterial = new THREE.SpriteMaterial( { map: numberMap, color: 0xffffff} );
    //var numberMaterial = new THREE.SpriteMaterial( { color: 0xffffff} );
    var sprite = new THREE.Sprite( numberMaterial );
    sprite.position.set(506.554322488606*100.0/767-50,
			scaled_z(gpx_test[gpx_test.length-1]["ele"])+4,
			223.048505018*100.0/767-50);

    sprite.scale.set(2.5, 30, 2.5);
    scene.add(sprite);
}

function createWireframe() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						767, 767); // Segments

    for (var i=0; i<planeGeometry.vertices.length; i++) {
	planeGeometry.vertices[i].setZ(scaled_z(nabewari_dem[i]));
    }

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.computeFaceNormals();


    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/img/heatmap.png');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture, side: THREE.DoubleSide, color: 0xffffff});

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

// 地図のテクスチャマッピング
function createMap() {
    // 平面のGeometry
    var planeGeometry = new THREE.PlaneGeometry(100, 100, // width, height
						767, 767); // Segments

    // texture
    var loader = new THREE.TextureLoader();
    var mapTexture = loader.load( '/static/img/heatmap.png');
    var textureMaterial = new THREE.MeshPhongMaterial({map: mapTexture, side: THREE.DoubleSide, color: 0x888888});
//    var textureMaterial = new THREE.MeshPhongMaterial({ transparent: false, map: THREE.ImageUtils.loadTexture('/static/mixed.jpg') });
    
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

    // マウスで視点移動
    orbitControls.update(clock.getDelta());

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
