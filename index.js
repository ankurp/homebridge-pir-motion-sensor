const gpio = require('rpi-gpio');
gpio.setMode(gpio.MODE_BCM);

let Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-motion-sensor', 'Motion Sensor', MotionSensor);
};

class MotionSensor {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.pirPin = config.pirPin;
    this.motionDetected = false;
  }

  identify(callback) {
    this.log('Identify requested!');
    callback(null);
  }

  getServices() {
    const informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Encore Dev Labs')
      .setCharacteristic(Characteristic.Model, 'Pi Motion Sensor')
      .setCharacteristic(Characteristic.SerialNumber, 'Raspberry Pi');

    this.service = new Service.MotionSensor(this.name);
    this.service
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', (callback) => {
        callback(null, this.motionDetected);
      });

    gpio.on('change', (channel, value) => {
      if (channel === this.pirPin) {
        this.motionDetected = value;
        this.service.setCharacteristic(Characteristic.MotionDetected, this.motionDetected);
      }
    });

    gpio.setup(this.pirPin, gpio.DIR_IN, gpio.EDGE_BOTH, () => {
      gpio.read(this.pirPin, (err, value) => {
        if (err) {
          console.error(err); // eslint-disable-line no-console
          return;
        }

        this.motionDetected = value;
      });
    });

    this.service
      .getCharacteristic(Characteristic.Name)
      .on('get', callback => {
        callback(null, this.name);
      });

    return [informationService, this.service];
  }
}
