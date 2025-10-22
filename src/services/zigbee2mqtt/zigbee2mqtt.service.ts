import { Injectable } from '@nestjs/common';

import { AppMessagesService } from '../app-messages/app-messages.service';
import { UtilityService } from '../utility/utility.service';

import { VirtualDevice } from 'src/interfaces/virtual-device.interface';
import { Device } from 'src/classes/device/device';

import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

class ZigbeeDeviceList {
  description: string;
  definition: any;
  friendly_name: string;
  ieee_address: string;
  model_id: string;
  type: string;
}

@Injectable()
export class Zigbee2mqttService implements VirtualDevice {
  
  public deviceInfo: Device;

  private attachedDevices: ZigbeeDeviceList[];
  private appMessagesService: AppMessagesService;
  private mqttClient: MqttClient;

  constructor(
    private utilityService: UtilityService,
  ) {
    this.appMessagesService = this.utilityService.appMessagesService;
    this.utilityService.set( 'zigbee2mqttService' , this );
  }

  addConnectedDevices(): void {
    for( let device of this.deviceInfo.data.devices ) {
      this.appMessagesService.broadcastMessage({
        data: device,
        type: 'device-add',
      });
    }
  }

  convertConnectedDevices( zigbeeDeviceList: ZigbeeDeviceList[] ): Device[] {
    return zigbeeDeviceList.filter( device => device.type !== 'Coordinator' ).map( device => ({
      address: device.ieee_address,
      id: device.ieee_address,
      name: device.description,
      owner: this.deviceInfo.owner,
      parent: this.deviceInfo.parent,
      type: device.model_id,
    }));
  }

  executeDeviceCommand( commandData: any ) { }

  getDeviceTraits( device : Device ): Object {

    const attachedDevice = this.attachedDevices.find( attachedDevice => attachedDevice.ieee_address === device.id );
    let traits = {}

    if( ! this.attachedDevices.some( attachedDevice => attachedDevice.ieee_address === device.id )) {
      return traits;
    }

    if( attachedDevice.type === 'Coordinator' ) {
      return traits;
    }

    if( typeof( attachedDevice.definition.exposes ) === 'undefined' ) {
      return traits;
    }

    for( let trait of attachedDevice.definition.exposes ) {
      if( typeof( trait.property ) !== 'undefined' ) {
        traits[ trait.property ] = '';
        continue;
      }

      if( typeof( trait.features ) === 'undefined' ) {
        continue;
      }

      for( let feature of trait.features ) {
        traits[ feature.property ] = '';
      }
    }

    return traits;
      
  }

  getDeviceTypeName(): string {
    return 'Zigbee Controller';
  }

  mqttPublish( device: Device , command: string , data: any ): void {

    const attachedDevice = this.attachedDevices.find( attachedDevice => attachedDevice.ieee_address === device.id );

    if( ! this.attachedDevices.some( attachedDevice => attachedDevice.ieee_address === device.id )) {
      return;
    }

    this.mqttClient.publish( 'zigbee2mqtt/' + attachedDevice.friendly_name + '/' + command , JSON.stringify( data ) , { qos: 1 });

  }

  mqttSubscribe( device: Device , callback: Function ): void {

    const attachedDevice = this.attachedDevices.find( attachedDevice => attachedDevice.ieee_address === device.id );

    if( ! this.attachedDevices.some( attachedDevice => attachedDevice.ieee_address === device.id )) {
      return;
    }

    this.mqttClient.subscribe( 'zigbee2mqtt/' + attachedDevice.friendly_name , { qos: 0 });
    this.mqttClient.on( 'message' , callback );

  }

  onClose(): void {
    console.log( 'zigbee2mqtt connection closed...' );
  }

  onConnect( success: boolean ) {
    if( success ) {
      console.log( 'zigbee2mqtt client connected...' );
    } else {
      console.log( 'zigbee2mqtt client not connected...' );
    }
  }

  onError( error: string ): void {
    console.log( 'zigbee2mqtt connection error' , error );
  }

  onMessage( topic: string , message: string ): void {


    try {
      const decodedMessage = JSON.parse( Buffer.from( message , 'base64' ).toString( 'utf8' ));

      if( topic === 'zigbee2mqtt/bridge/devices' ) {

        this.attachedDevices = decodedMessage;
        this.deviceInfo.data.devices = this.convertConnectedDevices( decodedMessage );

        // this.getDeviceTraits( decodedMessage );      
        this.updateMqtt();      
        this.addConnectedDevices();

      }

    } catch (error) {
      console.error('Failed to decode MQTT message:', {
        topic,
        messageLength: message.length,
        error: error.message
      });
    }

  }

  setDevice( device: Device ) { 

    this.updateDeviceData( device );

    this.mqttClient = mqtt.connect({
      clientId: 'local-zigbee',
      host: 'localhost',
      port: 1884,
    });

    this.mqttClient.subscribe( 'zigbee2mqtt/bridge/devices' , { qos: 0 });

    this.mqttClient.on( 'close' , this.onClose.bind( this ));
    this.mqttClient.on( 'connect' , this.onConnect.bind( this ));
    this.mqttClient.on( 'error' , this.onError.bind( this ));
    this.mqttClient.on( 'message' , this.onMessage.bind( this ));

  }

  setDeviceData( data: any ) { }

  updateDeviceData( device: Device ) {
    this.deviceInfo = device;
    this.deviceInfo.data = typeof( this.deviceInfo.data ) !== 'undefined' ? this.deviceInfo.data : {};
  }

  updateMqtt() {
    this.appMessagesService.broadcastMessage({
      data: this.deviceInfo,
      type: 'mqtt-send',
    });
  }

}
