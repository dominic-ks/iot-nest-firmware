#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

export $(egrep -v '^#' .env | xargs)
myip="$(wget -qO- http://ipecho.net/plain | xargs echo)"
DATE_ISO=$(date +"%Y-%m-%dT%H:%M:%S")

DEVICEID=${DEVICEID//[^[:alnum:]&&[:punct:]]/}
CURLURL="https://europe-west2-iot-projects-309015.cloudfunctions.net/api/device/$DEVICEID/report-ip/"

curl --location --request POST "$CURLURL" \
        --header 'Content-Type: application/json' \
        --data-raw '{
            "secretKey": ")@yWYqX+s97_>V`",
            "ip": "'$myip'",
            "lastUpdated": "'"$DATE_ISO"'"
    }'