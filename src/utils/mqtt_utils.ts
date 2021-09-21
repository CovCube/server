//type imports
import { ISubscriptionMap, IPublishPacket, ISubscriptionGrant } from "mqtt";
//internal imports
import { mqttClient as mqtt } from "../index";
import { getTimestamp, persistSensorData } from "./db_cube_utils";

//TODO: Look if topics can be subscribed by cube or via .env
const startTopics: ISubscriptionMap = {
    'sensor/+/+/test/test': {qos: 2},
    'init/#': {qos: 2},
}

export function setupMQTT(): void {

    //Set event listeners
    mqtt.on('reconnect', () => logMQTTEvent('Reconnect'));
    mqtt.on('close', () => logMQTTEvent('Close'));
    mqtt.on('disconnect', () => logMQTTEvent('Disconnect'));
    mqtt.on('offline', () => logMQTTEvent('Offline'));
    mqtt.on('error', (error) => logMQTTEvent('Error', [error]));
    mqtt.on('end', () => logMQTTEvent('End'));
    mqtt.on('packetsend', () => logMQTTEvent('Packetsend'));
    mqtt.on('packetreceive', (packet) => logMQTTEvent('Packetreceive', [packet]));
    mqtt.on('message', handleMQTTMessage);

    //Subscribe to start topics
    subscribeMQTTTopics(startTopics);
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
        mqtt.subscribe(topics, function(err: Error, granted: ISubscriptionGrant[]) {
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
        case 'init':
            handleInitMessage(topic, message);
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

function handleInitMessage(topic: Array<string>, message: string): void {

}