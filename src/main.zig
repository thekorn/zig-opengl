const std = @import("std");
const c = @import("platform.zig");

const shader = @import("shader.zig");

const vertices = [_]f32{ -1.0, -1.0, 1.0, -1.0, 0.0, 1.0 };

const vertex_shader_source =
    \\#version 330 core
    \\in vec4 a_position;
    \\
    \\void main() {
    \\    gl_Position = a_position;
    \\}
;
const fragment_shader_source =
    \\#version 330 core
    \\
    \\precision highp float;
    \\out vec4 outColor;
    \\
    \\void main() {
    \\    outColor = vec4(1.0, 0.0, 1.0, 1.0);
    \\}
;

fn errorCallback(err: c_int, description: [*c]const u8) callconv(.C) void {
    _ = err;
    std.log.err("GLFW Error: {s}", .{description});
}

// Function that creates a window using GLFW.
pub fn createWindow(width: i32, height: i32) !*c.GLFWwindow {
    var window: *c.GLFWwindow = undefined;

    _ = c.glfwSetErrorCallback(errorCallback);

    if (c.glfwInit() == c.GL_FALSE) {
        std.debug.panic("Failed to initialize GLFW", .{});
    }

    c.glfwWindowHint(c.GLFW_OPENGL_PROFILE, c.GLFW_OPENGL_CORE_PROFILE);

    // MSAA.
    c.glfwWindowHint(c.GLFW_SAMPLES, 4);

    // Needed on MacOS.
    c.glfwWindowHint(c.GLFW_OPENGL_FORWARD_COMPAT, c.GL_TRUE);

    c.glfwWindowHint(c.GLFW_CONTEXT_VERSION_MAJOR, 3);
    c.glfwWindowHint(c.GLFW_CONTEXT_VERSION_MINOR, 3);

    window = c.glfwCreateWindow(width, height, "hello-world", null, null) orelse {
        std.log.err("Failed to create window", .{});
        return error.FailedToCreateWindow;
    };

    c.glfwMakeContextCurrent(window);

    return window;
}

pub fn main() !void {
    const width = 800;
    const height = 600;

    const window_handler = try createWindow(width, height);

    var framebuffer_width: i32 = undefined;
    var framebuffer_height: i32 = undefined;
    c.glfwGetFramebufferSize(window_handler, &framebuffer_width, &framebuffer_height);

    const vertex_shader = shader.compileShader(vertex_shader_source, c.GL_VERTEX_SHADER);
    const fragment_shader = shader.compileShader(fragment_shader_source, c.GL_FRAGMENT_SHADER);
    const program = shader.createProgram(vertex_shader, fragment_shader);

    c.glUseProgram(program);

    var vao: u32 = undefined;
    c.glGenVertexArrays(1, &vao);
    defer c.glDeleteVertexArrays(1, &vao); // Clean up in the end of main().

    var position_buffer: u32 = undefined;
    c.glGenBuffers(1, &position_buffer);
    defer c.glDeleteBuffers(1, &position_buffer); // Clean up in the end of main().

    c.glBindVertexArray(vao);

    c.glBindBuffer(c.GL_ARRAY_BUFFER, position_buffer);
    c.glBufferData(c.GL_ARRAY_BUFFER, @intCast(@sizeOf(c.GLfloat) * vertices.len), &vertices[0], c.GL_STATIC_DRAW);
    _ = shader.getAttributeLocation(program, 2, "a_position");

    while (c.glfwWindowShouldClose(window_handler) == c.GL_FALSE) {
        c.glViewport(0, 0, framebuffer_width, framebuffer_height);
        c.glClearColor(0, 0, 0, 1);
        c.glClear(c.GL_COLOR_BUFFER_BIT | c.GL_DEPTH_BUFFER_BIT);

        c.glBindVertexArray(vao);
        c.glDrawArrays(c.GL_TRIANGLES, 0, 3);
        c.glBindVertexArray(0);

        c.glfwSwapBuffers(window_handler);
        c.glfwPollEvents();
    }
}
