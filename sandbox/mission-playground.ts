import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {Mission} from "../src/classes/Mission";
import { minimal, common, ardupilotmega } from "node-mavlink";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));

const ignoreClasses = [
  common.BatteryStatus,
  common.Vibration,
  common.LocalPositionNed,
  ardupilotmega.EkfStatusReport,
  common.TerrainReport,
  ardupilotmega.HwStatus,
  ardupilotmega.Ahrs2,
  common.SimState,
  common.SystemTime,
  ardupilotmega.Ahrs,
  common.GpsRawInt,
  common.ScaledPressure2,
  common.ScaledPressure,
  common.ScaledImu3,
  common.ScaledImu2,
  common.RawImu,
  common.RcChannels,
  common.ServoOutputRaw,
  common.VfrHud,
  common.NavControllerOutput,
  ardupilotmega.MemInfo,
  common.PowerStatus,
  common.SysStatus,
  common.GlobalPositionInt,
  common.Attitude,
  ardupilotmega.SimState,
  minimal.Heartbeat,
  common.TimeSync,
  common.MissionCurrent,
  common.MissionAck,
  common.StatusText,
  //
  common.MissionRequest,
];

(async function main() {
  await drone.onReady();
  console.log(`Drone ready`);

  drone.data.subscribe(d => {
    if (ignoreClasses.some(c => (d instanceof c))) return;
    console.dir(d);
  });

  // await drone.setMode(FlightMode.GUIDED);
  // await drone.arm();

  const mission = new Mission(drone);
  await mission.loadFromFile('./Test.waypoints');
  await mission.upload();
  mission.currentWaypoint$.subscribe(v => {
    console.log(`CURRENT WAYPOINT: ${v}`);
  });

})();
