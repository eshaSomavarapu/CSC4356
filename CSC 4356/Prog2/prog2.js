/**Sushira Somavarapu*/
/**ssomav1@lsu.edu*/


var canvas;
var gl;

var positionBuffer;
var triangleBuffer;


var vertexPositionLocation;
var vertexColorLocation;

var program;
var modelMatrixLocation;
var viewMatrixLocation;
var projectionMatrixLocation;

var modelRotationX = 0;
var modelRotationY = 0;

var dragging = false;
var lastClientX;
var lastClientY;
var dX;
var dY;

function flatten (a)
{
  return a.reduce(function (b,v) {b.push.apply(b,v); return b}, [])
}

//Track recent location of movement of the mouse
function onmousedown(event)
{
        dragging = true;
        lastClientX = event.clientX;
        lastClientY = event.clientY;

}

//Stop Tracking mouse
function onmouseup(event)
{
        dragging = false;
}

//Change orientation of the mouse
function onmousemove(event)
{
      if (dragging)
      {
          dX = event.clientX - lastClientX;
          dY = event.clientY - lastClientY;

          modelRotationY = modelRotationY+dX;
          modelRotationX = modelRotationX+dY;

          if (modelRotationX > 90.0)
              modelRotationX = 90.0;
          if (modelRotationX < -90.0)
              modelRotationX = -90.0;


    requestAnimationFrame(draw);
      }

      lastClientX = event.clientX;
      lastClientY = event.clientY;


}


function init()
{
  //Initialize GL context
        canvas = document.getElementById('webgl');
        gl = getWebGLContext(canvas, false);

        canvas.onmousemove = onmousemove;
        canvas.onmouseup = onmouseup;
        canvas.onmousedown = onmousedown;

//Initialize the program objects
        var vertexSource = document.getElementById('vertexShader').text;
        var fragmentSource = document.getElementById('fragmentShader').text;
        program = createProgram(gl, vertexSource, fragmentSource);
        gl.useProgram(program);

        vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');
        vertexColorLocation = gl.getAttribLocation(program, 'vertexColor');

        gl.enableVertexAttribArray(vertexPositionLocation);
        gl.enableVertexAttribArray(vertexColorLocation);

// Initialize unifrom objects

        modelMatrixLocation = gl.getUniformLocation(program, 'modelMatrix');
        viewMatrixLocation = gl.getUniformLocation(program, 'viewMatrix');
        projectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix');

        positionArray = new Float32Array(flatten(cube.positions));
        colorArray = new Float32Array(flatten(cube.colors));
        triangleArray = new Uint16Array(flatten(cube.triangles));

// Initialize Buffer objects
        positionBuffer = gl.createBuffer();
        colorBuffer = gl.createBuffer();
        triangleBuffer = gl.createBuffer();

//Copy Vertex Data to the GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
// Copy Color data to the GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);

//Copy Triangle Data to the GPU
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

        gl.enable(gl.DEPTH_TEST);


        requestAnimationFrame(draw);
}

function draw()
{

    var modelMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    var projectionMatrix = new Matrix4();

    modelMatrix.rotate(modelRotationX, 1, 0, 0);
    modelMatrix.rotate(modelRotationY, 0, 1, 0);


    viewMatrix.translate(0, 0, -5);

    projectionMatrix.perspective(45, 1, 1, 10);


    gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix.elements);

// Clear the screen
    gl.clearColor(0.0,0.8,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


// draw the traingles
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColorLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
    gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);

}
