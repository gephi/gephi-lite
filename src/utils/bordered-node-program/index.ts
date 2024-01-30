import { NodeProgram } from "sigma/rendering/webgl/programs/common/node";
import { RenderParams } from "sigma/types";
import { floatColor } from "sigma/utils";

import { CustomNodeDisplayData } from "../../core/appearance/types";
import { fragmentShaderSource as FRAGMENT_SHADER_SOURCE } from "./program.frag";
import { vertexShaderSource as VERTEX_SHADER_SOURCE } from "./program.vert";

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

const UNIFORMS = ["u_sizeRatio", "u_correctionRatio", "u_matrix"] as const;

export default class NodeProgramBorder extends NodeProgram<(typeof UNIFORMS)[number]> {
  static readonly ANGLE_1 = 0;
  static readonly ANGLE_2 = (2 * Math.PI) / 3;
  static readonly ANGLE_3 = (4 * Math.PI) / 3;

  getDefinition() {
    return {
      VERTICES: 3,
      ARRAY_ITEMS_PER_VERTEX: 6,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
      UNIFORMS,
      ATTRIBUTES: [
        { name: "a_position", size: 2, type: FLOAT },
        { name: "a_size", size: 1, type: FLOAT },
        { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_borderColor", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_angle", size: 1, type: FLOAT },
      ],
    };
  }

  processVisibleItem(i: number, data: CustomNodeDisplayData) {
    const array = this.array;

    const color = floatColor(data.color);
    const borderColor = floatColor(data.borderColor || data.color);

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i++] = color;
    array[i++] = borderColor;
    array[i++] = NodeProgramBorder.ANGLE_1;

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i++] = color;
    array[i++] = borderColor;
    array[i++] = NodeProgramBorder.ANGLE_2;

    array[i++] = data.x;
    array[i++] = data.y;
    array[i++] = data.size;
    array[i++] = color;
    array[i++] = borderColor;
    array[i] = NodeProgramBorder.ANGLE_3;
  }

  draw(params: RenderParams): void {
    const gl = this.gl;

    const { u_sizeRatio, u_correctionRatio, u_matrix } = this.uniformLocations;

    gl.uniform1f(u_sizeRatio, params.sizeRatio);
    gl.uniform1f(u_correctionRatio, params.correctionRatio);
    gl.uniformMatrix3fv(u_matrix, false, params.matrix);

    gl.drawArrays(gl.TRIANGLES, 0, this.verticesCount);
  }
}
