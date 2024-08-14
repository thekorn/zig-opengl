const $webgl = document.getElementById("canvas");

let webgl2Supported = typeof WebGL2RenderingContext !== "undefined";
let webgl_fallback = false;
let gl;

let webglOptions = {
  alpha: false,
  antialias: true,
  depth: 32,
  failIfMajorPerformanceCaveat: false,
  powerPreference: "default",
  premultipliedAlpha: true,
  preserveDrawingBuffer: true,
};

if (webgl2Supported) {
  gl = $webgl.getContext("webgl2", webglOptions);
  if (!gl) {
    throw new Error("The browser supports WebGL2, but initialization failed.");
  }
}
if (!gl) {
  webgl_fallback = true;
  gl = $webgl.getContext("webgl", webglOptions);

  if (!gl) {
    throw new Error("The browser does not support WebGL");
  }

  let vaoExt = gl.getExtension("OES_vertex_array_object");
  if (!ext) {
    throw new Error(
      "The browser supports WebGL, but not the OES_vertex_array_object extension",
    );
  }
  gl.createVertexArray = vaoExt.createVertexArrayOES;
  gl.deleteVertexArray = vaoExt.deleteVertexArrayOES;
  gl.isVertexArray = vaoExt.isVertexArrayOES;
  gl.bindVertexArray = vaoExt.bindVertexArrayOES;
  gl.createVertexArray = vaoExt.createVertexArrayOES;
}

if (!gl) {
  throw new Error("The browser supports WebGL, but initialization failed.");
}

// OpenGL operates on numeric IDs while WebGL on objects. The following is a
// hack made to allow keeping current API on the native side while resolving IDs
// to objects in JS. Because the values of those IDs don't really matter, there
// is a shared counter.
let id = 1;
const getId = () => {
  id += 1;
  return id;
};

const glShaders = new Map();
const glPrograms = new Map();
const glVertexArrays = new Map();
const glBuffers = new Map();
const glTextures = new Map();
const glUniformLocations = new Map();

const glViewport = (x, y, width, height) => {
  gl.viewport(x, y, width, height);
};

const glClearColor = (r, g, b, a) => {
  gl.clearColor(r, g, b, a);
};

const glEnable = (value) => {
  gl.enable(value);
};

const glDisable = (value) => {
  gl.disable(value);
};

const glDepthFunc = (value) => {
  gl.depthFunc(value);
};

const glBlendFunc = (sFactor, dFactor) => {
  gl.blendFunc(sFactor, dFactor);
};

const glClear = (value) => {
  gl.clear(value);
};

const glGetAttribLocation = (programId, pointer, length) => {
  const name = readString(pointer, length);
  return gl.getAttribLocation(glPrograms.get(programId), name);
};

const glGetUniformLocation = (programId, pointer, length) => {
  const name = readString(pointer, length);
  const value = gl.getUniformLocation(glPrograms.get(programId), name);
  const id = getId();
  glUniformLocations.set(id, value);
  return id;
};

const glUniform4fv = (locationId, x, y, z, w) => {
  gl.uniform4fv(glUniformLocations.get(locationId), [x, y, z, w]);
};

const glUniformMatrix4fv = (locationId, length, transpose, pointer) => {
  const floats = new Float32Array(memory.buffer, pointer, length * 16);
  gl.uniformMatrix4fv(glUniformLocations.get(locationId), transpose, floats);
};

const glUniform1i = (locationId, value) => {
  gl.uniform1i(glUniformLocations.get(locationId), value);
};

const glUniform1f = (locationId, value) => {
  gl.uniform1f(glUniformLocations.get(locationId), value);
};

const glCreateBuffer = () => {
  const id = getId();
  glBuffers.set(id, gl.createBuffer());
  return id;
};

const glGenBuffers = (number, pointer) => {
  const buffers = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    const b = glCreateBuffer();
    buffers[n] = b;
  }
};

const glAttachShader = (program, shader) => {
  gl.attachShader(glPrograms.get(program), glShaders.get(shader));
};

const glDetachShader = (program, shader) => {
  gl.detachShader(glPrograms.get(program), glShaders.get(shader));
};

const glDeleteProgram = (id) => {
  gl.deleteProgram(glPrograms.get(id));
  glPrograms.delete(id);
};

const glDeleteBuffer = (id) => {
  gl.deleteBuffer(glBuffers.get(id));
  glBuffers.delete(id);
};

const glDeleteBuffers = (number, pointer) => {
  const buffers = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    gl.deleteBuffer(glBuffers.get(buffers[n]));
    glBuffers.delete(buffers[n]);
  }
};

const glDeleteShader = (id) => {
  gl.deleteShader(glShaders.get(id));
  glShaders.delete(id);
};

const glCreateShader = (type) => {
  const shader = gl.createShader(type);
  const id = getId();
  glShaders.set(id, shader);
  return id;
};

const glCompileShader = (id) => {
  gl.compileShader(glShaders.get(id));
};

// This differs from OpenGL version due to problems with reading strings till
// null termination.
const glShaderSource = (shader, pointer, length) => {
  const source = readString(pointer, length);
  gl.shaderSource(glShaders.get(shader), source);
};

const glCreateProgram = () => {
  const id = getId();
  const program = gl.createProgram();
  glPrograms.set(id, program);
  return id;
};

const glGetShaderParameter = (id, parameter) => {
  return gl.getShaderParameter(glShaders.get(id), parameter);
};

const glGetShaderInfoLog = (id, length, lengthPointer, messagePointer) => {
  const message = new Uint8Array(memory.buffer, messagePointer, length);
  const info = gl.getShaderInfoLog(glShaders.get(id));

  for (let i = 0; i < info.length; i++) {
    message[i] = info.charCodeAt(i);
  }
};

const glLinkProgram = (id) => {
  gl.linkProgram(glPrograms.get(id));
};

const glBindBuffer = (type, bufferId) => {
  gl.bindBuffer(type, glBuffers.get(bufferId));
};

const glBufferData = (type, count, pointer, drawType) => {
  // The Float32Array multiplies by size of float which is 4, and the call to
  // this method, due to OpenGL compatibility, also receives already
  // pre-multiplied value.
  const floats = new Float32Array(memory.buffer, pointer, count / 4);
  gl.bufferData(type, floats, drawType);
};

const glUseProgram = (programId) => {
  gl.useProgram(glPrograms.get(programId));
};

const glEnableVertexAttribArray = (value) => {
  gl.enableVertexAttribArray(value);
};

const glVertexAttribPointer = (
  attribLocation,
  size,
  type,
  normalize,
  stride,
  offset,
) => {
  gl.vertexAttribPointer(attribLocation, size, type, normalize, stride, offset);
};

const glDrawArrays = (type, offset, count) => {
  gl.drawArrays(type, offset, count);
};

const glCreateTexture = () => {
  const id = getId();
  glTextures.set(id, gl.createTexture());
  return id;
};

const glGenTextures = (number, pointer) => {
  const textures = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    const texture = glCreateTexture();
    textures[n] = texture;
  }
};

const glDeleteTextures = (number, pointer) => {
  const textures = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    gl.deleteTexture(buffers[n]);
    glTextures.delete(textures[n]);
  }
};

const glDeleteTexture = (id) => {
  gl.deleteTexture(glTextures.get(id));
  glTextures.delete(id);
};

const glBindTexture = (target, id) => {
  return gl.bindTexture(target, glTextures.get(id));
};

const glTexImage2D = (
  target,
  level,
  internalFormat,
  width,
  height,
  border,
  format,
  type,
  pointer,
) => {
  let size = 1;
  if (format === gl.RGBA) {
    size = 4;
  } else {
    throw new Error("Add pixel count for this format.");
  }

  const data = new Uint8Array(memory.buffer, pointer, width * height * size);

  gl.texImage2D(
    target,
    level,
    internalFormat,
    width,
    height,
    border,
    format,
    type,
    data,
  );
};

const glTexParameteri = (target, name, parameter) => {
  gl.texParameteri(target, name, parameter);
};

const glActiveTexture = (target) => {
  return gl.activeTexture(target);
};

const glGenerateMipmap = (value) => {
  gl.generateMipmap(value);
};

const glCreateVertexArray = () => {
  const id = getId();
  glVertexArrays.set(id, gl.createVertexArray());
  return id;
};

const glGenVertexArrays = (number, pointer) => {
  const vaos = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    const b = glCreateVertexArray();
    vaos[n] = b;
  }
};

const glDeleteVertexArrays = (number, pointer) => {
  const vaos = new Uint32Array(memory.buffer, pointer, number);
  for (let n = 0; n < number; n++) {
    gl.createTexture(vaos[n]);
    glVertexArrays.delete(vaos[n]);
  }
};

const glBindVertexArray = (id) => gl.bindVertexArray(glVertexArrays.get(id));

const glPixelStorei = (type, alignment) => gl.pixelStorei(type, alignment);

const glGetError = () => gl.getError();

var webgl = {
  glViewport,
  glClearColor,
  glEnable,
  glDisable,
  glDepthFunc,
  glBlendFunc,
  glClear,
  glGetAttribLocation,
  glGetUniformLocation,
  glUniform4fv,
  glUniform1i,
  glUniform1f,
  glUniformMatrix4fv,
  glCreateVertexArray,
  glGenVertexArrays,
  glDeleteVertexArrays,
  glBindVertexArray,
  glCreateBuffer,
  glGenBuffers,
  glDeleteBuffers,
  glDeleteBuffer,
  glBindBuffer,
  glBufferData,
  glPixelStorei,
  glAttachShader,
  glDetachShader,
  glDeleteShader,
  glCreateShader,
  glCompileShader,
  glShaderSource,
  glCreateProgram,
  glGetShaderInfoLog,
  glLinkProgram,
  glUseProgram,
  glDeleteProgram,
  glEnableVertexAttribArray,
  glVertexAttribPointer,
  glDrawArrays,
  glCreateTexture,
  glGenTextures,
  glDeleteTextures,
  glDeleteTexture,
  glBindTexture,
  glTexImage2D,
  glTexParameteri,
  glActiveTexture,
  glGenerateMipmap,
  glGetError,
  glGetShaderParameter,
};
