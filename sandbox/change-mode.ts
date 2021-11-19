import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {common} from "node-mavlink";

const drone = new Drone(connect({host: '127.0.0.1', port: 5680}));
setInterval(async () => {
    const msg = new common.SetMode();
    msg.baseMode = 81;
    msg.customMode = 4;

    const res = await drone.send(msg);
    console.log('response >>>>>>>>>', res);

}, 5000);
