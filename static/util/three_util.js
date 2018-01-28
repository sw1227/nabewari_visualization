// --------------------------------
// ----- Helperを生成する関数 -----
// --------------------------------

// フレームレートを表示するstatsを生成
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

// x, y, z軸を生成
function createAxis(size=100) {
    return new THREE.AxisHelper(size);
}

// マウスで視点移動するためのControlを生成
function createTrackball(camera) {
    var trackballControls = new THREE.TrackballControls(camera);

    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;

    return trackballControls;
}

function createOrbit(camera) {
    var orbitControls = new THREE.OrbitControls(camera);
    orbitControls.rotateSpeed = 1.0;
    orbitControls.zoomSpeed = 1.0;
    orbitControls.panSpeed = 1.0;

    orbitControls.minPolarAngle = 0; // radians
    orbitControls.maxPolarAngle = Math.PI; // radians

    return orbitControls;
}

function createFly(camera) {
    var flyControls = new THREE.FlyControls(camera);

    flyControls.movementSpeed = 2;
    flyControls.domElement = document.querySelector("#WebGL-output");
    flyControls.rollSpeed = Math.PI / 48;
    flyControls.autoForward = true;
    flyControls.dragToLook = false;

    return flyControls;
}


// ---------------------------------------------------------------------
// ----- Scene, Camera, Renderer, Light, Textureなどを生成する関数 -----
// ---------------------------------------------------------------------

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

// 青く光る点のテクスチャ
function blueLuminary() {
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


// ----------------------------------
// ----- Geometryを生成する関数 -----
// ----------------------------------

// 平面のPoint Cloudを生成する
// @param size: 表示サイズ(width, height)
// @param shape: 点のarrayのshape
// @texture: 点のテクスチャ
// @return plane: 点群のMesh
function createPoints(size, shape, texture, pointSize=1.5) {
    // Geometry
    var planeGeometry = new THREE.PlaneGeometry(size[0], size[1], // width, height
						shape[0], shape[1]); // Segments
    // Material
    var material = new THREE.PointsMaterial({size: pointSize,
					     sizeAttenuation: true,
					     color: 0xffffff,
					     transparent: true,
					     blending: THREE.AdditiveBlending,
					     depthWrite: false,
					     map: texture
					    });
    // Mesh
    var plane = new THREE.Points(planeGeometry, material);
    plane.sortParticles = true;

    // 原点を中心とし、xz平面上に回転する(y軸が上)
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;

    return plane;
}

// 指定された大きさ・セグメント数・materialの平面Meshを生成する
function createPlane(size, shape, material) {
    // Geometry
    var planeGeometry = new THREE.PlaneGeometry(size[0], size[1], // width, height
						shape[0], shape[1]); // Segments
    // Mesh
    var plane = new THREE.Mesh(planeGeometry, material);

    // 原点を中心とし、xz平面上に回転する(y軸が上)
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = 0;
    plane.position.z = 0;

    return plane;
}

// 平面のWire Frameを生成する
function createWireframe(size, shape) {
    // Material
    var wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x2260ff,
							 wireframe: true,
							 transparent: true,
							 side: THREE.DoubleSide,
							 blending: THREE.AdditiveBlending});
    return createPlane(size, shape, wireframeMaterial);
}

// 画像をテクスチャマッピングした平面を生成する
function createMap(size, shape, imgPath, color=0xffffff) {
    // TextureLoader
    var loader = new THREE.TextureLoader();
    // Material
    var textureMaterial = new THREE.MeshPhongMaterial({map: loader.load(imgPath),
						       side: THREE.DoubleSide,
						       color: color});
    return createPlane(size, shape, textureMaterial);
}

// 軌跡を描画
// TODO: データフォーマット記載
function createTrail(jsonData, xyScale, zScale, fromTile, lineColor=0xff4444) {
    // 登山道のGeometry
    var geometry = new THREE.Geometry();

    // 各地点に対応する頂点をGeometryに追加
    jsonData.forEach(function(d) {
	// fromTileを基準としたタイル内でのpixel座標
	var pixelX = lonToX(d.lon, fromTile[0]) - 256*fromTile[1];
	var pixelY = latToY(d.lat, fromTile[0]) - 256*fromTile[2];
	geometry.vertices.push(new THREE.Vector3(xyScale(pixelX), zScale(d.z), xyScale(pixelY)));
    });

    // Material
    var lineMaterial = new THREE.LineBasicMaterial({color: lineColor, linewidth: 1});

    // Mesh
    var line = new THREE.Line(geometry, lineMaterial);

    return line;
}

// 画像のSpriteを生成
// sizeは画像に応じて良い感じに出来ないの?
function createSprite(pos, size, imgPath) {
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load(imgPath);
    var material = new THREE.SpriteMaterial({map: texture, color: 0xffffff});
    var sprite = new THREE.Sprite(material);
    sprite.position.set(pos[0], pos[1], pos[2]);
    sprite.scale.set(size[0], size[1], size[2]);
    return sprite;
}

// jsonDataで与えられた緯度経度・標高・画像パスをもとに複数のSpriteを作成
// TODO: Json format 記載
function createSpritesFromJson(jsonData, spriteSize, xyScale, zScale, fromTile) {
    var sprites = [];
    jsonData.forEach(function(d) {
	// fromTileを基準としたタイル内でのpixel座標
	var pixelX = lonToX(d.lon, fromTile[0]) - 256*fromTile[1];
	var pixelY = latToY(d.lat, fromTile[0]) - 256*fromTile[2];
	var sprite = createSprite([xyScale(pixelX), zScale(d.z)+5, xyScale(pixelY)],
				  spriteSize, d.name);
	sprites.push(sprite);
    });
    return sprites;
}


// --------------------------------------
// ----- アニメーションのための関数 -----
// --------------------------------------

// 点群の各点の高さを(破壊的に)修正する
function updatePoints(pointsMesh, heightArray) {
    // 長さを確認
    console.assert(pointsMesh.geometry.vertices.length == heightArray.length,
		   "updatePoints(): Different length...");
    // 高さをupdate
    pointsMesh.geometry.vertices.forEach(function(v, i) {
	v.setZ(heightArray[i]);
    });
    pointsMesh.geometry.verticesNeedUpdate = true;
    pointsMesh.geometry.computeFaceNormals();
}

// 0-1の値を受けて0-1の値を返す感じの関数たち
// memo sigmoidやwaveのパラメータによる変化を確認できるツールがあると便利そう
function sigmoid(alpha) {
    // TODO parametrize
    return (Math.tanh(6* (alpha-1/2)) + 1) / 2.0;
}
function wave(alpha) {
    // TODO parametrize
    return 1 - Math.exp(-5*alpha) * Math.cos(Math.PI*2.5*alpha); // wave
}


// ----------------------------------
// ----- 位置情報を処理する関数 -----
// ----------------------------------

// ズームレベルzoomのもとで経度をpixel座標xに変換する
function lonToX(lon, zoom) {
    const L = 85.05112878;
    return 2**(zoom+7) * (1 + lon/180);
}

// ズームレベルzoomのもとで緯度をpixel座標yに変換する
function latToY(lat, zoom) {
    const L = 85.05112878;
    return 2**(zoom+7) / Math.PI * (- Math.atanh(Math.sin(Math.PI*lat/180.))
				    + Math.atanh(Math.sin(Math.PI*L/180.)));
}

// タイル内でのpixel座標を画面内でのx, yに変換する関数を返す関数
// 正方形を前提とし、原点を中心に配置する
function xyScale(tileSize, tilePixels) {
    // カリー化・部分適用
    var scaleFunction = function(x) {
	// (0, ..., tilePixels-1) -> (-tileSize/2, ..., +tileSize/2)
	return x * (tileSize/(tilePixels-1)) - (tileSize/2);
    };
    return scaleFunction;
}
