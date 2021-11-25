import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import {sleep} from "node-mavlink";
import iohook from "iohook";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


(async function main() {
  await drone.onReady();

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();

  if (drone.globalPosition.value.relativeAlt < 10) {
    await drone.takeoff(50);
    await sleep(20000);
  }

  const keys = {
    17: false, //w
    31: false, //s
    30: false, //a
    32: false, //d
    16: false, //q
    18: false, //e
  };


  iohook.on('keydown', (event: any) => {
    keys[event.keycode] = true;
  });

  iohook.on('keyup', (event: any) => {
    keys[event.keycode] = false;
  });

  iohook.start();


  while (true) {
    let x = 0;
    let y = 0;
    let z = 0;

    if (keys[17]) {
      x = 10;
    } else if (keys[31]) {
      x = -10;
    }

    if (keys[30]) {
      y = -10;
    } else if (keys[32]) {
      y = 10;
    }

    if (keys[16]) {
      z = 10;
    } else if (keys[18]) {
      z = -10;
    }

    console.log(drone.globalPosition.value);
    drone.goToDirection(x, y, z, 0);
    await sleep(10);
  }

})();
