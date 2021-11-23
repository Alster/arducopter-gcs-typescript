import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";
import {sleep} from "mavlink-mappings";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


(async function main() {
  await drone.onReady();

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();
  await drone.takeoff(10);
  await sleep(20000);
  await drone.setPositionTargetGlobalLatLon(63.985442, -22.631203, 30);

})();
