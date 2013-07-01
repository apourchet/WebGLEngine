var gleng;
var glCamera;

var mesh;

function webGLStart() {
	console.log("Starting WebGL");

	glCamera = new GLCamera({
		eye: [0, 0, 10],
		target: [0, 0, 0],
		up: [0, 1, 0]
	});

	gleng = new GLEngine({
		parent: document.body,
		width: 600,
		height: 600,
		renderMode: GLEngine.RENDERMODE_CONTINUOUSLY,
		acquirePerfStats: true,
		glCamera: glCamera
	});

	gleng.on(GLEngine.EVENT_INIT, function(gl) {
		console.log("GLEvent init");
		gl.clearColor(0.3, 0.3, 0.3, 1.0); // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	});

	gleng._construct();

	var mesh = new GLMesh({
		gleng: gleng,
		hasColor: true,
		vertexArray: [
			0, 0, 0,
			1, 0, 0,
			1, 1, 0
		],
		colorArray: [
			1.0, 0.0, 0.0, 1.0,
			0.0, 1.0, 0.0, 1.0,
			0.0, 0.0, 1.0, 1.0
		],
		drawMode: gleng.gl.TRIANGLES,
	});

	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		mesh._construct();
	});

	gleng.on(GLEngine.EVENT_DRAW, function(gl) {
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