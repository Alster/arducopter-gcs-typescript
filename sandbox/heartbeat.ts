import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {minimal} from "node-mavlink";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));


(async function main() {
  await drone.onReady();

  drone.heartbeat.subscribe(data => {
    console.log(`------------Heartbeat------------------`)
    console.log(`type: ${minimal.MavType[data.type]}`);
    console.log(`autopilot: ${minimal.MavAutopilot[data.autopilot]}`);
    console.log(`baseMode: ${minimal.MavModeFlag[data.baseMode] || data.baseMode}`);
    console.log(`customMode: ${data.customMode}`);
    console.log(`systemStatus: ${minimal.MavState[data.systemStatus]}`);
    console.log(`mavlinkVersion: ${data.mavlinkVersion}`);
    console.log(`armed: ${drone.hasArmed}`);
  });

})();
