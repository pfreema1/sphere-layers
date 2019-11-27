#pragma glslify: map = require(glsl-map)

varying vec3 vNormal;
varying vec2 vUv;
uniform float u_time;
uniform sampler2D u_texture;
uniform vec2 uMouse;

varying vec3 fragPos;

void main() {
  vec2 st = vUv;  
  vec3 color = vec3(1.0);
  vec2 pos = vec2(st * 300.0);
  vec3 outsideColor = vec3(0.0);
  vec4 textureColor = texture2D(u_texture, vUv);


  float lightX = map(uMouse.x, -1.0, 1.0, -2.2, 2.2);
  float lightY = map(uMouse.y, -1.0, 1.0, -2.0, 2.0);
  float lightZ = sin(u_time) * 3.0;
  vec3 lightPos = vec3(lightX, lightY, lightZ);
  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(lightPos - fragPos);
  float diff = max(dot(norm, lightDir), 0.0);

  color = mix(color, outsideColor, 1.0 - diff);

  // color = vec3(diff);
  gl_FragColor = vec4(color, 1.0);
}