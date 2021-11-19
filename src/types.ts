export interface Cube {
    id: string,
    ip: string,
    location: string,
    sensors: Array<Sensor>,
    actuators: Array<string>
}

export interface CubeVariables {
    location: string,
    sensors: Array<Sensor>,
    actuators: string
}

export interface App {
    name: string,
    address: string,
    token: string
}

export interface Sensor {
    type: string,
    scanInterval: number
}

export interface CubeDetailDataObject {
    title: string,
    cube: Cube
}

export interface User extends Express.User {
    id: string,
    name: string,
    password: string
}

export interface Token {
    token: string,
    owner: string
}