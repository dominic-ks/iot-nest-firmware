#!/bin/bash

export $(egrep -v '^#' ~/.config/device/.env | xargs)
IFS='|' read -r -a array <<< "$DOCKERPROFILES"
COMMAND="docker compose"

echo $(pwd)

for ELEMENT in "${array[@]}"
do
    COMMAND="$COMMAND --profile $ELEMENT"
done

COMMAND="$COMMAND up -d"

echo $COMMAND
eval "$COMMAND"