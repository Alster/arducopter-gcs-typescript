import {MavLinkData} from "mavlink-mappings/lib/mavlink";
import {ardupilotmega, common, icarous, minimal, uavionix} from "node-mavlink";
import {MavLinkDataConstructor} from "mavlink-mappings";

export const MAVLINK_REGISTRY: { [key: number]: MavLinkDataConstructor<MavLinkData> } = {
    ...minimal.REGISTRY,
    ...common.REGISTRY,
    ...ardupilotmega.REGISTRY,
    ...uavionix.REGISTRY,
    ...icarous.REGISTRY,
}
