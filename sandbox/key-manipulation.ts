import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import {sleep} from "node-mavlink";
import iohook from "iohook";


const X_Y_FORCE: number = 10;
const Z_FORCE: number = 10;
const YAW_FORCE: number = .5;

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


let lastMoveIsEmpty: boolean = true;
(async function main() {
  await drone.onReady();

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();

  if (drone.globalPosition.value.relativeAlt < 10) {
    await drone.takeoff(10);
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
      x = X_Y_FORCE;

    } else if (keys[31]) {
      x = -(X_Y_FORCE);
    }

    if (keys[30]) {
      y = -(X_Y_FORCE);
    } else if (keys[32]) {
      y = X_Y_FORCE;
    }

    if (keys[16]) {
      z = Z_FORCE;
    } else if (keys[18]) {
      z = -(Z_FORCE);
    }

    if (keys[61003]) {
      yawRate = -(YAW_FORCE);
    } else if (keys[61005]) {
      yawRate = (YAW_FORCE);
    }

    // console.log(drone.globalPosition.value);

    if (x || y || yawRate || z || !lastMoveIsEmpty) {
      drone.goToLocalPosition(x, y, z, yawRate);
      lastMoveIsEmpty = !x && !y && !yawRate && !z;
    }

    await sleep(10);
  }

})();
