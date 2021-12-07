import {Mission} from "./Mission";
import {Mavlink} from "../Mavlink";
import {BehaviorSubject, switchMap, Subject} from "rxjs";
import {getDistance, getPathLength} from "geolib";
import {common} from "node-mavlink";
import {Drone} from "../Drone";
import {GeolibGeoJSONPoint} from "geolib/es/types";
import {MissionHelpers} from "./mission-helpers";

interface DistanceProgress {
  dist: number;
  percentage: number;
}

export class DistanceMissionTracker {

  readonly progress$: BehaviorSubject<DistanceProgress> = new BehaviorSubject({
    dist: 0,
    percentage: 0,
  });

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
        clearInterval(this.checkInterval);
        this.progress$.complete();
        return;
      } else if (this.seq === 1) {
        this.checkInterval = setInterval(() => {
          const currentPos: GeolibGeoJSONPoint = [this.mavlink.globalPosition.value.lat / 1e7, this.mavlink.globalPosition.value.lon / 1e7];
          const reached = mission.commandsList[this.seq];
          const neighborPointsDist = getDistance(MissionHelpers.waypointToCoord(reached), currentPos);
          const distanceComplete = this.lastWaypointDist + neighborPointsDist;
          const percentage = ((distanceComplete / this.totalDist)) * 100;
          this.progress$.next({
            dist: Math.round(distanceComplete),
            percentage: Math.round(percentage),
          });
        }, 1000);
      }
    });
  }

  private getCommandsDistance(commands: common.MissionItemInt[]): number {
    return getPathLength(commands.map(c => MissionHelpers.waypointToCoord(c)));
  }

}
