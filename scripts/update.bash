#!/bin/bash
set -veuxo pipefail

host=172.105.11.193
cargo run --release scrape;
cargo run --release normalize;
scp -rp data/normalized/ speedrun@$host:/home/speedrun/speedruns/data/;
ssh speedrun@$host 'ls /home/speedrun/speedruns/data/normalized -la';
ssh root@$host 'systemctl restart graphql';
