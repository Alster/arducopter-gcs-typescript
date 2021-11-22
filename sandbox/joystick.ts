import {common, minimal} from "mavlink-mappings";
import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {sleep} from "node-mavlink";
import { getDistance } from 'geolib';
import {GeolibGeoJSONPoint} from "geolib/es/types";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
(async function main() {
  await drone.onReady();

  // const targetPos: GeolibGeoJSONPoint = [63.985798, -22.623029];
  //
  // getDistance(drone.position, targetPos);

  await drone.setSpeed(99);
  drone.goToLocalPosition(10, 0, 0);

  // while (true){
  //   drone.goToTargetLocal(5, 5, 0, 100);
  //   await sleep(100);
  // }

})();
