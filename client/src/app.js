/* eslint-disable */
/* global URL */

const io = require('socket.io-client');
// NOTE: Needs to be updated to the external IP address of the machine the server runs on
const host = process.env.HOST || "localhost"
const port = process.env.PORT || "8000"
const socket = io.connect('http://' + host + ':' + port);

let canvas = document.getElementById('canvas');
let ctx;
var touchStart = [];
var touchEnd = [];
var touchMove = [];

canvas.addEventListener("touchstart", handleTouchStart, false);
canvas.addEventListener("touchend", handleTouchEnd, false);
canvas.addEventListener("touchcancel", handleTouchCancel, false);
canvas.addEventListener("touchmove", handleTouchMove, false);

function handleTouchStart(ev) {
  ev.preventDefault();
  let touches = ev.changedTouches;
  console.log('touch start', touches);

  touchStart.push(touches);
}

function handleTouchEnd(ev) {
  ev.preventDefault();
  let touches = ev.changedTouches;
  console.log('touch end', touches);

  touchEnd.push(touches);
  if (touchStart.length === 0) {
    return;
  }

  if (touchMove.length === 0) {
    socket.emit('touch', {'x': touches[0].clientX, 'y': touches[0].clientY});
    touchMove = [];
  } else {
    socket.emit('drag', {'startX': touchStart[0][0].clientX, 'startY': touchStart[0][0].clientY, 'endX': touches[0].clientX, 'endY': touches[0].clientY});
    touchMove = [];
  }
}

function handleTouchCancel(ev) {
  ev.preventDefault();
  let touches = ev.changedTouches;
  console.log('touch cancel', touches);
}

function handleTouchMove(ev) {
  ev.preventDefault();
  let touches = ev.changedTouches;
  console.log('touch move', touches);

  touchMove.push(touches);
}
// Below event handlers are just for testing purposes.
// Will be replaced
let menu = document.getElementById('menu');
menu.addEventListener('click', function() {
    socket.emit('userInput', 'menu');
});

let camera = document.getElementById('camera');
camera.addEventListener('click', function() {
    socket.emit('userInput', 'camera');
});

let messages = document.getElementById('messages');
messages.addEventListener('click', function() {
    socket.emit('userInput', 'messages');
});

let home = document.getElementById('home');
home.addEventListener('click', function() {
    socket.emit('userInput', 'home');
});

let web = document.getElementById('web');
web.addEventListener('click', function() {
    socket.emit('userInput', 'web');
});

let volumeUp = document.getElementById('volumeUp');
volumeUp.addEventListener('click', function() {
    socket.emit('userInput', 'volumeUp');
});

document.body.addEventListener('click', function(ev) {
  console.log(ev);
});


/*
  Socket.io client connection.

  We listen to rect events coming from our emulator's
  VNC server, then convert the raw buffer data for each
  rect to RGB format, and then paint each rect to canvas.
*/

socket.on('connect', () => {
  console.log('connection on client');
});


socket.on('firstFrame', function (imageData) {
  console.log('first frame');
  if (!imageData) {
    return;
  }

  // Set up canvas properties & context
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx = canvas.getContext('2d');

  // Paint imageData to canvas
  putImageOnCanvas(ctx, imageData);
});

socket.on('raw', function (imageData) {
  if (!imageData) {
    return;
  }

  // Set up canvas context
  ctx = canvas.getContext('2d');
  // Tranform canvas imageData

  // Paint imageData to canvas
  putImageOnCanvas(ctx, imageData);
});

socket.on('copy', function(rect){
  const canvasImageData = ctx.getImageData(rect.src.x, rect.src.y, rect.width, rect.height);
  ctx.putImageData(canvasImageData, rect.x, rect.y);
});

const putImageOnCanvas = (ctx, imageData) => {
  // Convert raw Array buffer to a data view, 0 byte offset
  var dataView = new DataView(imageData.data, 0);
  // Generate image data for canvas using width and height
  const canvasImageData = ctx.createImageData(imageData.width, imageData.height);
  let red, green, blue;
  /*
    We need to overwrite the canvasImageData.data value
    because it is expecting it to be 32bpp, but our
    data is 16bpp.

    For every 2 bytes (16 bits), we generate the current
    pixel containing 16 bits, little endian true.
    Then we apply the red/blue/green shift, then
    & the result by the red/green/blue max.
    Then divide this result (which is out of the max values)
    by the max value and multiply by 255 because putImageData
    is expecting canvasImageData.data values to be out of 255 :)
  */
  for (var i = 0; i < dataView.byteLength; i += 2) {
    let currentPixel = dataView.getInt16(i, true)
    red = (((currentPixel >> 11) & 31) / 31) * 255;
    green = (((currentPixel >> 5) & 63) / 63) * 255;
    blue = ((currentPixel & 31) / 31) * 255;

    canvasImageData.data[i*2 + 0] = red // R
    canvasImageData.data[i*2 + 1 ] = green // G
    canvasImageData.data[i*2 + 2] = blue // B
    canvasImageData.data[i*2 + 3] = 255; // A
  }

  ctx.putImageData(canvasImageData, imageData.x, imageData.y);
}
