#!/bin/bash
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up "$@" 