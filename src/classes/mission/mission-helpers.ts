import path from "path";
import fs from "fs";
import {common} from "node-mavlink";
import {GeolibGeoJSONPoint} from "geolib/es/types";
import {Mavlink} from "../Mavlink";
import {Mission} from "./Mission";

export namespace MissionHelpers {

  export function waypointToCoord(c: common.MissionItemInt): GeolibGeoJSONPoint {
    return [c.x / 1e7, c.y / 1e7, c.z];
  }

  export function coordToWaypoint(coord: GeolibGeoJSONPoint, seq = 0): common.MissionItemInt {
    const msg = new common.MissionItemInt();
    msg.seq = seq;
    msg.current = 0;
    msg.frame = common.MavFrame.GLOBAL_RELATIVE_ALT;
    msg.command = common.MavCmd.NAV_WAYPOINT;
    msg.param1 = 0;
    msg.param2 = 0;
    msg.param3 = 0;
    msg.param4 = 0;
    msg.x = Math.round(+coord[0] * 1e7);
    msg.y = Math.round(+coord[1] * 1e7);
    msg.z = +coord[2];
    msg.autocontinue = 1;
    return msg;
  }

  //#region Loaders
  export function fromCoords(from: GeolibGeoJSONPoint, to: GeolibGeoJSONPoint, middlePoints: GeolibGeoJSONPoint[] = []): common.MissionItemInt[] {
    const res: common.MissionItemInt[] = [];
    let seq = 0;

    //home pos
    const home = coordToWaypoint(from, seq);
    home.frame = common.MavFrame.GLOBAL;
    res.push(home)
    seq++;

    //start pos
    res.push(coordToWaypoint(from, seq));
    seq++;

    //middle positions
    middlePoints.forEach(p => {
      res.push(coordToWaypoint(p, seq));
      seq++;
    });

    //target pos
    res.push(coordToWaypoint(to, seq));
    return res;
  }

  export function fromFile(filePath: string): common.MissionItemInt[] {
    const resolvedFilePath = path.resolve(filePath);
    const data = fs.readFileSync(resolvedFilePath, 'utf8');
    const rows = data
      .split('\n')
      .slice(1)
      .map(r => r.trim())
      .filter(r => r)
      .map(r => r.split('\t'));
    return rows.map(r => r.map(i => +i)).map(r => {
      const [seq, currentWP, frame, command, p1, p2, p3, p4, x, y, z, autoContinue] = r;
      const msg = new common.MissionItemInt();
      msg.seq = seq;
      msg.current = currentWP;
      msg.frame = frame;
      msg.command = command;
      msg.param1 = p1;
      msg.param2 = p2;
      msg.param3 = p3;
      msg.param4 = p4;
      msg.x = Math.round(x * 1e7);
      msg.y = Math.round(y * 1e7);
      msg.z = z;
      msg.autocontinue = autoContinue;
      return msg;
    });
  }

  export function toFile(filePath: string, commands: common.MissionItemInt[]): void {
    const resolvedFilePath = path.resolve(filePath);

    const data = commands
      .map(c => [c.seq, c.current, c.frame, c.command, c.param1, c.param2, c.param3, c.param4, c.x / 1e7, c.y / 1e7, c.z, c.autocontinue])
      .map(c => c.join('\t'))
      .join('\n');

    fs.writeFileSync(resolvedFilePath, `QGC WPL 110\n` + data);
  }

  //#endregion
}
