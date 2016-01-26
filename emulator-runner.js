const forever = require('forever-monitor');

function startEmu() {
  var child = new (forever.Monitor)('emulator.js', {
      max: 1,
      silent: false,
      options: []
  });

  child.on('exit', function () {
    console.log('THE ANDROID EMULATOR DIED');
    setTimeout(function() {
      startEmu();
    }, 2000);
  });

  child.start();
}

startEmu();
