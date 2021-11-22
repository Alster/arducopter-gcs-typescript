import {MavEsp8266, MavLinkPacketParser} from "node-mavlink";
import {Writable} from "stream";

export type MavlinkSoc = MavEsp8266 | MavLinkPacketParser | Writable;
