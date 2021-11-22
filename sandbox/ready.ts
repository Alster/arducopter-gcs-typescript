import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {sleep} from "mavlink-mappings";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


(async function main() {


  await drone.onReady();
  console.log('first ready');


  drone.heartbeat.subscribe(data => {
    console.log('>>>>>', data);
  });

  console.log('sleep 5');
  await sleep(5000);
  console.log('end sleep 5');
  await drone.onReady();
  console.log('second ready');
})();
