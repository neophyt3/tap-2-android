/* eslint-disable */
/* global URL */

const io = require('socket.io-client');
const socket = io.connect('http://localhost:8000');

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

let ok = document.getElementById('ok');
ok.addEventListener('click', function(ev) {
  console.log(ev);
    socket.emit('userInput', 'ok');
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

let canvas = document.getElementById('canvas');
let ctx;

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
