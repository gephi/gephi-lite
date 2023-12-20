export const vertexShaderSource = /*glsl*/ `
attribute vec4 a_id;
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;
attribute vec4 a_color;
attribute vec4 a_borderColor;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec4 v_color;
varying vec4 v_borderColor;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_borderThickness;
varying float v_antiAliasingBorder;

const float bias = 255.0 / 254.0;
const float marginRatio = 1.05;

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  vec2 position = a_position + diffVector * marginRatio;
  gl_Position = vec4(
    (u_matrix * vec3(position, 1)).xy,
    0,
    1
  );

  v_antiAliasingBorder = u_correctionRatio;
  v_diffVector = diffVector;
  v_radius = size / 2.0 / marginRatio;
  v_borderThickness = min(5.0 * u_correctionRatio, v_radius / 2.0);

  #ifdef PICKING_MODE
  // For picking mode, we use the ID as both colors:
  v_color = a_id;
  v_borderColor = a_id;
  #else
  // For normal mode, we use the color:
  v_color = a_color;
  v_borderColor = a_borderColor;
  #endif

  v_color.a *= bias;
  v_borderColor.a *= bias;
}
`;
