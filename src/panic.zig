const std = @import("std");
const is_wasm = @import("platform.zig").is_wasm;

pub extern fn throwError(_: [*]const u8, _: c_uint) void;

fn panic_wasm(comptime format: []const u8, args: anytype) void {
    var buffer: [1024]u8 = undefined;
    const text_buffer = std.fmt.bufPrint(&buffer, format, args) catch return;
    throwError(text_buffer.ptr, text_buffer.len);
}

pub const panic = if (is_wasm) panic_wasm else std.debug.panic;
