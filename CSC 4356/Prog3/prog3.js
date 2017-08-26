/**Sushira Somavarapu*/
/**ssomav1@lsu.edu*/


var gl;
var program;
var positionBuffer;
var normalizeBuffer;
var triangleBuffer;
var projectionMatrixLocation;
var viewMatrixLocation;
var lightPositionLocation;
var modelMatrixLocation;
var modelColorLocation;
var lightColorLocation;

var modelRotationY = 0;
var modelRotationX = 0;
var lastClientX;
var lastClientY;
dragging = false;
var normals = [];

//Compute vector Addition
function vecAddition(a, b)
{
		return [
		a[0] + b[0],
		a[1] + b[1],
		a[2] + b[2]];
}
// Compute vector substraction
function vecSubtraction(a, b)
{
		return [
		a[0] - b[0],
		a[1] - b[1],
		a[2] - b[2]];
}
//Compute dot product
function vecDot(a, b)
{
		return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
//Compute Cross Product
function vecCrossProduct(a, b)
{
		return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]];
}
//Perform Vector Normalization
function normalize(a)
{
		var len = Math.sqrt(vecDot(a, a));
		return [  a[0] / len,
							a[1] / len,
							a[2] / len];
}
//Generate a new array of normals
function vecNormal()
{
		for (var i in bunny.positions)
		{
				normals.push([0, 0, 0]);
		}

		for (var i = 0; i < bunny.triangles.length; i++)
		{
				var triangles = bunny.triangles[i];
				var a = normalize(vecSubtraction(bunny.positions[triangles[1]], bunny.positions[triangles[0]]));
				var b = normalize(vecSubtraction(bunny.positions[triangles[2]], bunny.positions[triangles[0]]));

				n = normalize(vecCrossProduct(a, b));
				normals[triangles[0]] = vecAddition(normals[triangles[0]], n);
				normals[triangles[1]] = vecAddition(normals[triangles[1]], n);
				normals[triangles[2]] = vecAddition(normals[triangles[2]], n);
		}

		for (var i in normals)
		{
				i = normalize(i);
		}
}

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
					var dX = event.clientX - lastClientX;
					var dY = event.clientY - lastClientY;
					modelRotationY = modelRotationY + dX;
					modelRotationX = modelRotationX + dY;
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
		canvas = document.getElementById("webgl");
		gl = getWebGLContext(canvas, false);
		canvas.onmousedown = onmousedown;
		canvas.onmouseup = onmouseup;
		canvas.onmousemove = onmousemove;

		//Initialize the program objects
		var vertexSource   = document.getElementById('vertexShader').text;
		var fragmentSource = document.getElementById('fragmentShader').text;
		program = createProgram(gl, vertexSource, fragmentSource); // Load onto GPU for execution.
		gl.useProgram(program);

		// Initialize uniform objects
		projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
		viewMatrixLocation       = gl.getUniformLocation(program, "viewMatrix");
		modelMatrixLocation      = gl.getUniformLocation(program, "modelMatrix");
		lightPositionLocation    = gl.getUniformLocation(program, "lightPosition");
		modelColorLocation       = gl.getUniformLocation(program, "modelColor");
		lightColorLocation       = gl.getUniformLocation(program, "lightColor");

		// Initialize Buffer objects
		positionBuffer  = gl.createBuffer();
		triangleBuffer  = gl.createBuffer();
		normalizeBuffer = gl.createBuffer();

		vecNormal();

		positionArray  = new Float32Array(flatten(bunny.positions));
		triangleArray  = new Uint16Array (flatten(bunny.triangles));
		normalizeArray = new Float32Array(flatten(normals));

		//Copy Position Data to the GPU
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
		// Copy Normalize data to the GPU
		gl.bindBuffer(gl.ARRAY_BUFFER, normalizeBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, normalizeArray, gl.STATIC_DRAW);
		//Copy Triangle Data to the GPU
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

		requestAnimationFrame(draw);
}

function draw()
{
		gl.clearColor(1.0, 1.0, 0.0, 1.0);

		modelMatrix      = new Matrix4();
		projectionMatrix = new Matrix4();
		viewMatrix       = new Matrix4();

		projectionMatrix.perspective(45, 1, 1, 10);
		viewMatrix.translate(0, 0, -5);
		modelMatrix.rotate(modelRotationX, 1, 0, 0);
		modelMatrix.rotate(modelRotationY, 0, 1, 0);

		gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix.elements);
		gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix.elements);
		gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix.elements);
		gl.uniform4f(lightPositionLocation, 20.0, 20.0, 5.0, 1.0);
		gl.uniform3f(modelColorLocation, 0.6, 0.1, 0.4);
		gl.uniform3f(lightColorLocation, 0.3, 0.1, 0.9);

		// draw the triangles
		var vertexPositionLocation = gl.getAttribLocation(program, 'vertexPosition');
		var vertexNormalLocation = gl.getAttribLocation(program, 'vertexNormal');

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

		gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionLocation);

		gl.bindBuffer(gl.ARRAY_BUFFER, normalizeBuffer);
		gl.vertexAttribPointer(vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexNormalLocation);

		//Clear the screen
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
		gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);
}
