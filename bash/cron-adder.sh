#!/bin/bash

crontab -l > ~/.config/device/ip-reporter
echo "0  *    * * *   $USER      /home/pi/firmware/iot-nest-firmware/bash/ip-reporter.sh" >> ~/.config/device/ip-reporter
crontab ~/.config/device/ip-reporter
rm ~/.config/device/ip-reporter