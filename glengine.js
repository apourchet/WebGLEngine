/*isPoint, ambientColor, lightingColor, specularColor, 
direction, position, maxRange*/
var GLLight = function(params) {
	if (!params) var params = {};
	this.isPoint = params.isPoint ? params.isPoint : false;

	this.ambientColor = params.ambientColor ? params.ambientColor : [0.5, 0.5, 0.5];
	this.lightingColor = params.lightingColor ? params.lightingColor : [1, 1, 1];
	this.specularColor = params.specularColor ? params.specularColor : [1, 1, 1];

	this.direction = params.lightingDirection ? params.lightingDirection : [1, 0, -1];
	this.position = params.position ? params.position : [0, 0, 0];

	this.maxRange = params.maxRange ? params.maxRange : 25;

	console.log("GLLight: \n" + this.toString());
};


GLLight.prototype.toString = function() {
	var str = "";
	str += "isPoint: " + this.isPoint + "\n";
	str += "ambientColor: " + this.ambientColor + "\n";
	str += "lightingColor: " + this.lightingColor + "\n";
	str += "specularColor: " + this.specularColor + "\n";
	str += "direction: " + this.direction + "\n";
	str += "position: " + this.position + "\n";
	str += "maxRange: " + this.maxRange + "\n";
	return str;
};

/* eye, target, up*/
var GLCamera = function(params) {
	if (!params) var params = {};
	this.eye = params.eye ? params.eye : [0, 0, 1];
	this.target = params.target ? params.target : [0, 0, 0];
	this.up = params.up ? params.up : [0, 1, 0];

	this.transformMatrix = mat4.create();
};

var GLEventList = function() {
	this.queues = new Object();
};

GLEventList.prototype.push = function(queueId, callback) {
	if (this.queues[queueId] == undefined) {
		this.queues[queueId] = new Array();
	}
	this.queues[queueId].push(callback);
	return callback;
};

GLEventList.prototype.remove = function(queueId, callback) {
	if (this.queues[queueId] == undefined) {
		this.queues[queueId] = new Array();
		return false;
	}
	this.queues[queueId].splice(this.queues.indexOf(callback), 1);
	return true;
};

GLEventList.prototype.fireEvents = function(queueId, optionalArguments) {
	if (this.queues[queueId] != undefined) {
		for (var i = 0; i < this.queues[queueId].length; i++) {
			this.queues[queueId][i].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
};

GLCamera.prototype.toString = function() {
	var str = "";
	str += "eye: " + this.eye + "\n";
	str += "target: " + this.target + "\n";
	str += "up: " + this.up + "\n";
	return str;
};

GLCamera.prototype.lookAt = function(gleng) {
	mat4.lookAt(this.eye, this.target, this.up, gleng.lookAtMatrix);
	gleng.mvMatrix = mat4.create(gleng.lookAtMatrix);
};

/*parent, width, height, renderMode, acquirePerfStats, glLight, glCamera*/
var GLEngine = function(params) {
	// console.log("New GLEngine");

	this.gl = null;
	this.canvas = null;

	this.light = params.glLight ? params.glLight : new GLLight();
	this.camera = params.glCamera ? params.glCamera : new GLCamera();

	this.canvasWidth = params.width ? params.width : 300;
	this.canvasHeight = params.height ? params.height : 300;
	this.canvasParent = params.parent;

	this.eventList = new GLEventList();

	this.renderMode = params.renderMode ? params.renderMode : 0;
	this.isRendering = false;
	this.drawInterval = null;

	this.acquirePerfStats = params.acquirePerfStats;
	this.perfStats = {
		frameCount: 0,
		countStart: 0,
		lastFPS: 0
	};

	this.currentProgram = null;

	this.mvMatrix = mat4.create();
	this.pMatrix = mat4.create();
	this.lookAtMatrix = mat4.create();
};

GLEngine.EVENT_INIT = 'init';
GLEngine.EVENT_DRAW = 'draw';
GLEngine.EVENT_PREDRAW = 'predraw';
GLEngine.EVENT_POSTDRAW = 'postdraw';
GLEngine.EVENT_ASSETLOAD = 'assetload';

GLEngine.RENDERMODE_WHEN_DIRTY = 0;
GLEngine.RENDERMODE_CONTINUOUSLY = 60;


GLEngine.prototype._construct = function() {
	console.log("GLEngine _construct");
	this.canvas = document.createElement("canvas");
	this.canvas.setAttribute('width', this.canvasWidth);
	this.canvas.setAttribute('height', this.canvasHeight);

	this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
	if (!this.gl) {
		console.log("Could not get the gl object from the canvas");
		return false;
	}

	if (!this.canvasParent) {
		console.log("Could not insert canvas because the parent element is not valid.");
		return false;
	}
	this.canvasParent.appendChild(this.canvas);
	this.gl.viewportWidth = this.canvas.width;
	this.gl.viewportHeight = this.canvas.height;

	var e = this;

	this.fireInitQueue();

	this.on(GLEngine.EVENT_PREDRAW, function(gl) {
		// console.log("Drawing...");
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color as well as the depth buffer.
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0, e.pMatrix);
		mat4.identity(e.mvMatrix);
		e.camera.lookAt(e);
	});

	return this;
};

GLEngine.prototype.on = function(event, callback) {
	return this.eventList.push(event, callback);
};

GLEngine.prototype.off = function(event, callback) {
	return this.eventList.remove(event, callback);
};

GLEngine.prototype.fireInitQueue = function() {
	this.eventList.fireEvents(GLEngine.EVENT_INIT, this.gl);
};

GLEngine.prototype.fireDrawQueue = function() {
	this.eventList.fireEvents(GLEngine.EVENT_PREDRAW, this.gl);
	this.eventList.fireEvents(GLEngine.EVENT_DRAW, this.gl);
	this.eventList.fireEvents(GLEngine.EVENT_POSTDRAW, this.gl);
};

GLEngine.prototype.setRenderMode = function(renderMode) {
	if (this.renderMode && !renderMode && this.isRendering) {
		clearInterval(this.drawInterval);
		this.isRendering = false;
	}
	if (this.renderMode != renderMode) {
		this.isRendering = false;
		this.renderMode = renderMode;
	}
};

GLEngine.prototype.render = function() {
	this.perfStats.countStart = new Date().getTime();

	if (this.renderMode) {
		if (!this.isRendering) {
			this.isRendering = true;
			// Render and set the timeout for the next render
			this.drawScene();
			var e = this;
			this.drawInterval = setInterval(function() {
				GLEngine.drawScene(e);
			}, 1000.0 / this.renderMode);
		} else {
			// if it was already rendering continuously
			console.log("I am already rendering continuously.");
		}
	} else {
		this.drawScene();
	}

};

GLEngine.prototype.drawScene = function() {
	if (this.acquirePerfStats) {
		var d = new Date().getTime();
		if (d > this.perfStats.countStart + 2000) {
			// reset the count...
			this.perfStats.countStart = d;
			this.perfStats.frameCount = 0;
			console.log("FPS: " + this.perfStats.lastFPS);
		} else {
			this.perfStats.frameCount++;
			this.perfStats.lastFPS = this.perfStats.frameCount * 1000 / (d - this.perfStats.countStart);
		}
	}
	this.fireDrawQueue();
};

GLEngine.drawScene = function(gleng) {
	gleng.drawScene();
};

GLEngine.getShader = function(gl, id, callback) {
	var shaderScript, theSource, currentChild, shader;
	shaderScript = document.getElementById(id);
	var theSource = $(shaderScript).html();

	var nextFunction = function(theSource) {
		if (!shaderScript) {
			shaderScript = document.createElement('script');
			if (id.indexOf('v') != -1) {
				shaderScript.type = "x-shader/x-vertex";
			} else if (id.indexOf('f') != -1) {
				shaderScript.type = "x-shader/x-fragment";
			}
		}

		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			// Unknown shader type
			console.log("The shader type specified is unknown: " + shaderScript.type);
			return null;
		}
		gl.shaderSource(shader, theSource);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		}
		callback(shader);
	};

	if (theSource == "" || !theSource) {
		if (!shaderScript) {
			$.get(id, nextFunction);
		} else {
			$.get(shaderScript.src, nextFunction);
		}
	} else {
		nextFunction(theSource);
	}
};

GLEngine.prototype.setMatrixUniforms = function() {
	this.gl.uniformMatrix4fv(this.currentProgram.attributeSet.pMatrix.location, false, this.pMatrix);
	this.gl.uniformMatrix4fv(this.currentProgram.attributeSet.mvMatrix.location, false, this.mvMatrix);
	this.gl.uniformMatrix4fv(this.currentProgram.attributeSet.lookAtMatrix.location, false, this.lookAtMatrix);

	if (!this.currentProgram.attributeSet.nMatrix) return;
	var nMatrix = mat4.create();
	mat4.inverse(this.mvMatrix, nMatrix);
	mat4.transpose(nMatrix, nMatrix);
	this.gl.uniformMatrix4fv(this.currentProgram.attributeSet.nMatrix.location, false, nMatrix);
};

GLEngine.prototype.setLighting = function(enable) {
	var gl = this.gl;
	var attsSet = this.currentProgram.attributeSet;
	if (!attsSet.useLighting) {
		return;
	}
	gl.uniform1i(attsSet.useLighting.location, enable);
	if (enable) {
		if (attsSet.ambientColor) gl.uniform3fv(attsSet.ambientColor.location, this.light.ambientColor);
		if (attsSet.lightingColor) gl.uniform3fv(attsSet.lightingColor.location, this.light.lightingColor);
		if (this.light.isPoint) {
			if (attsSet.maxLightRange) gl.uniform1f(attsSet.maxLightRange.location, this.light.maxRange);
			if (attsSet.usePointLighting) gl.uniform1i(attsSet.usePointLighting.location, true);
			if (attsSet.lightingPosition) gl.uniform3fv(attsSet.lightingPosition.location, this.light.position);
		} else {
			if (attsSet.usePointLighting) gl.uniform1i(attsSet.usePointLighting.location, false);
			if (attsSet.lightingDirection) gl.uniform3fv(attsSet.lightingDirection.location, this.light.direction);
		}
	}
};

GLEngine.prototype.setUniform = function(uniformName, uniformValue) {
	var attr = this.currentProgram.attributeSet[uniformName];
	var uniformType = attr ? attr.uniformType : undefined;

	if (uniformType && uniformValue && attr && attr.type == 'uniform' && attr.location) {
		if (uniformType == 'mat4') {
			this.gl.uniformMatrix4fv(attr.location, false, uniformValue);
		} else if (uniformType == 'mat3') {
			this.gl.uniformMatrix3fv(attr.location, false, uniformValue);
		} else if (uniformType == 'vec4') {
			this.gl.uniform4fv(attr.location, false, uniformValue);
		} else if (uniformType == 'vec3') {
			this.gl.uniform3fv(attr.location, false, uniformValue);
		} else if (uniformType == 'vec2') {
			this.gl.uniform2fv(attr.location, uniformValue);
		} else if (uniformType == 'bool') {
			this.gl.uniform1i(attr.location, uniformValue);
		} else if (uniformType == 'bool') {
			this.gl.uniform1i(attr.location, uniformValue);
		}
	}
	// console.log("Could not use uniform " + uniformName);
};

GLEngine.prototype.enableAttribute = function(attributeName) {
	if (this.currentProgram.attributeSet[attributeName]) {
		var att = this.currentProgram.attributeSet[attributeName];
		if (this.currentProgram.attributeSet[attributeName].type == 'attribute') {
			try {
				if (att.location == null) {
					AntiSpammer.tell("GLEngine", "The attribute " + attributeName + " has no location");
					return;
				}
				this.gl.enableVertexAttribArray(att.location);
				this.gl.vertexAttribPointer(att.location, att.count, this.gl.FLOAT, false, 0, 0);
			} catch (e) {
				AntiSpammer.tell("GLEngine", "Error while enabling the attribute: " + attributeName);
			}
		}
	} else {
		AntiSpammer.tell('AttributeNotFound ' + attributeName, "Attribute was not found " + attributeName);
	}
};

GLEngine.prototype.disableAttribute = function(attributeName) {
	if (this.currentProgram.attributeSet[attributeName]) {
		var att = this.currentProgram.attributeSet[attributeName];
		if (this.currentProgram.attributeSet[attributeName].type == 'attribute') {
			this.gl.disableVertexAttribArray(att.location);
		}
	} else {
		AntiSpammer.tell('AttributeNotFound', "Attribute was not found for disable " + attributeName);
	}
};

/*vertexShader, fragmentShader, attributeSet, callback*/
GLEngine.prototype.useProgram = function(params) {
	var obj = this;
	GLEngine.getShader(this.gl, params.vertexShader, function(fragmentShader) {
		GLEngine.getShader(obj.gl, params.fragmentShader, function(vertexShader) {

			// console.log("got shaders!");

			// Create the shader program
			var shaderProgram = obj.gl.createProgram();
			obj.gl.attachShader(shaderProgram, vertexShader);
			obj.gl.attachShader(shaderProgram, fragmentShader);
			obj.gl.linkProgram(shaderProgram);

			// If creating the shader program failed, alert
			if (!obj.gl.getProgramParameter(shaderProgram, obj.gl.LINK_STATUS)) {
				console.log("Unable to initialize the shader program.");
			}

			obj.gl.useProgram(shaderProgram);
			obj.currentProgram = shaderProgram;
			shaderProgram.attributeSet = new Object();
			for (var key in params.attributeSet) {
				if (params.attributeSet.hasOwnProperty(key)) {
					var type = params.attributeSet[key].type;
					var name = params.attributeSet[key].name;
					var count = params.attributeSet[key].count;
					if (type == 'attribute') {
						shaderProgram.attributeSet[key] = {
							location: obj.gl.getAttribLocation(shaderProgram, name),
							count: count,
							type: type
						};
						console.log("Got new attribute location of " + name + " (" + key + ") at location " + shaderProgram.attributeSet[key].location);

					} else if (type == 'uniform') {
						shaderProgram.attributeSet[key] = {
							location: obj.gl.getUniformLocation(shaderProgram, name),
							count: count,
							type: type,
							uniformType: params.attributeSet[key].uniformType
						};
						console.log("Got new uniform location of " + name + " (" + key + ") at location " + shaderProgram.attributeSet[key].location);
					} else {}
					// console.log("Shader program has attribute '" + key + "'' as {" + shaderProgram.attributeSet[key].location +
					// 	"," + shaderProgram.attributeSet[key].count + ", '" + name + "''}");
				}
			}
			var finished = 2;

			GLTextureLoader.loadImages(function(done) {
				finished--;
				if (finished == 0) {
					console.log("Done loading everything...");
					obj.eventList.fireEvents(GLEngine.EVENT_ASSETLOAD);
					params.callback();
				}
			});

			GLFileLoader.loadFiles(function(done) {
				finished--;
				if (finished == 0) {
					console.log("Done loading everything...");
					obj.eventList.fireEvents(GLEngine.EVENT_ASSETLOAD);
					params.callback();
				}
			});

		});
	});
};

/*gleng, hasColor, hasTexture, hasLighting, vertexArray, 
colorArray, textureArray, normalArray, indexArray, 
drawMode, imageSource, pointSize*/
var GLMesh = function(params) {

	this.env = params.gleng;

	this.colorBuffer = null;
	this.vertexBuffer = null;
	this.textureBuffer = null;
	this.normalBuffer = null;
	this.indexBuffer = null;

	this.texture = null;

	this.imageSource = params.imageSource;

	this.colorArray = params.colorArray;
	this.vertexArray = params.vertexArray;
	this.textureArray = params.textureArray;
	this.normalArray = params.normalArray;
	this.indexArray = params.indexArray;

	this.hasTexture = params.hasTexture;
	this.hasColor = params.hasColor;
	this.hasLighting = params.hasLighting;
	this.drawMode = params.drawMode != undefined ? params.drawMode : gleng.gl.TRIANGLES;

	this.pointSize = params.pointSize;

	// console.log(this.drawMode + "; " + drawMode + "; " + gleng.gl.TRIANGLES);
};

GLMesh.prototype._construct = function() {
	this.initBuffers();
	if (this.hasTexture) {
		this.initTexture();
	}
	return this;
};

GLMesh.prototype.initBuffers = function() {
	var gl = this.env.gl;
	this.vertexBuffer = gl.createBuffer();
	this.colorBuffer = gl.createBuffer();
	this.textureBuffer = gl.createBuffer();
	this.normalBuffer = gl.createBuffer();
	this.indexBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArray), gl.STATIC_DRAW);

	if (this.colorArray) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colorArray), gl.STATIC_DRAW);
	}

	if (this.textureArray) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureArray), gl.STATIC_DRAW);
	}
	if (this.normalArray) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalArray), gl.STATIC_DRAW);
	}

	if (this.indexArray) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexArray), gl.STATIC_DRAW);
	}
};

GLMesh.prototype.initTexture = function() {
	var image = GLTextureLoader.getImage(this.imageSource, true);
	if (!image) {
		new GLException('GLMesh', 'Could not get the texture "' + this.imageSource + '" from GLTextureLoader');
		return;
	}
	var gl = this.env.gl;

	// image.onload = function() {
	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.texture);

	// Set the parameters so we can render any size image.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

};

GLMesh.prototype.draw = function() {
	var gl = this.env.gl;

	if (this.pointSize) {
		this.env.setUniform('pointSize', this.pointSize);
		// AntiSpammer.tell('1', "Drawing points " + this.pointSize + " ; " + this.drawMode);
	}

	if (this.hasTexture) {
		// Render this with the texture
		this.env.disableAttribute('color');

		gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
		this.env.enableAttribute('texture');
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

	} else {
		// Render this with the color
		this.env.disableAttribute('texture');
	}

	if (this.hasColor) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
		this.env.enableAttribute('color');
	} else {
		this.env.disableAttribute('color');
	}

	if (this.hasLighting) {
		// console.log("Drawing with lighting");
		this.env.setLighting(true);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		this.env.enableAttribute('normal');
	} else {
		this.env.setLighting(false);
		this.env.disableAttribute('normal');
	}

	this.env.setMatrixUniforms();

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	this.env.enableAttribute('pos');

	if (this.indexArray) {
		gl.drawElements(this.drawMode, this.indexArray.length, gl.UNSIGNED_SHORT, 0);
	} else {
		gl.drawArrays(this.drawMode, 0, this.vertexArray.length / 3);
	}

};

GLEngine.GLPrimitiveMeshes = function() {};

GLEngine.GLPrimitiveMeshes.TexturedSquare = function(gleng, size, imageSource) {
	size = size ? size : 1;

	return new GLMesh({
		gleng: gleng,
		hasColor: false,
		hasTexture: true,
		hasLighting: true,
		vertexArray: [
			-size, -size, 0.0, 
			size, -size, 0.0,
			-size, size, 0.0,
			size, size, 0.0
		],
		colorArray: null,
		textureArray: [
			0, 1,
			1, 1,
			0, 0,
			1, 0
		],
		normalArray: [
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,
		],
		indexArray: null,
		drawMode: gleng.gl.TRIANGLE_STRIP,
		imageSource: imageSource,
		pointSize: 0
	});
};

GLEngine.GLPrimitiveMeshes.PointCloud = function(gleng, objFileSource) {
	var vert = new Array();
	var color = new Array();
	var indices = new Array();
	if (objFileSource && GLFileLoader.getFile(objFileSource)) {
		console.log("PointCloud from " + objFileSource);
		vert = GLFileLoader.getFile(objFileSource).vertexArray;
		for (var i = 0; i < vert.length; i += 3) {
			color.push(vert[i + 2], vert[i], vert[i + 1], 1.0);
		}
	} else {
		for (var i = 0; i < 1; i += 0.005) {
			for (var j = 0; j < 1; j += 0.005) {
				vert.push(i, j, 0);
				color.push(1, 1, 1, 1);
			}
		}
	}

	return new GLMesh({
		gleng: gleng,
		hasColor: true,
		hasTexture: false,
		hasLighting: false,
		vertexArray: vert,
		colorArray: color,
		drawMode: gleng.gl.POINTS,
		pointSize: 1.0
	});
};

GLEngine.GLPrimitiveMeshes.PointSphere = function(gleng, radius) {
	var vert = new Array();
	var color = new Array();
	// vert = glLight.position;
	for (var theta = 0; theta < 360; theta += 360 / 30) {
		for (var phi = 0; phi < 360; phi += 360 / 30) {
			vert.push(Math.cos(theta) * Math.sin(phi) * radius, 
				Math.sin(theta) * Math.sin(phi) * radius, 
				Math.cos(phi) * radius);
			color.push(1, 1, 1, 1);
		}
	}
	return new GLMesh({
		gleng : gleng,
		hasColor : true,
		vertexArray : vert,
		colorArray : color,
		pointSize:4.0,
		drawMode: gleng.gl.POINTS
	});
};


GLEngine.GLPrimitiveMeshes.TexturedCube = function(gleng, size, imageSource) {
	size = size ? size : 1;
	var vertexArray = [
		// Front face
		-size, -size, size,
		size, -size, size,
		size, size, size, -size, size, size,

		// Back face
		-size, -size, -size, -size, size, -size,
		size, size, -size,
		size, -size, -size,

		// Top face
		-size, size, -size, -size, size, size,
		size, size, size,
		size, size, -size,

		// Bottom face
		-size, -size, -size,
		size, -size, -size,
		size, -size, size, -size, -size, size,

		// Right face
		size, -size, -size,
		size, size, -size,
		size, size, size,
		size, -size, size,

		// Left face
		-size, -size, -size, -size, -size, size, -size, size, size, -size, size, -size

	];

	var textureArray = [
		0, 0,
		0, 1,
		1, 1,
		1, 0,

		0, 0,
		0, 1,
		1, 1,
		1, 0,

		0, 0,
		0, 1,
		1, 1,
		1, 0,

		0, 0,
		0, 1,
		1, 1,
		1, 0,

		0, 0,
		0, 1,
		1, 1,
		1, 0,

		0, 0,
		0, 1,
		1, 1,
		1, 0,
	];

	var normalArray = [

		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		-1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,

	];

	var indexArray = [
		0, 1, 2, 0, 2, 3, // Front face
		4, 5, 6, 4, 6, 7, // Back face
		8, 9, 10, 8, 10, 11, // Top face
		12, 13, 14, 12, 14, 15, // Bottom face
		16, 17, 18, 16, 18, 19, // Right face
		20, 21, 22, 20, 22, 23 // Left face
	];

	return new GLMesh({
		gleng: gleng,
		hasColor: false,
		hasTexture: true,
		hasLighting: true,
		vertexArray: vertexArray,
		colorArray: null,
		textureArray: textureArray,
		normalArray: normalArray,
		indexArray: indexArray,
		drawMode: gleng.gl.TRIANGLES,
		imageSource: imageSource,
		pointSize: 0
	});
};

var GLMatrix = function() {};

GLMatrix.stacks = new Array();

GLMatrix.matrixPush = function(matrix) {
	if (!matrix) return;

	for (var i = 0; i < GLMatrix.stacks.length; i++) {
		if (GLMatrix.stacks[i].matrix == matrix) {
			GLMatrix.stacks[i].stack.push(matrix);
			return;
		}
	};
	var s = new Stack();
	s.push(mat4.create(matrix));
	GLMatrix.stacks.push({
		matrix: matrix,
		stack: s
	});
};

GLMatrix.printStack = function(matrix) {
	if (!matrix) return;

	for (var i = 0; i < GLMatrix.stacks.length; i++) {
		if (GLMatrix.stacks[i].matrix == matrix) {
			console.log(GLMatrix.stacks[i].stack.toString(mat4.str));
			return;
		}
	}
	console.log("Could not find the stack you were looking for.");
}

GLMatrix.matrixPop = function(matrix) {
	for (var i = 0; i < GLMatrix.stacks.length; i++) {
		if (GLMatrix.stacks[i].matrix == matrix) {
			var m = GLMatrix.stacks[i].stack.pop();
			for(var i = 0 ; i < 16 ; i++){
				matrix[i] = m[i];
			}
			return matrix;
		}
	};
};

var AntiSpammer = function() {};

AntiSpammer.minInterval = 2000;

AntiSpammer.timers = new Object();

AntiSpammer.tell = function(tag, string) {
	if (!tag) tag = '0';
	var d = new Date().getTime();
	if (AntiSpammer.timers[tag] == undefined) {
		AntiSpammer.timers[tag] = d + AntiSpammer.minInterval;
		console.log(string);
	} else {
		if (AntiSpammer.timers[tag] < d) {
			console.log(string);
			AntiSpammer.timers[tag] = d + AntiSpammer.minInterval;
		}
	}
};

var Stack = function() {
	this.count = 0;
	this.head = null;
};

var StackItem = function(value, next) {
	this.value = value;
	this.next = next;
};

Stack.prototype.push = function(value) {
	this.head = new StackItem(value, this.head);
	this.count++;
	return this.head;
};

Stack.prototype.pop = function() {
	if (!this.head) return null;
	var prevVal = this.head.value;
	this.head = this.head.next;
	return prevVal;
};

Stack.prototype.peek = function() {
	if (!this.head) return null;
	return this.head.value;
};

Stack.prototype.toString = function(callback) {
	var item = this.head;
	var str = "Stack: ";
	if (callback) {
		while (item != null) {
			str += "\n" + callback(item.value);
			item = item.next;
		}
	} else {
		while (item != null) {
			str += "\n" + (item.value);
			item = item.next;
		}
	}
	return str;
};

Stack.prototype.popAll = function(callback) {
	var i;
	while (i = this.pop()) {
		callback(i);
	}
};

var GLObject = function(params) {
	this.gleng = params.gleng;
	this.position = params.position ? params.position : [0, 0, 0];
	this.rotation = params.rotation ? params.rotation : [0, 0, 0];
	this.mesh = params.mesh;

	this.transformMatrix = mat4.create();
};

GLObject.prototype.draw = function() {
	if (!this.mesh) return;
	mat4.identity(this.transformMatrix);
	mat4.translate(this.transformMatrix, this.position);

	GLMatrix.matrixPush(this.gleng.mvMatrix);
	mat4.multiply(this.gleng.mvMatrix, this.transformMatrix, this.gleng.mvMatrix);
	this.mesh.draw();
	GLMatrix.matrixPop(this.gleng.mvMatrix);
};

GLObject.prototype.setPosition = function(position) {
	this.position = position;
};

var GLFileLoader = function() {};

GLFileLoader.files = new Object();
GLFileLoader.toLoad = new Stack();

GLFileLoader.isLoading = 0;

GLFileLoader.fromObjectFile = function(source, callback) {
	GLFileLoader.isLoading++;

	$.get(source, function(data) {
		var vert = new Array();
		var color = new Array();
		var texture = new Array();
		var normal = new Array();
		var indices = new Array();

		var arr1 = data.split('\n');
		var arr2;
		try {
			for (var i = 0; i < arr1.length; i++) {
				arr2 = arr1[i].split(" ");
				if (arr2[0] == 'v') {
					vert.push(arr2[1]);
					vert.push(arr2[2]);
					vert.push(arr2[3]);
				} else if (arr2[0] == 'vt') {
					texture.push(arr2.splice(1, -1));
				} else if (arr2[0] == 'vn') {
					normal.push(arr2.splice(1, -1));
				} else if (arr2[0] == 'vp') {
					// vert.push(arr2.splice(1, -1));
				} else if (arr2[0] == 'f') {
					indices.push(arr2.splice(1, -1));
				} else if (arr2[0] == 'vc') {
					color.push(arr2.splice(1, -1));
				}
			};
			console.log("This file had vertices: " + vert.length);
			GLFileLoader.isLoading--;
			GLFileLoader.files[source] = (new GLFileLoader.ObjectFile(source, vert, color, texture, normal));
		} catch (e) {
			new GLException('GLFileLoader', "There was an error while parsing the object file '" + source + "'");
		}

		callback();
	});
};

GLFileLoader.addToLoadStack = function(source) {
	GLFileLoader.toLoad.push(source);
};

GLFileLoader.ObjectFile = function(source, vert, color, texture, normal) {
	this.vertexArray = vert;
	this.colorArray = color;
	this.textureArray = texture;
	this.normalArray = normal;

	this.source = source;
};

GLFileLoader.loadFiles = function(callback) {
	console.log("Loading all files...");
	var startedAllFiles = false;

	GLFileLoader.toLoad.popAll(function(source) {
		GLFileLoader.fromObjectFile(source, function() {
			if (startedAllFiles && !GLFileLoader.isLoading) {
				console.log("Done loading all files.");
				callback(true);
			}
		});
	});

	startedAllFiles = true;
	if (!GLFileLoader.isLoading) {
		console.log("Done loading all files.");
		callback(true);
	}
};

GLFileLoader.getFile = function(path) {
	if (GLFileLoader.files[path]) {
		console.log("The file was found: " + path);
		return GLFileLoader.files[path];
	}
	console.log("The file was not prefetched: " + path);
	return null;
};

var GLTextureLoader = function() {};

GLTextureLoader.images = new Object();
GLTextureLoader.toLoad = new Stack();

GLTextureLoader.isLoading = 0;

GLTextureLoader.addToLoadStack = function(source) {
	GLTextureLoader.toLoad.push(source);
};

GLTextureLoader.loadImages = function(callback) {
	var startedAllFiles = false;
	console.log("Loading all textures.");
	GLTextureLoader.toLoad.popAll(function(source) {
		var image = new Image();
		image.src = source;
		GLTextureLoader.isLoading++;
		image.onload = function() {
			GLTextureLoader.isLoading--;
			GLTextureLoader.images[source] = (image);
			console.log("Loaded image " + source);
			console.log("Loaded image " + GLTextureLoader.getImage(source));
			if (startedAllFiles && !GLTextureLoader.isLoading) {
				console.log("Done loading all textures.");
				callback(true);
			}
		};
	});

	startedAllFiles = true;
	if (!GLTextureLoader.isLoading) {
		console.log("Done loading all textures.");
		callback(true);
	}
};

GLTextureLoader.getImage = function(path, doLoad) {
	if (GLTextureLoader.images[path]) {
		console.log("The image was found: " + path);
		return GLTextureLoader.images[path];
	}
	console.log("The image was not prefetched: " + path);
	if (doLoad) {
		console.log("Need to load image during runtime...");
		GLTextureLoader.addToLoadStack(path);
		GLTextureLoader.loadImages(function() {});
	}
	return null;
};

var GLException = function(tag, message) {
	console.error("GLException (" + tag + "): " + message);
};