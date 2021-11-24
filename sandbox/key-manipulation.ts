import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import * as readline from "readline";
import {sleep} from "node-mavlink";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
readline.emitKeypressEvents(process.stdin);


(async function main() {
  await drone.onReady();

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();

  console.log(drone.globalPosition.value);

  if (drone.globalPosition.value.relativeAlt < 10) {
    await drone.takeoff(50);
    await sleep(20000);
  }


  if (process.stdin.isTTY)
    process.stdin.setRawMode(true);

  process.stdin.on('keyup', (chunk, key) => {
    console.log(key);
  });

  process.stdin.on('keypress', (chunk, key) => {

    if (key.name === 'w') {
      drone.goToDirection(10, 0, 0, 0);
    } else if (key.name === 's') {
      drone.goToDirection(-10, 0, 0, 0);
    } else if (key.name === 'a') {
      drone.goToDirection(0, -10, 0, 0);
    } else if (key.name === 'd') {
      drone.goToDirection(0, 10, 0, 0);
    } else if (key.name === 'q') {
      drone.goToDirection(0, 0, 0, -1);
    } else if (key.name === 'e') {
      drone.goToDirection(0, 0, 0, 1);
    } else if (key.name === '8') {
      drone.goToDirection(0, 0, 1, 0);
    } else if (key.name === '2') {
      drone.goToDirection(0, 0, -1, 0);
    }


    if (key && key.name == 'c')
      process.exit();
  });


})();
