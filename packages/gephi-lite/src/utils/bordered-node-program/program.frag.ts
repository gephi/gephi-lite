export const fragmentShaderSource = /*glsl*/ `
precision mediump float;

varying vec4 v_color;
varying vec4 v_borderColor;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_borderThickness;
varying float v_antiAliasingBorder;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float dist = length(v_diffVector);

  float insideRadius = v_radius - v_borderThickness;


  // No antialiasing for picking mode:
  #ifdef PICKING_MODE
  if (dist > v_radius)
    gl_FragColor = transparent;
  else
    gl_FragColor = v_color;

  #else
  if (dist < insideRadius - v_antiAliasingBorder)
    gl_FragColor = v_color;
  else if (dist < insideRadius)
    gl_FragColor = mix(v_borderColor, v_color, (insideRadius - dist) / v_antiAliasingBorder);
  else if (dist < v_radius - v_antiAliasingBorder)
    gl_FragColor = v_borderColor;
  else if (dist < v_radius)
    gl_FragColor = mix(transparent, v_borderColor, (v_radius - dist) / v_antiAliasingBorder);
  else
    gl_FragColor = transparent;
  #endif
}
`;
