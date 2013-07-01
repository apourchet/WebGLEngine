var gleng;
var glCamera;

var mesh;

var angle = 0;
function webGLStart() {
	console.log("Starting WebGL");


	// Setup the camera for our scene
	glCamera = new GLCamera({
		eye: [0, 0, 10],
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
		renderMode: GLEngine.RENDERMODE_CONTINUOUSLY,
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
	Create a new Mesh. This is a triangle with each of 
	its vertices colored differently.
	*/
	mesh = new GLMesh({
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

	/*
	The engine calls the ASSETLOAD functions when all the textures 
	and object files are loaded.
	Even though no textures are needed here, it is good practice to 
	construct meshes in there.
	*/
	gleng.on(GLEngine.EVENT_ASSETLOAD, function() {
		mesh._construct();
	});

	/*
	Tell the engine what to do on a draw call.
	*/
	gleng.on(GLEngine.EVENT_DRAW, function(gl) {


		/* 
		Make the camera rotate around the mesh to get a
		better view of the mesh.	
		*/
		angle = (angle + 0.01) % 360;
		gleng.camera.eye[0] = Math.sin(angle) * 4;
		gleng.camera.eye[1] = Math.cos(angle / 3 + 45) * 4;
		gleng.camera.eye[2] = Math.cos(angle) * 4;
		/*
		Draw the mesh.
		*/
		mesh.draw();
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
			color: {
				name: 'aColor',
				count: 4,
				type: 'attribute'
			},
			/*Same for texture*/
			// texture: {
			// 	name: 'aTex',
			// 	count: 2,
			// 	type: 'attribute'
			// },
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