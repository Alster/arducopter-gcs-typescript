import {GeolibGeoJSONPoint} from "geolib/es/types";

export namespace Vector2 {

  export type Vector2 = [number, number];

  export function fromGeo(val: GeolibGeoJSONPoint): Vector2 {
    return [+val[0], +val[1]];
  }

  export function sub(a: Vector2, b: Vector2): Vector2 {
    return [a[0] - b[0], a[1] - b[1]];
  }

  export function add(a: Vector2, b: Vector2): Vector2 {
    return [a[0] + b[0], a[1] + b[1]];
  }

  export function mul(v: Vector2, m: number): Vector2 {
    return [v[0] * m, v[1] * m];
  }

  export function div(v: Vector2, m: number): Vector2 {
    return [v[0] / m, v[1] / m];
  }

  export function mag(v: Vector2): number {
    return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
  }

  export function normalize(v: Vector2): Vector2 {
    const mag = Vector2.mag(v);
    return mag > 0 ? Vector2.div(v, mag) : v;
  }
}
