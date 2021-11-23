import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import * as readline from "readline";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
readline.emitKeypressEvents(process.stdin);


(async function main() {
  await drone.onReady();

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();


  if (process.stdin.isTTY)
    process.stdin.setRawMode(true);

  process.stdin.on('keypress', (chunk, key) => {

    if (key.name === 'w') {
      drone.setPositionTargetGlobalVxVyVz(10, 0, 0, 0);
    } else if (key.name === 's') {
      drone.setPositionTargetGlobalVxVyVz(-10, 0, 0, 0);
    } else if (key.name === 'a') {
      drone.setPositionTargetGlobalVxVyVz(0, -10, 0, 0);
    } else if (key.name === 'd') {
      drone.setPositionTargetGlobalVxVyVz(0, 10, 0, 0);
    }


    if (key && key.name == 'q')
      process.exit();
  });


})();
