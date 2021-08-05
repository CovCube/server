export interface Cube {
    id: string,
    location: string,
    sensors: Array<string>,
    actuators: Array<string>
}

export interface CubeVariables {
    [key: string]: string | Array<string>,
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