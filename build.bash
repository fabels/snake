#!/bin/bash
version=$(cat package.json | jq '.version' | sed "s/\"//g")

docker build -t gummelhummel/snake:${version} -t gummelhummel/snake:latest .