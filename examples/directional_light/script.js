var gleng;
var glLight;
var glCamera;

var mesh, mesh1;

var angle = 0;

function webGLStart() {
	console.log("Starting WebGL");

	GLTextureLoader.addToLoadStack('../../images/img1.jpg');

	// Setup the light for our scene
	glLight = new GLLight({
		isPoint: false,
		ambientColor: [0.2, 0.2, 0.2],
		lightingColor: [1, 1, 1],
		lightingDirection: [0, 0, -1],
	});

	// Setup the camera
	glCamera = new GLCamera({
		eye: [5, 10, 10],
		target: [0, 0, 0],
		up: [0, 1, 0]
	});

	// Setup the engine
	gleng = new GLEngine({
		parent: document.body,
		width: 600,
		height: 600,
		renderMode: 1000,
		acquirePerfStats: true,
		glLight: glLight,
		glCamera: glCamera
	});

	gleng.on(GLEngine.EVENT_INIT, function(gl) {
		console.log("GLEvent init");
		gl.clearColor(0.3, 0.3, 0.3, 1.0); // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	});

	gleng._construct();

	/*
	Create a new Mesh. This is a square textured.
	*/
	mesh = new GLMesh({
		gleng: gleng,
		hasColor:false,
		hasTexture: true,
		hasLighting: true,
		vertexArray: [
			-1, -1, 0,
			1, -1, 0, 
			-1, 1, 0,
			1, 1, 0
		],
		textureArray: [
			0, 1,
			1, 1,
			0, 0,
			1, 0
		],
		normalArray: [
			0, 0, 1,
			0, 0, 1,
			0, 0, 1,
			0, 0, 1
		],
		drawMode: gleng.gl.TRIANGLE_STRIP,
		imageSource: "../../images/img1.jpg",
	});

	mesh1 = new GLMesh({
		gleng: gleng,
		hasColor:false,
		hasTexture: true,
		hasLighting: true,
		vertexArray: [
			-1, -1, -1,
			-1, -1, 1, 
			-1, 1, -1,
			-1, 1, 1
		],
		textureArray: [
			0, 1,
			1, 1,
			0, 0,
			1, 0
		],
		normalArray: [
			1, 0, 0,
			1, 0, 0,
			1, 0, 0,
			1, 0, 0
		],
		drawMode: gleng.gl.TRIANGLE_STRIP,
		imageSource: "../../images/img1.jpg",
	});

	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		console.log("GLEngine assetload");
		mesh._construct();
		mesh1._construct();

	});

	gleng.on(GLEngine.EVENT_DRAW, function(gl) {
		angle = (angle + 0.01) % 360;
		gleng.camera.eye[0] = Math.sin(angle) * 15;
		gleng.camera.eye[2] = Math.cos(angle) * 15;

		mesh.draw();
		mesh1.draw();
	});

	gleng.useProgram({
		vertexShader: '../../shaders/vertex.sl',
		fragmentShader: '../../shaders/fragment.sl',
		attributeSet: {
			pos: {
				name: 'aPos',
				count: 3,
				type: 'attribute',
			},
			texture: {
				name: 'aTex',
				count: 2,
				type: 'attribute'
			},
			color: {
				name: 'aColor',
				count: 4,
				type: 'attribute'
			}, 
			normal: {
				name: 'aNorm',
				count: 3,
				type: 'attribute'
			},
			pMatrix: {
				name: 'uPMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			mvMatrix: {
				name: 'uMVMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			nMatrix: {
				name: 'uNMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat3'
			},
			lookAtMatrix: {
				name: 'uLookAtMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			useLighting: {
				name: 'uUseLighting',
				count: 1,
				type: 'uniform',
				uniformType: 'bool'
			},
			usePointLighting: {
				name: 'uUsePointLighting',
				count: 1,
				type: 'uniform',
				uniformType: 'bool'
			},
			ambientColor: {
				name: 'uAmbientColor',
				count: 3,
				type: 'uniform',
				uniformType: 'vec3'
			},
			lightingColor: {
				name: 'uLightingColor',
				count: 3,
				type: 'uniform',
				uniformType: 'vec3'
			},
			lightingDirection: {
				name: 'uLightingDirection',
				count: 3,
				type: 'uniform',
				uniformType: 'vec3'
			},
		},
		callback: function() {
			console.log("Starting the rendering");
			gleng.render();
		}
	});

}

$(document).ready(function() {
	webGLStart();
});