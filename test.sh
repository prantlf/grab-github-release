#!/bin/sh

set -e

test() {
  if [ "$2" != "" ]; then
    echo "----------------------------------------"
  fi
  echo "$1"
  echo "----------------------------------------"
}

test "help"
./bin/grab-github-release.js -h

test "version" 1
./bin/grab-github-release.js -V

echo "done"
