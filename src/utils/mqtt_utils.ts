import {ISubscriptionMap, IPublishPacket} from "mqtt";
import {mqttClient as mqtt} from "../index";
import {getTimestamp, persistCube, persistSensorData} from "./db_utils";

const topics: ISubscriptionMap = {
    'sensor/#': {qos: 2},
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

    //Subscribe to topics
    mqtt.subscribe(topics, function(err, granted) {
        if(err) {
            console.log(err);
        }

        if (granted) {
            granted.forEach(function(value) {
                console.log(`Subscribed to ${value.topic} with QoS level ${value.qos}.`);
            })
        }
    });
}

function logMQTTEvent(event: string, options: Array<any> = []): void {
    //console.log(`Event emitted: ${event}`);
    options.forEach(value => {
        console.log(value);
    });
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
    persistSensorData(topic[1], topic[2], getTimestamp(), message);
}

function handleInitMessage(topic: Array<string>, message: string): void {

}