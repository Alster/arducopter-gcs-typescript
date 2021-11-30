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
    17: false, //w вперед
    31: false, //s назад
    30: false, //a влево
    32: false, //d вправо
    16: false, //q вверх
    18: false, //e вниз
    61003: false, // повернуться против часовой стрелки
    61005: false // повернуться за часовой стрелкой

  };


  iohook.on('keydown', (event: any) => {
    // console.log(event.keycode);
    // process.exit();
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
    let yawRate = 0;

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

    if (keys[61003]) {
      yawRate = -1;
    } else if (keys[61005]) {
      yawRate = 1;
    }

    // console.log(drone.globalPosition.value);
    drone.goToLocalPosition(x, y, z, yawRate);


    await sleep(10);
  }

})();
