import {Mavlink} from "../Mavlink";
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

  public get commandsList() {
    return this.commands;
  }

  private subMissionRequest?: Subscription;
  private subMissionCurrent?: Subscription;
  private subMissionItemReached?: Subscription;

  constructor(
    private readonly mavlink: Mavlink,
    private readonly commands: common.MissionItemInt[],
  ) {
  }

  public async clear(): Promise<void> {
    await this.sendMissionClear()
    await firstValueFrom(this.mavlink.firstMessagesByType(common.MissionAck));
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

  private async sendMissionClear(): Promise<void> {
    const msg = new common.MissionClearAll();
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
