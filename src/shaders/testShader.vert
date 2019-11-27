#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

varying vec3 vNormal;
varying vec2 vUv;

varying vec3 fragPos;


void main() {
  vNormal = mat3(transpose(inverse(modelMatrix))) * normal;
  vUv = uv;

  fragPos = vec3(modelMatrix * vec4(position, 1.0));

  // vec3 modPos = mix(position, (position + (normal * 0.5)), vUv.x);

  // gl_Position = projectionMatrix * modelViewMatrix * vec4(modPos,1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}