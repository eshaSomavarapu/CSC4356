/**Sushira Somavarapu*/
/**ssomav1@lsu.edu*/
/*Project 6*/

//Initialize global variables
var gl,
dragging = false,
lastClientX,
lastClientY,
chestModel,
squareModel,
thresholdShader,
originalShader,
blurShader,
edgeShader,
colorTexture,
depthTexture,
otherShader,
framebufferObject,
framebufferWidth = 500,
framebufferHeight = 500,
modelTexture,
vertexShader,
vertexSource,
fragmentSource,
lightPositionLocation,
lightingShader,
dX,dY,
lX = 0, lY = 0, lZ =0,
modelRotationY = 0,
modelRotationX = 0;

//Create the model object
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
}
//Draw the model with provided shader
Model.prototype.draw = function(shader){
    //Enable vertex attribute array for vertexPositionLocation
    if (shader.vertexPositionLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.vertexPositionLocation);
    }
    //Enable vertex attribute array for vertexNormalLocation
    if (shader.vertexNormalLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shader.vertexNormalLocation,   3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shader.vertexNormalLocation);
    }
    //Enable vertex attribute array for vertexTexCoordLocation
    if(shader.vertexTexCoordLocation != -1){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(shader.vertexTexCoordLocation, 2, gl.FLOAT, false,0,0);
        gl.enableVertexAttribArray(shader.vertexTexCoordLocation);
    }
    if(shader.vertexPositionLocation != -1) {
		 gl.disableVertexAttribArray(shader.vertexPositionLocation);
	}
	if(shader.vertexNormalLocation != -1) {
		 gl.disableVertexAttribArray(shader.vertexNormalLocation);
	}
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
    gl.drawElements(gl.TRIANGLES, this.triangleArrayLength, gl.UNSIGNED_SHORT, 0);
}
//An object representing a paris of GLSL shaders embedded within HTML
function Shader(vertexShader, fragmentShader){
      //Initialize the program shader
      vertexSource   = document.getElementById(vertexShader).text;
      fragmentSource = document.getElementById(fragmentShader).text;
      this.program = createProgram(gl, vertexSource, fragmentSource); // Load onto GPU for execution.
      //Initialize uniform shader
      this.projectionMatrixLocation = gl.getUniformLocation(this.program, "projectionMatrix");
      this.viewMatrixLocation       = gl.getUniformLocation(this.program, "viewMatrix");
      this.modelMatrixLocation      = gl.getUniformLocation(this.program, "modelMatrix");
      this.modelTextureLocation     = gl.getUniformLocation(this.program, "modelTexture");
      this.lightPositionLocation    = gl.getUniformLocation(this.program, "lightPosition");
      this.lightColorLocation       = gl.getUniformLocation(this.program, "lightColor");
      this.diffuseColorLocation = gl.getUniformLocation(this.program, "diffuseColor");
  	  this.specularColorLocation = gl.getUniformLocation(this.program, "specularColor");
      this.modelTextureLocation     = gl.getUniformLocation(this.program, "modelTexture");
      //Configure attributes of the position buffer
      this.vertexPositionLocation = gl.getAttribLocation(this.program, 'vertexPosition');
      this.vertexNormalLocation   = gl.getAttribLocation(this.program, 'vertexNormal');
      this.vertexTexCoordLocation = gl.getAttribLocation(this.program, 'vertexTexCoord');
}
//Prepare the shader for rendering
Shader.prototype.use = function(projectionMatrix, viewMatrix, modelMatrix,lX,lY,lZ){
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix.elements);
    gl.uniformMatrix4fv(this.viewMatrixLocation, false, viewMatrix.elements);
    gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix.elements);
    //Set the values on screen for light
    gl.uniform4f(this.lightPositionLocation, lX, lY, lZ, 0.0);
    //gl.uniform3f(this.modelColorLocation,0.4,0.1,0.0);
    //gl.uniform3f(this.lightColorLocation,0.9,0.9,0.9);
}

//Initialize all elements and connect interaction event handles to the canvas
function init(){
    //Initialize GL context
    var canvas = document.getElementById("webgl");
    gl = getWebGLContext(canvas, false);
    //Call chest and sqaure model
    chestModel = new Model(chest);
    squareModel = new squareModel(square);
    //Call the Shaders
    lightingShader  = new Shader('lightingVertexShader', 'lightingFragmentShader');
    //originalShader  = new Shader('vertexShader','originalFragmentShader');
    //thresholdShader = new Shader('vertexShader','thresholdFragmentShader');
    //blurShader      = new Shader('vertexShader','blurFragmentShader');
    edgeShader      = new Shader('vertexShader','edgeFragmentShader');
    //Flip image input along the Y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    //Create Model Texture
    modelTexture = gl.createTexture();
    //Create Model Image
    modelImage = new Image();
    modelImage.onload = function(){
        loadTexture(modelImage, modelTexture);
    }
    modelImage.crossOrigin ="anonymous";
    //Get the source of the model Image
    modelImage.src = "http://i.imgur.com/7thU1gD.jpg";

    //Create and set Color Texture
    colorTexture    = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture); //bind color texture
    //Provide a null texture image
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    //Nearest filtering selects nearest texels to the texture coordinate
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //Wrap the rendered image, and configure texture to clamp
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //Create & Set Depth Texture
    depthTexture    = gl.createTexture();
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);//bind depth texture
    //Provide a null texture image
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, framebufferWidth, framebufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
    //Nearest filtering selects nearest texels to the texture coordinate
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //Wrap the rendered image, and configure texture to clamp
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    //Create FrameBuffer and attach color and depth textures to it
    framebufferObject = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferObject);//bind frame buffer
    //Attach color and depth texture to frame buffer object
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depthTexture, 0);
    //Set frame buffer to null
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    canvas.onmousedown = onmousedown;
    canvas.onmouseup = onmouseup;
    canvas.onmousemove = onmousemove;
    //Request the browser to draw the object
    requestAnimationFrame(draw);
}
//Called repeatedly to render the object
function draw(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferObject); //bind the object
    gl.viewport(0, 0, framebufferWidth, framebufferHeight);//set view to HTML canvas size
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //Clear the buffer
    gl.enable(gl.DEPTH_TEST);//perform a depth test
    //Create the required Matrices
    var projectionMatrix = new Matrix4();
    var viewMatrix       = new Matrix4();
    var modelMatrix = new Matrix4();
    //Place the model
    projectionMatrix.perspective(45, 1, 1, 10);
    viewMatrix.translate(0, 0, -5);
    gl.clearColor(1.0, 1.0, 0.9, 1.0);//Set the background color
    //Rotate Along x and y axis and translate on xaxis
    modelMatrix.rotate(modelRotationX, 1, 0, 0);
    //modelMatrix.rotate(modelRotationY, 0, 1, 0);

    modelMatrix.translate(0, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, modelTexture);
	lightingShader.use(projectionMatrix, viewMatrix, modelMatrix,lX,lY, lZ);
	chestModel.draw(lightingShader);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.clearColor(0,0,0,0); //G
	gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    if (otherShader == 1){
        gl.useProgram(edgeShader.program);
        squareModel.draw(edgeShader);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
}
//Load the texture of the image
function loadTexture(image, texture){
    //Bind texture data
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //Write image data to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    //Nearest filtering selects nearest texels to the texture coordinate
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    //Request the browser to draw the object
    requestAnimationFrame(draw);
}
//Set up sliders on the canvas
function slider(){
    //outputs a string, and assign a number to it
    var lightPosX = parseFloat(document.getElementById("lightingInX").value);
    var lightPosY = parseFloat(document.getElementById("lightingInY").value);
    var lightPosZ = parseFloat(document.getElementById("lightingInZ").value);
    //Update input values
    document.getElementById("lightingOutX").innerHTML = lightPosX;
    document.getElementById("lightingOutY").innerHTML = lightPosY;
    document.getElementById("lightingOutZ").innerHTML = lightPosZ;
    //Request the browser to draw the object
    requestAnimationFrame(draw);
}
//Flattens the input arrays for rendering
function flatten(a){
    //Returns input arrays in a new flattend array
    return a.reduce(function (b, v) { b.push.apply(b, v); return b }, []);
}
//Track recent location of movement of the mouse
function onmousedown(event){
    dragging = true;
    // x-coordinate of the mouse pointer in local DOM coordinates
    lastClientX = event.clientX;
    // y-coordinate of the mouse pointer in local DOM coordinates
    lastClientY = event.clientY;
}
//Stop tracking mouse
function onmouseup(event){
    //Set the dragging of the mouse to false
    dragging = false;
}
//Change orientation of the mouse
function onmousemove(event){
    if (dragging){
        //Set the the orientation of the mouse on X and Y axis
        var dX = event.clientX - lastClientX;
        var dY = event.clientY - lastClientY;
        modelRotationY = modelRotationY + dX;
        modelRotationX = modelRotationX + dY;
        // Limit the rotation.
        if (modelRotationX > 90.0)
        modelRotationX = 90.0;
        if (modelRotationX < -90.0)
        modelRotationX = -90.0;
        //Request the browser to draw the object
        requestAnimationFrame(draw);
    }
    //Set x and y coordinates of the mouse pointer in local DOM coordinates
    lastClientX = event.clientX;
    lastClientY = event.clientY;
}
//Set radio buttons on the canvas
function radiobuttons(){
    //Set Shader to post processing effects
    otherShader = document.getElementById("otherShader");
    //var original = document.getElementById("original");
    var edge = document.getElementById("edge");
    if(edge.checked){
        otherShader.innerHTML = 'edge';
        othershader = 1;
    requestAnimationFrame(draw);
}
