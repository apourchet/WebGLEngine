var gleng;
var glLight;
var glCamera;

var mesh, mesh1;

var angle = 0;

function webGLStart() {
	console.log("Starting WebGL");

	GLTextureLoader.addToLoadStack('../../images/img1.jpg');

	// Setup the camera for our scene
	glCamera = new GLCamera({
		eye: [0, 0, 15],
		target: [0, 0, 0],
		up: [0, 1, 0]
	});

	/*Set up our GLEngine.
	This creates the canvas element as a child of the 'parent' 
	parameter specified in the constructor.
	By default, it will try to render at 60 FPS.
	*/
	gleng = new GLEngine({
		parent: document.body,
		width: 600,
		height: 600,
		renderMode: 1000,
		acquirePerfStats: true,
		glCamera: glCamera
	});

	/*
	Tell the engine what to do when it is initialized.
	*/
	gleng.on(GLEngine.EVENT_INIT, function(gl) {
		console.log("GLEvent init");
		gl.clearColor(0.3, 0.3, 0.3, 1.0); // Set clear color to black, fully opaque
		gl.enable(gl.DEPTH_TEST); // Enable depth testing
		gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	});

	/*
	Initialize the engine.
	*/
	gleng._construct();

	/*
	Create a new Mesh. This is a textured square.
	*/
	mesh = new GLMesh({
		gleng: gleng,
		hasTexture: true,
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
		drawMode: gleng.gl.TRIANGLE_STRIP,
		imageSource: "../../images/img1.jpg",
	});

	/*
	Creates the same mesh as before, but with a built-in primitive to the engine.
	*/
	mesh1 = new GLEngine.GLPrimitiveMeshes.TexturedSquare(gleng, 1.0, "../../images/img1.jpg");

	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		console.log("GLEngine assetload");
		mesh._construct();
		mesh1._construct();
	});

	gleng.on(GLEngine.EVENT_DRAW, function(gl) {

		angle = (angle + 0.01);

		AntiSpammer.tell("asd", angle);
		gleng.camera.eye[0] = Math.sin(angle) * 8;

		GLMatrix.matrixPush(gleng.mvMatrix);
		mat4.translate(gleng.mvMatrix, [-1, 0, 0]);
		mesh.draw();
		gleng.mvMatrix = GLMatrix.matrixPop(gleng.mvMatrix);

		GLMatrix.matrixPush(gleng.mvMatrix);
		mat4.translate(gleng.mvMatrix, [1, 0, 0]);
		mesh1.draw();
		gleng.mvMatrix = GLMatrix.matrixPop(gleng.mvMatrix);

	});

	/*
	This is the tricky part. The engine needs shaders to draw the geometry.
	The vertexShader parameter specifies the id of the script tag 
	containing the vertex shader. You can guess what fragmentShader does.
	*/
	gleng.useProgram({
		vertexShader: 'vertexShader',
		fragmentShader: 'fragmentShader',
		attributeSet: {
			/*Specify the variable name in the vertex shader that will contain the 
			position of the vertex*/
			pos: {
				name: 'aPos',
				count: 3,
				type: 'attribute',
			},
			/*Same for the variable containing the color*/
			// color: {
			// 	name: 'aColor',
			// 	count: 4,
			// 	type: 'attribute'
			// },
			/*Same for texture*/
			texture: {
				name: 'aTex',
				count: 2,
				type: 'attribute'
			},
			/*Same for normal*/
			// normal: {
			// 	name: 'aNorm',
			// 	count: 3,
			// 	type: 'attribute'
			// },
			/*Projection matrix*/
			pMatrix: {
				name: 'uPMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			/*Modelview matrix*/
			mvMatrix: {
				name: 'uMVMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			/*Camera lookAt matrix*/
			lookAtMatrix: {
				name: 'uLookAtMatrix',
				count: 1,
				type: 'uniform',
				uniformType: 'mat4'
			},
			/*Boolean for lighting*/
			// useLighting: {
			// 	name: 'uUseLighting',
			// 	count: 1,
			// 	type: 'uniform',
			// 	uniformType: 'bool'
			// },
			/*Boolean for point lighting*/
			// usePointLighting: {
			// 	name: 'uUsePointLighting',
			// 	count: 1,
			// 	type: 'uniform',
			// 	uniformType: 'bool'
			// },
			/*Array containing the ambient color of the light*/
			// ambientColor: {
			// 	name: 'uAmbientColor',
			// 	count: 3,
			// 	type: 'uniform',
			// 	uniformType: 'vec3'
			// },
			/*Array containing the color of the light itself*/
			// lightingColor: {
			// 	name: 'uLightingColor',
			// 	count: 3,
			// 	type: 'uniform',
			// 	uniformType: 'vec3'
			// },
			/*Array containing the direction of the light*/
			// lightingDirection: {
			// 	name: 'uLightingDirection',
			// 	count: 3,
			// 	type: 'uniform',
			// 	uniformType: 'vec3'
			// },
			/*Array containing the position of the light*/
			// lightingPosition: {
			// 	name: 'uLightingPosition',
			// 	count: 3,
			// 	type: 'uniform',
			// 	uniformType: 'vec3'
			// },
			/*Float corresponding to the size of the points for point drawing.*/
			// pointSize: {
			// 	name: 'pointSize',
			// 	count: 1,
			// 	type: 'uniform',
			// 	uniformType: 'float'
			// },
			/*Maximum range of the light when it is a point light*/
			// maxLightRange: {
			// 	name: 'maxLightRange',
			// 	count: 1,
			// 	type: 'uniform',
			// 	uniformType: 'float'
			// },
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