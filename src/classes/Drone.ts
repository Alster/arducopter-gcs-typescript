import {FlightMode} from "../enums/ardupilot/FlightMode";
import {common, waitFor} from "node-mavlink";
import {Vehicle} from "./Vehicle";


export class Drone extends Vehicle {

  get mode(): FlightMode {
    return this.heartbeat.value.customMode as FlightMode;
  }

  get hasArmed(): boolean {
    return (this.heartbeat.value.baseMode as number) === 217;
  }

  async setMode(mode: FlightMode): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.DO_SET_MODE;
    msg.param1 = 81;
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

  private async armControl(state: boolean): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.COMPONENT_ARM_DISARM;
    msg.param1 = state ? 1 : 0;
    await this.sendAndWait(msg);
  }

}
