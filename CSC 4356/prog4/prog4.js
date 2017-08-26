/**Sushira Somavarapu*/
/**ssomav1@lsu.edu*/

var gl,
dragging = false,
lastClientX,
lastClientY,
teapotModel,
cowModel,
planeModel,
rainbowShader,
lightingShader,
goochShader,
modelRotationY = 0,
modelRotationX = 0;

function flatten(a)
{
  return a.reduce(function (b, v) { b.push.apply(b, v); return b }, []);
}
//Track recent location of movement of the mouse
function onmousedown(event)
{
  dragging = true;
  lastClientX = event.clientX;
  lastClientY = event.clientY;
}
//Stop tracking mouse
function onmouseup(event)
{
  dragging = false;
}
//Change orientation of the mouse
function onmousemove(event)
{
  if (dragging)
  {
    var dX = event.clientX - lastClientX;
    var dY = event.clientY - lastClientY;

    modelRotationY = modelRotationY + dX;
    modelRotationX = modelRotationX + dY;

    // Limit the rotation.
    if (modelRotationX > 90.0)
    modelRotationX = 90.0;
    if (modelRotationX < -90.0)
    modelRotationX = -90.0;

   requestAnimationFrame(draw);
 }

  lastClientX = event.clientX;
  lastClientY = event.clientY;
}

function Shader(vertexShader, fragmentShader)
{
    //Initialize the program objects
    var vertexSource   = document.getElementById(vertexShader).text;
    var fragmentSource = document.getElementById(fragmentShader).text;

    this.program = createProgram(gl, vertexSource, fragmentSource); // Load onto GPU for execution.
    gl.useProgram(this.program);
    //Initialize uniform objects
    this.projectionMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
    this.viewMatrixLocation       = gl.getUniformLocation(this.program, "viewMatrix");
    this.modelMatrixLocation      = gl.getUniformLocation(this.program, "modelMatrix");
    this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');
    this.vertexNormalLocation   = gl.getAttribLocation(this.program, 'vertexNormal');
}

Shader.prototype.setup = function(projectionMatrix, viewMatrix, modelMatrix)
{
  gl.useProgram(this.program);

  gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
  gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
  gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
}

function Model(input)
{
  //Instantiate postion, triange and normal arrays
  var positionArray = new Float32Array(flatten(input.positions));
  var triangleArray = new Uint16Array(flatten(input.triangles));
  var normalArray   = new Float32Array(flatten(input.normals));

  this.triangleBuffer  = gl.createBuffer();
  this.positionBuffer  = gl.createBuffer();
  this.normalBuffer    = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normalArray,   gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
  this.triangleArrayLength = triangleArray.length;
}

Model.prototype.draw = function(objects)
{
  if (objects.vertexPositionLocation != -1)
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(objects.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(objects.vertexPositionLocation);
  }
  if (objects.vertexNormalLocation != -1)
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(objects.vertexNormalLocation,   3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(objects.vertexNormalLocation);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
  gl.drawElements(gl.TRIANGLES, this.triangleArrayLength, gl.UNSIGNED_SHORT, 0);

  if (objects.vertexPositionLocation != -1)
  {
    gl.disableVertexAttribArray(objects.vertexPositionLocation);
  }
  if (objects.vertexNormalLocation != -1)
  {
    gl.disableVertexAttribArray(objects.vertexNormalLocation);
  }
}

function init()
{
  //Initialize GL context
  var canvas = document.getElementById("webgl");
  gl = getWebGLContext(canvas, false);

  canvas.onmousedown = onmousedown;
  canvas.onmouseup   = onmouseup;
  canvas.onmousemove = onmousemove;
  //Instatiate 3 shaders
  goochShader    = new Shader ('goochVertexShader', 'goochFragmentShader');
  rainbowShader  = new Shader ('rainbowVertexShader', 'rainbowFragmentShader');
  lightingShader = new Shader ('lightingVertexShader', 'lightingFragmentShader');
  //Instatiate 3 models
  planeModel   = new Model(plane);
  teapotModel  = new Model(teapot);
  cowModel     = new Model(cow);

  gl.enable(gl.DEPTH_TEST);

  requestAnimationFrame(draw);
}

function draw()
{
  var projectionMatrix = new Matrix4();
  var viewMatrix       = new Matrix4();
  var modelMatrix;

  projectionMatrix.perspective(45, 1, 1, 10);
  viewMatrix.translate(0, 0, -5);
  //clear the screen
  gl.clearColor(1.0, 1.0, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // draw the 3 models using the shaders
  modelMatrix = new Matrix4();
  modelMatrix.rotate(modelRotationX, 1, 0, 0);
  modelMatrix.rotate(modelRotationY, 0, 1, 0);
  modelMatrix.translate(0, 0, 1);

  lightingShader.setup(projectionMatrix, viewMatrix, modelMatrix);
  planeModel.draw(lightingShader);

  modelMatrix = new Matrix4();
  modelMatrix.rotate(modelRotationX, 1, 0, 0);
  modelMatrix.rotate(modelRotationY, 0, 1, 0);
  modelMatrix.translate(-1, 0, -0.5);

  rainbowShader.setup(projectionMatrix, viewMatrix, modelMatrix);
  teapotModel.draw(rainbowShader);

  modelMatrix = new Matrix4();
  modelMatrix.rotate(modelRotationX, 1, 0, 0);
  modelMatrix.rotate(modelRotationY, 0, 1, 0);
  modelMatrix.translate(1, 0, -0.5);

  goochShader.setup(projectionMatrix, viewMatrix, modelMatrix);
  cowModel.draw(goochShader);
}
