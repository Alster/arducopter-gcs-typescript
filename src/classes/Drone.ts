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
    return [this.globalPosition.value.lat, this.globalPosition.value.lon];
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

  goToLocalPosition(x: number, y: number, z: number): void {
    const msg = new common.SetPositionTargetLocalNed();

    msg.x = x;
    msg.y = y;
    msg.z = z;

    msg.yawRate = 0;

    msg.coordinateFrame = common.MavFrame.BODY_NED;

    msg.typeMask =
      common.PositionTargetTypemask.VX_IGNORE |
      common.PositionTargetTypemask.VY_IGNORE |
      common.PositionTargetTypemask.VZ_IGNORE |

      common.PositionTargetTypemask.AX_IGNORE |
      common.PositionTargetTypemask.AY_IGNORE |
      common.PositionTargetTypemask.AZ_IGNORE |

      common.PositionTargetTypemask.YAW_IGNORE;

    void this.send(msg);
  }

  goToDirection(x: number, y: number, z: number): void {
    const msg = new common.SetPositionTargetLocalNed();

    msg.vx = x;
    msg.vy = y;
    msg.vz = z;

    msg.yawRate = 0;

    msg.coordinateFrame = common.MavFrame.BODY_NED;

    msg.typeMask =
      common.PositionTargetTypemask.X_IGNORE |
      common.PositionTargetTypemask.Y_IGNORE |
      common.PositionTargetTypemask.Z_IGNORE |

      common.PositionTargetTypemask.AX_IGNORE |
      common.PositionTargetTypemask.AY_IGNORE |
      common.PositionTargetTypemask.AZ_IGNORE |

      common.PositionTargetTypemask.YAW_IGNORE;

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
