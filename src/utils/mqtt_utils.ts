//type imports
import { MqttClient, ISubscriptionMap, IPublishPacket, ISubscriptionGrant } from "mqtt";
import { Cube } from "../types";
//external imports
import mqtt from "mqtt";
//internal imports
import { getCubes } from "../model/cube";
import { getTimestamp } from "./general_utils";
import { persistSensorData } from "../model/sensor_data";

var mqttClient: MqttClient;

export async function setupMQTT(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Get broker address
        let mqttUrl: string = process.env.MQTTURL || 'test.mosquitto.org';
        let mqttPort: number = parseInt(process.env.MQTTPORT || '1883');
        //Connect to broker
        mqttClient = mqtt.connect('mqtt://'+mqttUrl, {port: mqttPort});

        mqttClient.on('connect', async function() {
            console.log('Connected to MQTT server.');

            //Set event listeners
            mqttClient.on('reconnect', () => logMQTTEvent('Reconnect'));
            mqttClient.on('close', () => logMQTTEvent('Close'));
            mqttClient.on('disconnect', () => logMQTTEvent('Disconnect'));
            mqttClient.on('offline', () => logMQTTEvent('Offline'));
            mqttClient.on('error', (error) => logMQTTEvent('Error', [error]));
            mqttClient.on('end', () => logMQTTEvent('End'));
            mqttClient.on('packetsend', () => logMQTTEvent('Packetsend'));
            mqttClient.on('packetreceive', (packet) => logMQTTEvent('Packetreceive', [packet]));
            mqttClient.on('message', handleMQTTMessage);
            
            try {
                //Subscribe to topic of existing cubes
                let cubes: Cube[] = await getCubes();

                cubes.forEach(async (cube: Cube) => {
                    await subscribeCubeMQTTTopic(cube.id, 2);
                });

                resolve();
            } catch(err) {
                console.log(err);
            }
        });
    });
}

export async function subscribeCubeMQTTTopic(cubeId: string, qos: 0 | 1 | 2): Promise<void> {
    let topics: ISubscriptionMap = {};
    let topic: string = 'sensor/+/'+cubeId+'/#';
    topics[topic] = {'qos': qos};

    return subscribeMQTTTopics(topics);
}

function subscribeMQTTTopics(topics: ISubscriptionMap): Promise<void> {
    return new Promise((resolve, reject) => {
        //Subscribe to topics
        mqttClient.subscribe(topics, function(err: Error, granted: ISubscriptionGrant[]) {
            if(err) {
                console.log(err);
                reject(err);
            }

            if (granted) {
                granted.forEach(function(value: ISubscriptionGrant) {
                    console.log(`Subscribed to ${value.topic} with QoS level ${value.qos}.`);
                })

                resolve();
            }
        });
    });
}

function logMQTTEvent(event: string, options: Array<any> = []): void {
    console.log(`Event emitted: ${event}`);
    //options.forEach(value => {
    //    console.log(value);
    //});
}

function handleMQTTMessage(topicString: string, messageBuffer: Buffer, packet: IPublishPacket): void {
    let message: string = messageBuffer.toString();
    let topic: Array<string> = topicString.split('/');

    switch (topic[0]) {
        case 'sensor':
            handleSensorData(topic, message);
            break;
        default:
            console.log('Unrecognizes topic: ' + topicString);
    }
}

function handleSensorData(topic: Array<string>, message: string): void {
    persistSensorData(topic[1], topic[2], getTimestamp(), message)
        .catch((err: Error) => {
            console.log(err.stack);
        });
}