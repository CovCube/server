/**
 * Module for MQTT util methods.
 * 
 * @module
 */

//type imports
import { MqttClient, ISubscriptionMap, IPublishPacket, ISubscriptionGrant } from "mqtt";
import { Cube } from "../types";
//external imports
import mqtt from "mqtt";
//internal imports
import { getCubes } from "../model/cube";
import { persistSensorData } from "../model/sensor_data";

/**
 * Holds the connection to the MQTT broker.
 */
var mqttClient: MqttClient;

/**
 * Sets up the connection to the MQTT broker and subscribes to the MQTT topics of
 * each registered [Cube]{@link types.Cube}.
 */
export async function setupMQTT(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        console.log('attempting MQTT server connection ...');

        //Get broker address
        let mqttUrl: string = process.env.MQTTURL || 'test.mosquitto.org';
        let mqttPort: number = parseInt(process.env.MQTTPORT || '1883');
        //Connect to broker
        mqttClient = mqtt.connect([{
            host: 'mqtt://'+mqttUrl,
            port: mqttPort
        }]);

        mqttClient.on('connect', async function() {
            console.log('connected to MQTT server');

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

/**
 * Wrapper to subscribe to the MQTT topic for a cube.
 * 
 * @param cubeId the id of a [Cube]{@link types.Cube}
 * @param qos the quality of service for this topic (0=at most once, 1=at least once, 2=exactly once)
 */
export async function subscribeCubeMQTTTopic(cubeId: string, qos: 0 | 1 | 2): Promise<void> {
    let topics: ISubscriptionMap = {};
    let topic: string = 'sensor/+/'+cubeId+'/#';
    topics[topic] = {'qos': qos};

    return subscribeMQTTTopics(topics);
}

/**
 * Subscribe to specified topics.
 * 
 * @param topics topics to be subscribed to
 */
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

/**
 * Log MQTT events.
 * 
 * @param event string for the event that has happend
 * @param options options of that event
 */
function logMQTTEvent(event: string, options: Array<any> = []): void {
    console.log(`Event emitted: ${event}`);
    //options.forEach(value => {
    //    console.log(value);
    //});
}

/**
 * Handler for MQTT messages.
 * 
 * Currently only listens to topics that start with "sensor"
 * 
 * @param topicString the whole topic of the message
 * @param messageBuffer the message
 * @param packet the options for this message
 */
function handleMQTTMessage(topicString: string, messageBuffer: Buffer, packet: IPublishPacket): void {
    let message: string = messageBuffer.toString();
    let topic: Array<string> = topicString.split('/');

    switch (topic[0]) {
        case 'sensor':
            handleSensorData(topic, message);
            break;
        default:
            console.log('Unrecognized topic: ' + topicString);
    }
}

/**
 * Handler for persisting sensor data.
 * 
 * @param topic topic of the message formatted like this: sensor/sensor_type/cubeId
 */
function handleSensorData(topic: Array<string>, message: string): void {
    persistSensorData(topic[1], topic[2], message)
        .catch((err: Error) => {
            console.log(err.stack);
        });
}