import {FlightMode} from "../enums/ardupilot/FlightMode";
import {common, waitFor} from "node-mavlink";
import {Vehicle} from "./Vehicle";
import {GeolibGeoJSONPoint} from "geolib/es/types";


export class Drone extends Vehicle {

  get mode(): FlightMode {
    return this.heartbeat.value.customMode as FlightMode;
  }

  get hasArmed(): boolean {
    return (this.heartbeat.value.baseMode as number) === 217;
  }

  get position(): GeolibGeoJSONPoint {
    return [this.globalPosition.value.lat / 1e7, this.globalPosition.value.lon / 1e7];
  }

  async setMode(mode: FlightMode): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.DO_SET_MODE;
    msg.param1 = this.heartbeat.value.baseMode;
    msg.param2 = mode;
    await this.sendAndWait(msg);
    await waitFor(() => this.mode === mode);
  }

  async arm(): Promise<void> {
    await this.armControl(true);
    await waitFor(() => this.hasArmed);
  }

  async disarm(): Promise<void> {
    await this.armControl(false);
    await waitFor(() => !this.hasArmed);
  }

  async takeoff(altitude: number): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.NAV_TAKEOFF;
    msg.param7 = altitude;
    await this.sendAndWait(msg);
  }


  /**
   * Не работает в GUIDED режиме, не тестировали
   * @param lat
   * @param lon
   * @param alt
   */
  async navWaypoint(lat: number, lon: number, alt: number): Promise<void> {
    const cmd = new common.CommandLong();
    cmd.command = common.MavCmd.NAV_WAYPOINT;
    cmd.param1 = 0;
    cmd.param2 = 0;
    cmd.param3 = 0;
    cmd.param4 = 0;
    cmd.param5 = lat;
    cmd.param6 = lon;
    cmd.param7 = alt;
    await this.sendAndWait(cmd);
  }

  /**
   * Начинает посадку сразу, не летит в указанные координаты
   * @param lat
   * @param lon
   */
  async navLand(lat: number, lon: number): Promise<void> {
    const cmd = new common.CommandLong();
    cmd.command = common.MavCmd.NAV_LAND;
    cmd.param1 = 0;
    cmd.param2 = 0;
    cmd.param3 = 0;
    cmd.param4 = 0;
    cmd.param5 = lat;
    cmd.param6 = lon;
    cmd.param7 = 0;
    await this.sendAndWait(cmd);
  }

  // Гля, приклади на пітоні https://www.ardusub.com/developers/pymavlink.html
  async setPositionTarget(): Promise<void> {
    const msg = new common.SetPositionTargetGlobalInt();
    msg.timeBootMs = this.timeBootMs + 1000;

    msg.latInt = this.lat + 10;
    msg.lonInt = this.lon + 10;
    msg.alt = (this.alt / 1000) + 10;

    msg.vx = 0;
    msg.vy = 0;
    msg.vz = 0;

    msg.afx = 0;
    msg.afy = 0;
    msg.afz = 0;

    msg.yaw = 0;
    msg.yawRate = 0;

    msg.coordinateFrame = common.MavFrame.GLOBAL_INT;

    msg.typeMask =
      common.PositionTargetTypemask.VX_IGNORE |
      common.PositionTargetTypemask.VY_IGNORE |
      common.PositionTargetTypemask.VZ_IGNORE |
      common.PositionTargetTypemask.AX_IGNORE |
      common.PositionTargetTypemask.AY_IGNORE |
      common.PositionTargetTypemask.AZ_IGNORE |
      common.PositionTargetTypemask.YAW_IGNORE |
      common.PositionTargetTypemask.YAW_RATE_IGNORE;

    await this.sendAndWait(msg);
  }

  goToLocalPosition(x: number, y: number, z: number, yawRate: number = 0): void {
    const msg = new common.SetPositionTargetLocalNed();

    msg.x = x;
    msg.y = y;
    msg.z = z;

    msg.yaw = yawRate;

    msg.coordinateFrame = common.MavFrame.BODY_NED;

    msg.typeMask =
      common.PositionTargetTypemask.VX_IGNORE |
      common.PositionTargetTypemask.VY_IGNORE |
      common.PositionTargetTypemask.VZ_IGNORE |

      common.PositionTargetTypemask.AX_IGNORE |
      common.PositionTargetTypemask.AY_IGNORE |
      common.PositionTargetTypemask.AZ_IGNORE |
      common.PositionTargetTypemask.YAW_RATE_IGNORE;

    // common.PositionTargetTypemask.YAW_IGNORE;

    void this.send(msg);
  }

  goToDirection(x: number, y: number, z: number, yawRate: number): void {
    const msg = new common.SetPositionTargetLocalNed();

    msg.vx = x;
    msg.vy = y;
    msg.vz = z;

    msg.yawRate = yawRate;

    msg.coordinateFrame = common.MavFrame.LOCAL_FLU;

    msg.typeMask =
      common.PositionTargetTypemask.X_IGNORE |
      common.PositionTargetTypemask.Y_IGNORE |
      common.PositionTargetTypemask.Z_IGNORE |

      common.PositionTargetTypemask.AX_IGNORE |
      common.PositionTargetTypemask.AY_IGNORE |
      common.PositionTargetTypemask.AZ_IGNORE;

    void this.send(msg);
  }

  async setSpeed(metersPerSecond: number): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.DO_CHANGE_SPEED;
    //Air speed
    msg.param1 = 0;
    msg.param2 = metersPerSecond;
    await this.sendAndWait(msg);
  }

  private async armControl(state: boolean): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.COMPONENT_ARM_DISARM;
    msg.param1 = state ? 1 : 0;
    await this.sendAndWait(msg);
  }

}
