import {
  common,
  MavEsp8266,
  MavLinkPacket,
  MavLinkPacketParser,
  MavLinkPacketSplitter,
  MavLinkProtocolV2,
  minimal,
  send
} from "node-mavlink";
import {MavLinkData, MavLinkDataConstructor} from "mavlink-mappings";
import {
  BehaviorSubject,
  catchError,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  mergeMap,
  Observable,
  Subject,
  Subscriber,
  Subscription,
  zip
} from "rxjs";
import {Writable} from "stream";
import {MavLinkProtocol} from "node-mavlink/lib/mavlink";
import {MavLinkPacketField} from "mavlink-mappings/lib/mavlink";
import {unpackMavPacket} from "../helpers/mavlink/unpackMavPacket";
import {MavlinkSoc} from "../types/MavlinkSoc";
import {CommandLong, MessageInterval, RequestDataStream} from "mavlink-mappings/dist/lib/common";


export class Mavlink {
  port: Writable | MavEsp8266;
  reader: MavLinkPacketParser | MavEsp8266;

  ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  data: Subject<MavLinkData> = new Subject<MavLinkData>();

  targetSystem = 0;
  targetComponent = 0;

  heartbeat: BehaviorSubject<minimal.Heartbeat> = new BehaviorSubject<minimal.Heartbeat>(null);

  constructor(socket: MavlinkSoc) {


    if (socket instanceof MavEsp8266) {
      this.reader = socket;
      this.port = socket;
      this.ready.next(true);
    } else {
      this.port = socket;
      this.reader = (socket as Writable)
        .pipe(new MavLinkPacketSplitter())
        .pipe(new MavLinkPacketParser());
    }

    this.port.on('connect', (data) => {
      console.log(`Connected`);
      this.ready.next(true);
    });

    this.port.on('disconnect', (data) => {
      console.log(`disconnect`);
      this.ready.next(false);
    });

    this.reader.on('data', (packet: MavLinkPacket) => {
      this.data.next(unpackMavPacket(packet));
    });

    this.reader.on('error', (err) => {
      console.error('ERROR MAZAFAKA', err);
    });

    this.messagesByType(minimal.Heartbeat)
      .subscribe((h: minimal.Heartbeat) => {
        this.heartbeat.next(h)
      });

    // this.messagesByType(Heartbeat)
    //   .subscribe((data: Heartbeat) => {
    // 	 console.log(`type: ${minimal.MavType[data.type]}`);
    // 	 console.log(`autopilot: ${minimal.MavAutopilot[data.autopilot]}`);
    // 	 console.log(`baseMode: ${minimal.MavModeFlag[data.baseMode] || data.baseMode}`);
    // 	 console.log(`customMode: ${data.customMode}`);
    // 	 console.log(`systemStatus: ${minimal.MavState[data.systemStatus]}`);
    //   });
  }

  get systemStatus(): minimal.MavState {
    return this.heartbeat.value?.systemStatus;
  }

  get baseMode(): minimal.MavModeFlag {
    return this.heartbeat.value.baseMode;
  }

  messagesByType<T>(clazz: MavLinkDataConstructor<T>): Observable<T> {
    return this.data.pipe(
      filter((data: MavLinkData) => {
        return data.constructor.name === clazz.name
      }),
      map(data => data as T)
    );
  }

  /** Test method **/
  async setMessageInterval(interval: number, messageId: common.MavCmd): Promise<void> {
    const msg = new CommandLong()
    // msg.targetSystem = 1;
    // msg.targetComponent = 0;
    msg.param1 = messageId;
    msg.param2 = interval;
    msg.confirmation = 0;
    await this.sendAndWait(msg);
  }

  /** Test method **/
  async requestDataStream(messagesGroup: common.MavDataStream, interval: number, startStop: number = 1): Promise<void> {
    const msg = new RequestDataStream();
    msg.targetSystem = 0;
    msg.targetComponent = 0;
    msg.reqStreamId = messagesGroup;
    msg.reqMessageRate = interval;
    msg.startStop = startStop;
    await this.send(msg);
  }

  async onReady(): Promise<void> {
    await firstValueFrom(
      zip(
        this.ready.pipe(filter(s => s)),
        this.heartbeat.pipe(filter(h => !!h))
      ),
    );
  }

  async send(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Promise<number> {
    return firstValueFrom(this.sendObs(msg, protocol));
  }

  sendObs(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Observable<number> {
    this.logMessage(msg);
    this.fillRestOfCommand(msg);
    return new Observable<number>((observer: Subscriber<number>) => {
      if (this.reader instanceof MavEsp8266) {
        (this.port as MavEsp8266).send(msg);
        observer.next(null);
        observer.complete();
      } else {
        send(this.port as Writable, msg, protocol)
          .then((l) => {
            observer.next(l as number);
            observer.complete();
          }).catch(err => observer.error(err));
      }
    });
  }

  async sendAndWait(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Promise<common.CommandAck> {
    return lastValueFrom(this.sendAndWaitObs(msg, protocol));
  }

  sendAndWaitObs(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Observable<common.CommandAck> {
    const msgId = this.getMessageId(msg);
    return this.sendObs(msg, protocol).pipe(
      mergeMap(() => {
          return new Observable<common.CommandAck>((observer: Subscriber<common.CommandAck>) => {
            const s: Subscription = this.messagesByType(common.CommandAck).pipe(
              filter((commandAckMsg: common.CommandAck) => commandAckMsg.command === msgId),
              catchError((err, caught) => {
                observer.error(err);
                return caught;
              })
            ).subscribe((msg: common.CommandAck) => {
                observer.next(msg);

                console.log(msg);

                if (msg.result === common.MavResult.ACCEPTED) {
                  observer.complete();
                  s.unsubscribe();
                } else if (msg.result !== common.MavResult.IN_PROGRESS) {
                  console.error(msg);
                  observer.error(new Error(`Command ${msgId} failed, reason: ${common.MavResult[msg.result]}`));
                  s.unsubscribe();
                }
              }
            )
          })
        }
      )
    );
  }

  protected getMessageId(msg: MavLinkData): common.MavCmd {
    if (msg instanceof common.CommandInt || msg instanceof common.CommandLong) {
      return msg.command;
    } else if ((msg as any).constructor.MSG_ID) {
      return (msg as any).constructor.MSG_ID;
    }

    throw new Error(`Error getting id from message`);
  }

  private fillRestOfCommand(msg: MavLinkData): void {
    for (const field of (msg as any).constructor.FIELDS as MavLinkPacketField[]) {
      if (msg[field.name] != undefined) continue;
      msg[field.name] = 0;
    }
  }

  private logMessage(msg: MavLinkData): void {
    console.log(`OUT: ${this.msgToString(msg)}`);
  }

  private msgToString(msg: MavLinkData): string {
    let logStream = `${msg.constructor.name}: `;

    logStream += ((msg as any).constructor.FIELDS as MavLinkPacketField[])
      .filter(a => msg[a.name] != undefined)
      .map(a => `${a.name}: ${msg[a.name]}`)
      .join(', ');

    return logStream;
  }
}
