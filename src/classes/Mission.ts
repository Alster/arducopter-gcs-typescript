import {Mavlink} from "./Mavlink";
import * as fs from 'fs';
import * as path from 'path';
import {common} from "node-mavlink";
import {BehaviorSubject, filter, firstValueFrom, lastValueFrom, Subject, Subscription} from "rxjs";

export class Mission {
  public readonly currentWaypoint$: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly waypointReached$: Subject<number> = new Subject();
  public readonly missionComplete$: Subject<void> = new Subject();

  public get commandsCount() {
    return this.commands.length ? this.commands.length - 1 : 0;
  }

  private commands: common.MissionItemInt[];
  private subMissionRequest?: Subscription;
  private subMissionCurrent?: Subscription;
  private subMissionItemReached?: Subscription;

  constructor(
    private readonly mavlink: Mavlink,
  ) {
  }

  public loadFromFile(filePath: string): void {
    const resolvedFilePath = path.resolve(filePath);
    const data = fs.readFileSync(resolvedFilePath, 'utf8');
    const rows = data
      .split('\n')
      .slice(1)
      .map(r => r.trim())
      .filter(r => r)
      .map(r => r.split('\t'));
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

  public async waitForComplete(): Promise<void> {
    await firstValueFrom(this.missionComplete$);
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
    this.subMissionItemReached = this.mavlink.messagesByType(common.MissionItemReached).subscribe(async msg => {
      this.waypointReached$.next(msg.seq);
      if (msg.seq < this.commandsCount) return;
      this.missionComplete$.next();
      this.subMissionCurrent.unsubscribe();
      this.subMissionCurrent = null;
      this.subMissionItemReached.unsubscribe();
      this.subMissionItemReached = null;
    });
  }

  private async uploadCommand(command: common.MissionItemInt): Promise<void> {
    await this.mavlink.send(command);
  }
}
