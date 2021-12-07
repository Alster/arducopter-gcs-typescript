import {connect} from "net";
import {Drone} from "../src";
import {Mission} from "../src/classes/mission/Mission";
import {minimal, common, ardupilotmega, waitFor} from "node-mavlink";
import {GeolibGeoJSONPoint} from "geolib/es/types";
import {MissionHelpers} from "../src/classes/mission/mission-helpers";
import {DistanceMissionTracker} from "../src/classes/mission/distance.mission-tracker";
import {sleep} from "mavlink-mappings";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));

// missionToClient.add(MissionBuilder.fromFile('./goToClient.waypoints'));
// missionToBase.add(MissionBuilder.fromFile('./goToBase.waypoints'));

const FLIGHT_ALT = 10;

const coordBase: GeolibGeoJSONPoint = [63.98486065, -22.62659818, FLIGHT_ALT];
const coordClient: GeolibGeoJSONPoint = [63.98727310, -22.62469829, FLIGHT_ALT];

const missionToClient = new Mission(drone, MissionHelpers.fromCoords(coordBase, coordClient, [
  [63.98534992, -22.62454708, FLIGHT_ALT],
  [63.98641100, -22.62700416, FLIGHT_ALT],
]));
const missionToBase = new Mission(drone, MissionHelpers.fromCoords(coordClient, coordBase, [
  [63.98641100, -22.62700416, FLIGHT_ALT],
  [63.98534992, -22.62454708, FLIGHT_ALT],
]));

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
  common.StatusText,
  common.CommandAck,
  //mission
  common.MissionRequest,
  common.MissionCurrent,
  common.MissionAck,
  common.MissionItemReached,
  //flight
  ardupilotmega.EscTelemetry1To4,
  ardupilotmega.EscTelemetry5To8,
  common.PositionTargetGlobalInt,
];

(async function main() {
  await drone.onReady();

  drone.data.subscribe(d => {
    if (ignoreClasses.some(c => (d instanceof c))) return;
    // console.dir(d);
  });

  const tracker = new DistanceMissionTracker(drone, missionToClient);
  tracker.progress$.subscribe(p => console.dir(p));

  await drone.goFly(FLIGHT_ALT);
  await drone.setSpeed(500);

  await missionToClient.runMission();
  console.log(`MISSION TO CLIENT COMPLETE`)

  await drone.goLand();
  await sleep(1000);

  await drone.goFly(FLIGHT_ALT);
  await missionToBase.runMission();
  console.log(`MISSION TO BASE COMPLETE`)

  await drone.goLand();
  console.log(`-= FINITA LA STUPEDIA =-`)

})();
