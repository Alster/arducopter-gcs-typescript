import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
(async function main() {
  await drone.onReady();

  drone.globalPosition.subscribe(p => {
    // console.log(p.alt/1000);
  });

  process.stdin.on('data', async (data) => {
    const event = data.toString().trim();
    if (event == 'up') {
      await drone.setMode(FlightMode.GUIDED);
      await drone.arm();
      await drone.takeoff(30);
    } else if (event == 't') {
      // await drone.setPositionTarget();
    } else if (event == 'down') {
      await drone.setMode(FlightMode.LAND);
    }
  })
})();
