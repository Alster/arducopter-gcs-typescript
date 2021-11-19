import {
    common,
    MavEsp8266,
    MavLinkPacket,
    MavLinkPacketParser,
    MavLinkPacketSplitter,
    MavLinkProtocolV2,
    send
} from "node-mavlink";
import {MavLinkData, MavLinkDataConstructor} from "mavlink-mappings";

import {BehaviorSubject, filter, firstValueFrom, map, Observable, Subject} from "rxjs";
import {Writable} from "stream";
import {MavLinkProtocol} from "node-mavlink/lib/mavlink";
import {MAVLINK_REGISTRY} from "../consts/mavlink-registry";
import {CommandAck, CommandInt, CommandLong, MavCmd} from "mavlink-mappings/dist/lib/common";

export class Mavlink {
    port: Writable;
    reader: MavLinkPacketParser | MavEsp8266;

    ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    data: Subject<MavLinkData> = new Subject<MavLinkData>();


    constructor(socket: MavEsp8266 | MavLinkPacketParser | Writable) {
	   if (socket instanceof MavEsp8266) {
		  this.reader = socket;
	   } else {
		  this.port = socket;
		  this.reader = (socket as Writable)
			 .pipe(new MavLinkPacketSplitter())
			 .pipe(new MavLinkPacketParser());
	   }

	   this.port.on('connect', (data) => {
		  this.ready.next(true);
	   });

	   this.port.on('disconnect', (data) => {
		  this.ready.next(false);
	   });

	   this.reader.on('data', (packet: MavLinkPacket) => {
		  this.data.next(Mavlink.unpackMavPacket(packet));
	   });

	   this.reader.on('error', (err) => {
		  console.error('ERROR MAZAFAKA', err);
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

    messagesByType<T>(clazz: MavLinkDataConstructor<T>): Observable<T> {
	   return this.data.pipe(
		  filter((data: MavLinkData) => {
			 return data.constructor.name === clazz.name
		  }),
		  map(data => data as T)
	   );
    }

    async onReady(): Promise<void> {
	   await firstValueFrom(this.ready.pipe(filter(s => s)));
    }

    async send(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Promise<number> {
	   if (this.reader instanceof MavEsp8266) {
		  this.reader.send(msg);
		  return null;
	   } else {
		  return await send(this.port as Writable, msg, protocol) as Promise<number>;
	   }
    }

    async sendAndWait(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Promise<void> {
	   const msgId = this.getMessageId(msg);
	   await this.send(msg, protocol);

	   await firstValueFrom(
		  this.messagesByType(CommandAck)
			 .pipe(
				filter((commandAckMsg: CommandAck) => commandAckMsg.command === msgId),
				map((msg: CommandAck) => {
					   if (msg.result !== common.MavResult.ACCEPTED)
						  throw new Error(`Command ${msgId} failed, reason: ${common.MavResult[msg.result]}`);
				    }
				)
			 )
	   );
    }

    protected getMessageId(msg: MavLinkData): MavCmd {
	   if (msg instanceof CommandInt || msg instanceof CommandLong) {
		  return msg.command;
	   } else if ((msg as any).constructor.MSG_ID) {
		  return (msg as any).constructor.MSG_ID;
	   }

	   throw new Error(`Error getting id from message`);
    }

    private static unpackMavPacket(packet: MavLinkPacket): MavLinkData {
	   const clazz: MavLinkDataConstructor<MavLinkData> = MAVLINK_REGISTRY[packet.header.msgid];
	   if (clazz) {
		  return packet.protocol.data(packet.payload, clazz);
	   } else {
		  throw new Error(`Undefined package msgid, ${packet.header.msgid}`);
	   }
    }
}
