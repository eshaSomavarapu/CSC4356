/**Sushira Somavarapu*/
/**ssomav1@lsu.edu*/
/** Field of grass with lighting effects*/


//Container
var gl;
//Source
var vertexSource;
var fragmentSource;
//Interaction Variables
var dX;
var dY;
var modelRotationX = 0;
var modelRotationY = 0;
var dragging = false;
var lastClientY;
var lastClientX;
//Model and Shaders
var grassModel;
var lightingShader;
var vertexShader;
//Texture, model image, light position location
var modeImage;
var modelTexture;
var lightPositionLocation;

/**
* Object representing a 3D webGl model with the use of input
* parameter that uses JSON data needed
*/

function Model(input){
    //Instantiate arrays
    var positionArray = new Float32Array(flatten(input.positions));
    var triangleArray = new Uint16Array(flatten(input.triangles));
    var normalArray   = new Float32Array(flatten(input.normals));
    var texCoordArray = new Float32Array(flatten(input.texCoords));
    //Create Buffers
    this.positionBuffer = gl.createBuffer();
    this.triangleBuffer  = gl.createBuffer();
    this.normalBuffer    = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
    //Copy vertex data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
    //Copy normal data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalArray,   gl.STATIC_DRAW);
    //Copy triangle data to GPU
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);
    this.triangleArrayLength = triangleArray.length;
    //Copy texture data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoordArray, gl.STATIC_DRAW);
    this.triangleArrayLength = triangleArray.length;
}
/**
 * Draw the Model with the provided shader
 */
Model.prototype.draw = function(objects){
    //Enable vertex attribute array for input objects
    if (objects.vertexPositionLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(objects.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(objects.vertexPositionLocation);
    }
    if (objects.vertexNormalLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(objects.vertexNormalLocation,   3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(objects.vertexNormalLocation);
    }
    if(objects.vertexTexCoordLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(objects.vertexTexCoordLocation, 2, gl.FLOAT, false,0,0);
        gl.enableVertexAttribArray(objects.vertexTexCoordLocation);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArrayLength, gl.UNSIGNED_SHORT, 0);

    if(objects.vertexPositionLocation != -1){
        gl.disableVertexAttribArray(objects.vertexPositionLocation);
    }
    if(objects.vertexNormalLocation != -1){
        gl.disableVertexAttribArray(objects.vertexNormalLocation);
    }
    if(objects.vertexTexCoordLocation != -1){
        gl.disableVertexAttribArray(objects.vertexTexCoordLocation);
    }
}

/**
 * An object that represents GLSL shaders embedded within HTML
 * vertexShader the DOM element id of the vertex shader.
 * fragmentShader the DOM element id of the fragment shader.
 */

function Shader(vertexShader, fragmentShader){
    //Initialize the program objects
    vertexSource   = document.getElementById(vertexShader).text;
    fragmentSource = document.getElementById(fragmentShader).text;
    this.program = createProgram(gl, vertexSource, fragmentSource); // Load onto GPU for execution.

    //Initialize uniform objects
    this.projectionMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
    this.viewMatrixLocation       = gl.getUniformLocation(this.program, "viewMatrix");
    this.modelMatrixLocation      = gl.getUniformLocation(this.program, "modelMatrix");
    this.modelTextureLocation     = gl.getUniformLocation(this.program, "modelTexture");
    this.lightPositionLocation    = gl.getUniformLocation(this.program, "lightPosition");
    this.lightColorLocation       = gl.getUniformLocation(this.program, "lightColor");
    this.modelTextureLocation     = gl.getUniformLocation(this.program, "modelTexture");

    //Configure attributes of the position buffer
    this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');
    this.vertexNormalLocation   = gl.getAttribLocation(this.program, 'vertexNormal');
    this.vertexTexCoordLocation = gl.getAttribLocation(this.program, 'vertexTexCoord');
}
/**
* Prepare the shader for rendering using projection, view, model matrices.
* As well as, lX, lY, lz which refer to light positions across different axes.
*/
Shader.prototype.use = function(projectionMatrix, viewMatrix, modelMatrix, lX, lY, lZ){
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
    gl.uniform4f(this.lightPositionLocation, lX, lY, lZ, 0.0);
    gl.uniform3f(this.modelColorLocation,0.4,0.1,0.0);
    gl.uniform3f(this.lightColorLocation,0.9,0.9,0.9);
}
function init(){
    //Initialize GL context
    var canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, false);
    //Create grass model
    grassModel = new Model(grass);
    //Call the Shader
    lightingShader  = new Shader ('lightingVertexShader', 'lightingFragmentShader');
    //Create texture
    modelTexture = gl.createTexture();
    //Flip image input along Y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    //Create Model Image
    modelImage = new Image();
    modelImage.onload = function(){
        loadTexture(modelImage, modelTexture);
    }
    modelImage.crossOrigin ="anonymous";
    //Get the source of the model Image
    modelImage.src = "http://i.imgur.com/EQir0S6.png";
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.enable(gl.DEPTH_TEST);

    canvas.onmousedown = onmousedown;
    canvas.onmouseup   = onmouseup;
    canvas.onmousemove = onmousemove;
    requestAnimationFrame(draw);
}
function draw(){
    //Create required matrices
    var projectionMatrix = new Matrix4();
    var viewMatrix       = new Matrix4();
    var modelMatrix;
    //place the model
    projectionMatrix.perspective(45, 1, 1, 10);
    viewMatrix.translate(0, 0, -5);
    gl.clearColor(1.0, 1.0, 0.9, 1.0);// Set background color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelMatrix = new Matrix4();
    modelMatrix.rotate(modelRotationX, 1, 0, 0);
    modelMatrix.rotate(modelRotationY, 0, 1, 0);
    modelMatrix.translate(0, 0, 0);

    //call the slider
    var lightPosX = parseFloat(document.getElementById("lightingInX").value);
    var lightPosY = parseFloat(document.getElementById("lightingInY").value);
    var lightPosZ = parseFloat(document.getElementById("lightingInZ").value);

    document.getElementById("lightingOutX").innerHTML = lightPosX;
    document.getElementById("lightingOutY").innerHTML = lightPosY;
    document.getElementById("lightingOutZ").innerHTML = lightPosZ;

    lightingShader.use(projectionMatrix, viewMatrix, modelMatrix,lightPosX,lightPosY, lightPosZ);
    grassModel.draw(lightingShader);
}

function loadTexture(image, texture){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D,0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    requestAnimationFrame(draw);
}

function slider(){
    requestAnimationFrame(draw);
}
function flatten(a){
    return a.reduce(function (b, v) { b.push.apply(b, v); return b }, []);
}
//Track recent location of movement of the mouse
function onmousedown(event){
    dragging = true;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
}
//Stop tracking mouse
function onmouseup(event){
    dragging = false;
}
//Change orientation of the mouse
function onmousemove(event){
    if (dragging){
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
