#!/bin/bash

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

touch ./current-version.txt

git fetch --tags

LATEST=$(git describe --tags $(git rev-list --tags --max-count=1))
CURRENT=$(cat ./current-version.txt)

echo "CURRENT:" $CURRENT
echo "LATEST:" $LATEST

if [[ $LATEST != $CURRENT ]]
then 
	
	echo "Downloading latest..."
	git -c advice.detachedHead=false checkout tags/$LATEST
	
	echo $LATEST > ./current-version.txt
	
	echo "All done"
	
else
	echo "Nothing to do..."
fi
