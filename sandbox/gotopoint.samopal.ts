import {common, minimal} from "mavlink-mappings";
import {connect} from "net";
import {Drone} from "../src/classes/Drone";
import {sleep} from "node-mavlink";
import { getDistance } from 'geolib';
import {GeolibGeoJSONPoint} from "geolib/es/types";
import {Vector2} from "../src/helpers/vector2";

const drone = new Drone(connect({host: '127.0.0.1', port: 14552}));
(async function main() {
  await drone.onReady();

  //Координата куда летим
  //В данном случае это гео-точка (ибо другой вариант проверить не могу)
  const targetPos: GeolibGeoJSONPoint = [63.985029, -22.626198];

  while (true){
    //Получаю дистанцию чтоб в дальнейшем использовать для просчета скорости
    const distance = getDistance(drone.position, targetPos);
    //Считаем направление к точке от дрона
    const dirGeo = Vector2.sub(Vector2.fromGeo(targetPos), Vector2.fromGeo(drone.position));
    const dirNorm = Vector2.normalize(dirGeo);
    //Применяем к полученному направлению скорость базируясь на расстоянии
    const dirMeters = Vector2.mul(dirNorm, distance * 0.3);
    //Понеслась)))
    const targetDir = [dirMeters[0], dirMeters[1]];
    // console.log(`Going to ${JSON.stringify(targetDir)}`)
    drone.goToDirection(targetDir[0], targetDir[1], 0);
    await sleep(100);
  }

})();
