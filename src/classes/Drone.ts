import {FlightMode} from "../enums/ardupilot/FlightMode";
import {common} from "node-mavlink";
import {Vehicle} from "./Vehicle";


export class Drone extends Vehicle {
    mode: FlightMode;


    async setMode(mode: FlightMode): Promise<void> {
	   const msg = new common.SetMode();
	   // msg.baseMode = 81;
	   msg.customMode = mode;
	   await this.sendAndWait(msg);
	   console.debug(`Success change mode: ${FlightMode[mode]}`);
    }

}
