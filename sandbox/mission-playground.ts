import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import {sleep} from "node-mavlink";
import iohook from "iohook";
import {Mission} from "../src/classes/Mission";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


(async function main() {
  await drone.onReady();
  console.log(`Drone ready`);

  // await drone.setMode(FlightMode.GUIDED);
  // await drone.arm();

  const mission = new Mission();
  await mission.loadFromFile('./Test.waypoints');
  await mission.uploadTo(drone);


})();
