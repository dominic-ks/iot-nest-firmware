#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

export $(egrep -v '^#' ~/.config/device/.env | xargs)

myip="$(wget -qO- -4 http://icanhazip.com | xargs echo)"
DATE_ISO=$(date +"%Y-%m-%dT%H:%M:%S")

DEVICEID=${DEVICEID//[^[:alnum:]&&[:punct:]]/}
CURLURL="https://$FUNCTIONSREGION-$PROJECTID.cloudfunctions.net/api/device/$DEVICEID/report-ip/"

curl --location --request POST "$CURLURL" \
        --header 'Content-Type: application/json' \
        --data-raw '{
            "secretKey": "'"$SECRETKEY"'",
            "ip": "'$myip'",
            "lastUpdated": "'"$DATE_ISO"'"
    }'