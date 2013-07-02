var gleng;
var glLight;
var glCamera;

var mesh, lightMesh;

var angle = 0;

function webGLStart() {
	console.log("Starting WebGL");

	// Load the image
	GLTextureLoader.addToLoadStack('../../images/img1.jpg');

	// Setup the light
	glLight = new GLLight({
		isPoint: true,
		ambientColor: [0.2, 0.2, 0.2],
		lightingColor: [1, 1, 1],
		position: [0, 0, 0],
		maxRange: 4,
	});

	// Setup our camera
	glCamera = new GLCamera({
		eye: [7, 10, 10],
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

	// Give an init function
	gleng.on(GLEngine.EVENT_INIT, function(gl) {
		console.log("GLEvent init");
		gl.clearColor(0.3, 0.3, 0.3, 1.0); // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	});

	gleng._construct();

	// Build the meshes on assetload
	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		mesh = GLEngine.GLPrimitiveMeshes.TexturedCube(gleng, 1, '../../images/img1.jpg')._construct();
		lightMesh = GLEngine.GLPrimitiveMeshes.PointSphere(gleng, 0.2)._construct();
	});

	// Rotate the light and draw our meshes
	gleng.on(GLEngine.EVENT_DRAW, function(gl) {
		angle = (angle + 0.01) % 360;

		// Make the light rotate around the cube
		gleng.light.position[0] = Math.sin(angle) * 5;
		gleng.light.position[1] = Math.sin(angle/1.3 + 45) * 5;
		gleng.light.position[2] = Math.cos(angle) * 5;

		mesh.draw();
		GLMatrix.matrixPush(gleng.mvMatrix);
		mat4.translate(gleng.mvMatrix, gleng.light.position);
		lightMesh.draw();
		GLMatrix.matrixPop(gleng.mvMatrix);

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
			nMatrix: {
				name: 'uNMatrix',
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