var gleng;
var glLight;
var glCamera;

var mesh;

var angle = 0;

function webGLStart() {
	console.log("Starting WebGL");

	// Load the mesh
	GLFileLoader.addToLoadStack('../../objects/teapot.obj');

	// Setup the light
	glLight = new GLLight({
		isPoint: false,
		ambientColor: [0.2, 0.2, 0.2],
		lightingColor: [1, 1, 1],
		lightingDirection: [0, -2, -1],
		position: [0, 0, 30],
		maxRange: 50
	});

	//Setup the camera
	glCamera = new GLCamera({
		eye: [0, 0, 10],
		target: [0, 0, 0],
		up: [0, 1, 0]
	});

	// Setup the engine
	gleng = new GLEngine({
		parent: document.body,
		width: 600,
		height: 600,
		// Try to render at 1000 FPS
		renderMode: 1000,
		acquirePerfStats: true,
		glLight: glLight,
		glCamera: glCamera
	});

	// Define an init function
	gleng.on(GLEngine.EVENT_INIT, function(gl) {
		console.log("GLEvent init");
		gl.clearColor(0.3, 0.3, 0.3, 1.0); // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	});

	// Initialize the engine
	gleng._construct();

	// Construct meshes on assetload
	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		console.log("GLEngine assetload");
		mesh = new GLEngine.GLPrimitiveMeshes.PointCloud(gleng, '../../objects/teapot.obj')._construct();

	});

	// Draw the mesh and rotate the camera on draw
	gleng.on(GLEngine.EVENT_DRAW, function(gl) {
		angle = (angle + 0.01) % 360;
		gleng.camera.eye[0] = Math.sin(angle) * 15;
		gleng.camera.eye[2] = Math.cos(angle) * 15;

		mesh.draw();
	});

	// Setup the attributes and uniforms from our shaders
	gleng.useProgram({
		vertexShader: '../../shaders/vertex.sl',
		fragmentShader: '../../shaders/fragment.sl',
		attributeSet: {
			pos: {
				name: 'aPos',
				count: 3,
				type: 'attribute',
			},
			color: {
				name: 'aColor',
				count: 4,
				type: 'attribute'
			},
			texture: {
				name: 'aTex',
				count: 2,
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
			lightingPosition: {
				name: 'uLightingPosition',
				count: 3,
				type: 'uniform',
				uniformType: 'vec3'
			},
			pointSize: {
				name: 'pointSize',
				count: 1,
				type: 'uniform',
				uniformType: 'float'
			},
			maxLightRange: {
				name: 'maxLightRange',
				count: 1,
				type: 'uniform',
				uniformType: 'float'
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