#!/bin/bash
set -veuxo pipefail

cargo build --bin serve

cargo run --bin serve &
trap "kill $!" EXIT

sleep 2

apollo client:codegen --target typescript --outputFlat src/pages-lib/graphql.ts
apollo client:download-schema data/schema.graphql
