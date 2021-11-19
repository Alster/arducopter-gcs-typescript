import {FlightMode} from "../enums/ardupilot/FlightMode";
import {common, minimal, sleep} from "node-mavlink";
import {Vehicle} from "./Vehicle";


export class Drone extends Vehicle {
  mode: FlightMode;
  lat: number;
  lon: number;
  alt: number;
  timeBootMs: number;

  protected onInitialized(){
    super.onInitialized();

    this.messagesByType(minimal.Heartbeat).subscribe(packet => {
      this.mode = packet.customMode;
    })
    this.messagesByType(common.GlobalPositionInt).subscribe(packet => {
      this.lat = packet.lat;
      this.lon = packet.lon;
      this.alt = packet.alt;
      this.timeBootMs = packet.timeBootMs;
    })
  }

  async setMode(mode: FlightMode): Promise<void> {
    const msg = new common.CommandLong();
    msg.command = common.MavCmd.DO_SET_MODE;
    msg.param1 = 81;
    msg.param2 = mode;
    await this.sendAndWait(msg);
  }

  async arm(): Promise<void> {
    await this.armControl(true);
  }

  async disarm(): Promise<void> {
    await this.armControl(true);
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
    msg.alt = this.alt + 10;

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
