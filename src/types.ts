export interface Cube {
    id: string,
    location: string,
    sensors: Array<string>,
    actuators: Array<string>
}

export interface CubeVariables {
    [key: string]: string | Array<string>,
}