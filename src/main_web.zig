const std = @import("std");
const c = @import("platform.zig");
const shader = @import("shader.zig");

const vertices = [_]f32{ -1.0, -1.0, 1.0, -1.0, 0.0, 1.0 };

const vertex_shader_source =
    \\#version 300 es
    \\
    \\in vec4 a_position;
    \\
    \\void main() {
    \\    gl_Position = a_position;
    \\}
;
const fragment_shader_source =
    \\#version 300 es
    \\
    \\precision highp float;
    \\out vec4 outColor;
    \\
    \\void main() {
    \\    outColor = vec4(1.0, 0.0, 1.0, 1.0);
    \\}
;

var vao: u32 = undefined;
var program: u32 = undefined;

var width: f32 = undefined;
var height: f32 = undefined;
var scale: f32 = undefined;

fn onInit() !void {
    width = c.getWidth();
    height = c.getHeight();
    scale = c.getScale();

    const vertex_shader = shader.compileShader(vertex_shader_source, c.GL_VERTEX_SHADER);
    const fragment_shader = shader.compileShader(fragment_shader_source, c.GL_FRAGMENT_SHADER);
    program = shader.createProgram(vertex_shader, fragment_shader);

    c.glGenVertexArrays(1, &vao);

    var position_buffer: u32 = undefined;
    c.glGenBuffers(1, &position_buffer);

    c.glBindVertexArray(vao);

    c.glBindBuffer(c.GL_ARRAY_BUFFER, position_buffer);
    c.glBufferData(c.GL_ARRAY_BUFFER, @intCast(@sizeOf(c.GLfloat) * vertices.len), &vertices[0], c.GL_STATIC_DRAW);
    _ = shader.getAttributeLocation(program, 2, "a_position");
}

fn onAnimationFrame() !void {
    c.glViewport(0, 0, @intFromFloat(width * scale), @intFromFloat(height * scale));
    c.glClearColor(0, 0, 0, 1);
    c.glClear(c.GL_COLOR_BUFFER_BIT | c.GL_DEPTH_BUFFER_BIT);

    c.glUseProgram(program);

    c.glBindVertexArray(vao);
    c.glDrawArrays(c.GL_TRIANGLES, 0, 3);
    c.glBindVertexArray(0);
}

export fn onInit_export() void {
    onInit() catch return;
}

export fn onAnimationFrame_export() void {
    onAnimationFrame() catch return;
}
