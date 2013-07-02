precision lowp float;

uniform sampler2D uImage;

uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform mat4 uLookAtMatrix;

uniform vec3 uAmbientColor;
uniform vec3 uLightingColor;
uniform vec3 uLightingDirection;
uniform vec3 uLightingPosition;

uniform bool uUseLighting;
uniform bool uUsePointLighting;

uniform float maxLightRange;

varying vec4 vColor;
varying vec2 vTex;
varying vec3 vNorm;
varying vec3 vPos;
varying vec3 vLightingPosition;

void main(void) {
	if(vColor != vec4(0, 0, 0, 1)) {
		gl_FragColor = vColor;
	}else{
		vec3 vLightWeight = vec3(1.0, 1.0, 1.0);
		vec4 textureColor = texture2D(uImage, vTex);

		if(uUseLighting){
			if(uUsePointLighting){
				float range = maxLightRange;
				if(range == 0.0){
					range = 3.0;
				}
				vec3 lightDirection = normalize(vPos - vLightingPosition);
				if(gl_FrontFacing == false){
					lightDirection = lightDirection * vec3(-1, -1, -1);
				}
				float theDistance = distance(vLightingPosition, vPos);

				float diminish = (theDistance / range);
				float directionalLightWeighting = max(dot(vNorm, lightDirection * vec3(-1, -1, -1)), 0.0);

				vLightWeight = uAmbientColor + uLightingColor * directionalLightWeighting / (diminish);

			} else {
				vec3 lightDirection;
				if(gl_FrontFacing == false){
					lightDirection = uLightingDirection * vec3(-1, -1, -1);
				}else{
					lightDirection = uLightingDirection;
				}
				float directionalLightWeighting = max(dot(vNorm, normalize(lightDirection) * vec3(-1, -1, -1)), 0.0);
				vLightWeight = uAmbientColor + uLightingColor * directionalLightWeighting;
			}
		}

		gl_FragColor = vec4(textureColor.rgb * vLightWeight, textureColor.a);
 	}
}