import {Mission} from "./Mission";
import {Mavlink} from "../Mavlink";
import {BehaviorSubject, Subject} from "rxjs";
import {getDistance, getPathLength} from "geolib";
import {common} from "node-mavlink";
import {Drone} from "../Drone";
import {GeolibGeoJSONPoint} from "geolib/es/types";
import {MissionHelpers} from "./mission-helpers";

export class DistanceMissionTracker {

  public readonly distanceCompletePercentage$: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly distanceComplete$: BehaviorSubject<number> = new BehaviorSubject(0);

  private totalDist = 0;
  private lastWaypointDist = 0;
  private seq = 0;
  private checkInterval;

  constructor(
    private readonly mavlink: Drone,
    private readonly mission: Mission,
  ) {
    this.totalDist = this.getCommandsDistance(mission.commandsList);

    this.mission.waypointReached$.subscribe(reachedWaypoint => {
      this.seq = reachedWaypoint;
      this.lastWaypointDist = this.getCommandsDistance(mission.commandsList.slice(0, this.seq + 1));
      if (this.seq === mission.commandsCount) {
        console.log(`Reached 100%`);
        clearInterval(this.checkInterval);
        this.distanceCompletePercentage$.complete();
        this.distanceComplete$.complete();
        return;
      } else if (this.seq === 1) {
        this.checkInterval = setInterval(() => {
          const currentPos: GeolibGeoJSONPoint = [this.mavlink.globalPosition.value.lat / 1e7, this.mavlink.globalPosition.value.lon / 1e7];
          const reached = mission.commandsList[this.seq];
          const neighborPointsDist = getDistance(MissionHelpers.waypointToCoord(reached), currentPos);
          const distanceComplete = this.lastWaypointDist + neighborPointsDist;
          const percentage = ((distanceComplete / this.totalDist)) * 100;
          this.distanceCompletePercentage$.next(percentage);
          this.distanceComplete$.next(distanceComplete);
          console.log(percentage)
        }, 100);
      }
    });
  }

  private getCommandsDistance(commands: common.MissionItemInt[]): number {
    return getPathLength(commands.map(c => MissionHelpers.waypointToCoord(c)));
  }

}
