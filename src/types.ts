export interface Cube {
    id: string,
    location: string,
    sensors: Array<string>,
    actuators: Array<string>
}

export interface CubeVariables {
    location: string,
    sensors: string,
    actuators: string
}

export interface Sensor {
    name: string,
    push_rate: number
}

export interface CubeDetailDataObject {
    title: string,
    cube: Cube,
    additional_sensors: Array<Sensor>,
    additional_actuators: Array<string>
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