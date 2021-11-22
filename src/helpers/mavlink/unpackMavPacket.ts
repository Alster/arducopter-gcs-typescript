import {MavLinkPacket} from "node-mavlink";
import {MavLinkData, MavLinkDataConstructor} from "mavlink-mappings";
import {MAVLINK_REGISTRY} from "../../consts/mavlink-registry";

export function unpackMavPacket(packet: MavLinkPacket): MavLinkData {
  const clazz: MavLinkDataConstructor<MavLinkData> = MAVLINK_REGISTRY[packet.header.msgid];
  if (clazz) {
    return packet.protocol.data(packet.payload, clazz);
  } else {
    throw new Error(`Undefined package msgid, ${packet.header.msgid}`);
  }
}
