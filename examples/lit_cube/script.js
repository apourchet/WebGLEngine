var gleng;
var glLight;
var glCamera;

var mesh;

var angle = 0;

function webGLStart() {
	console.log("Starting WebGL");

	GLTextureLoader.addToLoadStack('../../images/img1.jpg');

	glLight = new GLLight({
		isPoint: false,
		ambientColor: [0.2, 0.2, 0.2],
		lightingColor: [1, 1, 1],
		lightingDirection: [0, -2, -1],
		position: [0, 0, 30],
		maxRange: 50
	});

	glCamera = new GLCamera({
		eye: [0, 0, 10],
		target: [0, 0, 0],
		up: [0, 1, 0]
	});

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

	mesh = GLEngine.GLPrimitiveMeshes.TexturedSquare(gleng, 1, '../../images/img1.jpg');

	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		mesh._construct();
	});

	gleng.on(GLEngine.EVENT_DRAW, function(gl) {
		angle = (angle + 0.01) % 360;
		gleng.light.eye[0] = Math.sin(angle) * 4;
		gleng.light.eye[2] = Math.cos(angle) * 4;

		mesh.draw();
	});

	gleng.useProgram({
		vertexShader: 'vertexShader',
		fragmentShader: 'fragmentShader',
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