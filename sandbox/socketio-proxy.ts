import {Heartbeat} from "mavlink-mappings/dist/lib/minimal";
import {createServer} from "http";
import {Attitude, LocalPositionNed} from "mavlink-mappings/dist/lib/common";
import {common} from "node-mavlink";
import {Drone} from "../src";
import {connect} from "net";


const httpServer = createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

httpServer.listen(3000);

(async function main() {
  // const udp = new MavEsp8266();
  // await udp.start(14550, 14550);
  // const drone = new Drone(udp);
  const drone = new Drone(connect({host: '127.0.0.1', port: 5763}));
  // await drone.onReady();

  // await drone.arm();


  try {
    // drone.setMessageInterval(50000, common.MavCmd.DO_CHANGE_SPEED);

    // drone.requestDataStream(common.MavDataStream.POSITION, 50, 1);
    drone.requestDataStream(common.MavDataStream.ALL, 50, 1);
  } catch (err) {
    console.log(err);
  }


  console.log('setMessageInterval set success');

  // drone.data.subscribe(data => {
  //   console.log(data);
  // });

  drone.messagesByType(Heartbeat).subscribe(msg => io.sockets.emit('heartbeat', msg));
  drone.messagesByType(LocalPositionNed).subscribe(msg => io.sockets.emit('local-position', msg));
  // drone.messagesByType(Ahrs2).subscribe(msg => io.sockets.emit('ahrs2', msg));
  drone.messagesByType(Attitude).subscribe(msg => io.sockets.emit('attitude', msg));

})();
