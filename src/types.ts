export interface Cube {
    id: string,
    location: string,
    sensors: Array<Sensor>,
    actuators: Array<string>
}

export interface CubeVariables {
    location: string,
    sensors: Array<Sensor>,
    actuators: string
}

export interface Sensor {
    type: string,
    scanInterval: number
}

export interface CubeDetailDataObject {
    title: string,
    cube: Cube,
    additional_sensors: Array<Sensor>,
    additional_actuators: Array<string>
}

export interface BarebonesUser extends Express.User {
    id: string
}

export interface User extends BarebonesUser {
    name: string,
    password: string
}

export interface Token {
    token: string,
    owner: string
}