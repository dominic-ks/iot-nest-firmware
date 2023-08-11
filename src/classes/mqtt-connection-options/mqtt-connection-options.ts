export class MqttConnectionOptions {
  clean?: boolean;
  clientId: string;
  host: string;
  password: string;
  port: number;
  protocol?: string;
  secureProtocol?: string;
  username: string;
}
