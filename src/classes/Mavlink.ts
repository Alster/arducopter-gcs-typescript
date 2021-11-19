import {
    MavEsp8266,
    MavLinkPacket,
    MavLinkPacketParser,
    MavLinkPacketSplitter,
    MavLinkProtocolV2,
    send
} from "node-mavlink";
import {MavLinkData, MavLinkDataConstructor} from "mavlink-mappings";

import {filter, map, Observable, Subject} from "rxjs";
import {Writable} from "stream";
import {MavLinkProtocol} from "node-mavlink/lib/mavlink";
import {MAVLINK_REGISTRY} from "../consts/mavlink-registry";

export class Mavlink {
    port: Writable;
    reader: MavLinkPacketParser | MavEsp8266;

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

	   this.reader.on('open', (data) => {
		  console.log('opened', data);
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

    async send(msg: MavLinkData, protocol: MavLinkProtocol = new MavLinkProtocolV2()): Promise<number> {
	   if (this.reader instanceof MavEsp8266) {
		  this.reader.send(msg);
		  return null;
	   } else {
		  return await send(this.port as Writable, msg, protocol) as Promise<number>;
	   }
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
