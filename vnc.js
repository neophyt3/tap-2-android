const EventEmitter = require('events');
const util = require('util');
const rfb = require('rfb2');
const fs = require('fs');
const Canvas = require('canvas');

function VNC(host, port) {
  EventEmitter.call(this);
  this.host = host;
  this.port = port;
  this.displayNum = port - 5902; // Android Emulator VNC port
  this.state = [];
  this.width = 800;
  this.height = 600;

  this.r = rfb.createConnection({
    host,
    port
  });

  this.r.on('connect', () => {
    console.log('successfully connected to VNC!');
    console.log(`Remote screen name: ${this.r.title}, Width:
    ${this.r.width}, Height: ${this.r.height}`);
  });

  this.r.on('rect', this.drawRect.bind(this));
}

util.inherits(VNC, EventEmitter);

VNC.prototype.drawRect = function(rect) {
  if (rect.encoding === undefined) {
    return;
  } else if (rect.encoding === rfb.encodings.copyRect) {
    console.log('copy', rect.src)
    this.emit('copy', rect);
    return;
  } else if (rect.encoding === rfb.encodings.raw) {
    console.log('raw: ', rect.x, rect.y, rect.width, rect.height, rect.data);
    console.log('rect', rect)


    this.emit('raw', {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      data: rect.data,
      redShift: this.r.redShift,
      blueShift: this.r.blueShift,
      greenShift: this.r.greenShift
    });
  }
};

module.exports = VNC;

// emulator -avd Nexus_5_API_23 -no-window -qemu -vnc :2
// sudo lsof -i -n -P | grep TCP
// adb kill-server
// docker inspect --format '{{ .NetworkSettings.IPAddress }}'
// clean all containers: docker ps -a | sed '1 d' | awk '{print $1}' | xargs -L1 docker rm
// clean all images: docker images -a | sed '1 d' | awk '{print $3}' | xargs -L1 docker rmi -f
// run arbitrary commands inside an existing container: docker exec -it <mycontainer> bash
// https://wiki.archlinux.org/index.php/QEMU#Mouse_integration
// https://github.com/aikinci/droidbox/blob/master/install-fastdroid-vnc.sh
