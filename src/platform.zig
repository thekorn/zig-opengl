const builtin = @import("builtin");
const std = @import("std");

pub const is_wasm = switch (builtin.cpu.arch) {
    .wasm32, .wasm64 => true,
    else => false,
};

pub usingnamespace if (is_wasm) @import("web.zig") else @import("c.zig");
