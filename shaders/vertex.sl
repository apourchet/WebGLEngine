attribute vec3 aPos;
attribute vec4 aColor;
attribute vec2 aTex;
attribute vec3 aNorm;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uLookAtMatrix;
uniform mat4 uNMatrix;

uniform vec3 uLightingPosition;

uniform bool uUseLighting;
uniform bool uUsePointLighting;

uniform float maxLightRange;
uniform float pointSize;

varying vec4 vColor;
varying vec2 vTex;
varying vec3 vNorm;
varying vec3 vPos;
varying vec3 vLightingPosition;

void main(void) {
	if(pointSize != 0.0){
		gl_PointSize = pointSize;
	}

	gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
	vPos = (uMVMatrix * vec4(aPos, 1.0)).xyz;	
	vLightingPosition = (uLookAtMatrix * vec4(uLightingPosition, 1.0)).xyz;
	vColor = aColor;
	vTex = aTex;
	if(uUseLighting && uUsePointLighting){
		vNorm = ((uNMatrix) * vec4(aNorm, 1.0)).xyz;
		return;
	}
	vNorm = aNorm;
}
