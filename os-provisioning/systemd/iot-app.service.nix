  systemd.services.iot-nest-firmware = {
    description = "IoT Nest Firmware Service";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "iot-app";
      Restart = "always";
      User = "dominicks";
    };
  };