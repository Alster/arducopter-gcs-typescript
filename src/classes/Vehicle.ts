import {Mavlink} from "./Mavlink";
import {common} from "node-mavlink";
import {MavlinkSoc} from "../types/MavlinkSoc";
import {BehaviorSubject, filter, firstValueFrom} from "rxjs";

export class Vehicle extends Mavlink {
  globalPosition: BehaviorSubject<common.GlobalPositionInt> = new BehaviorSubject<common.GlobalPositionInt>(null);

  constructor(socket: MavlinkSoc) {
    super(socket);

    this.messagesByType(common.GlobalPositionInt).subscribe(position => {
      this.globalPosition.next(position);
    });
  }

  get timeBootMs(): number {
    return this.globalPosition.value.timeBootMs;
  }

  get lat(): number {
    return this.globalPosition.value.lat;
  }

  get lon(): number {
    return this.globalPosition.value.lon;
  }

  get alt(): number {
    return this.globalPosition.value.alt;
  }

  get relativeAlt(): number {
    return this.globalPosition.value.relativeAlt;
  }

  async onReady(): Promise<void> {
    await Promise.all([
        super.onReady(),
        firstValueFrom(this.globalPosition.pipe(filter(p => !!p)))
      ]
    );
  }

}
