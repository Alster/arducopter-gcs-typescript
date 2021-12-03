import {Mavlink} from "./Mavlink";
import * as fs from 'fs';
import * as path from 'path';
import {common} from "node-mavlink";
import {BehaviorSubject, filter, firstValueFrom, lastValueFrom, Subscription} from "rxjs";

export class Mission {
  public currentWaypoint$: BehaviorSubject<number> = new BehaviorSubject(0);

  private commands: common.MissionItemInt[];
  private subMissionRequest?: Subscription;
  private subMissionCurrent?: Subscription;

  constructor(
    private readonly mavlink: Mavlink,
  ) {
  }

  public async loadFromFile(filePath: string): Promise<void>{
    const data = fs.readFileSync(path.resolve(filePath), 'utf8');
    const rows = data.split('\r\n').slice(1).filter(r => r).map(r => r.split('\t'));
    this.commands = rows.map(r => r.map(i => +i)).map(r => {
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

  public async upload(): Promise<void> {
    this.startTrackMissionStatus();
    this.subMissionRequest = this.mavlink.messagesByType(common.MissionRequest).subscribe(async msg => {
      await this.uploadCommand(this.commands[msg.seq]);
    });
    await this.sendMissionCount()
    await firstValueFrom(this.mavlink.firstMessagesByType(common.MissionAck));
    this.subMissionRequest.unsubscribe();
    this.subMissionRequest = null;
  }

  private async sendMissionCount(): Promise<void> {
    const msg = new common.MissionCount();
    msg.count = this.commands.length;
    await this.mavlink.send(msg);
  }

  private startTrackMissionStatus() {
    this.subMissionCurrent = this.mavlink.messagesByType(common.MissionCurrent).subscribe(async msg => {
      if (this.currentWaypoint$.value == msg.seq) return;
      this.currentWaypoint$.next(msg.seq);
    });
  }

  private async uploadCommand(command: common.MissionItemInt): Promise<void> {
    await this.mavlink.send(command);
  }
}
