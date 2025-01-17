import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {FlightMode} from "../src/enums/ardupilot/FlightMode";

const drone = new Drone(connect({host: '127.0.0.1', port: 5680}));
setInterval(async () => {
    await drone.setMode(FlightMode.AUTO);
}, 5000);
