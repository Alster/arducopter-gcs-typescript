import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {Mission} from "../src/classes/Mission";
import {minimal, common, ardupilotmega, waitFor} from "node-mavlink";
import {FlightMode} from "../src";
import {firstValueFrom} from "rxjs";
import {sleep} from "mavlink-mappings";
import {MavModeFlag} from "mavlink-mappings/lib/minimal";

//-35.363261 149.165237
//-35.36323724 149.16454692
//-35.36277309 149.16472986

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
const missionToClient = new Mission(drone);
missionToClient.loadFromFile('./goToClient.waypoints');
const missionToBase = new Mission(drone);
missionToBase.loadFromFile('./goToBase.waypoints');

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

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();
  await drone.setSpeed(500);
  await drone.takeoff(10);
  await drone.waitForAltitude(10);

  await missionToClient.upload();
  await drone.setMode(FlightMode.AUTO);
  await missionToClient.waitForComplete();
  console.log(`MISSION TO CLIENT COMPLETE`)

  await drone.setMode(FlightMode.LAND);
  await drone.waitForBaseModeOff(minimal.MavModeFlag.SAFETY_ARMED);

  console.log(`Waiting when client zabere svou dostavku`)
  await sleep(5000);
  console.log(`... vse esche zhdem`)
  await sleep(2000);
  console.log(`... kakoy zhe tupoy client ...`)
  await sleep(2000);
  console.log(`oooooo! Vzletaem!`)
  await sleep(2000);
  console.log(`GO!`)
  await sleep(1000);

  await drone.setMode(FlightMode.GUIDED);
  await drone.arm();
  await drone.takeoff(10);
  await drone.waitForAltitude(10);

  await missionToBase.upload();
  await drone.setMode(FlightMode.AUTO);
  await missionToBase.waitForComplete();
  console.log(`MISSION TO BASE COMPLETE`)

  await drone.setMode(FlightMode.LAND);
  await drone.waitForBaseModeOff(minimal.MavModeFlag.SAFETY_ARMED);
  console.log(`-= FINITA LA STUPEDIA =-`)

})();
