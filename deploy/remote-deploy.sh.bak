#!/usr/bin/env bash
set -e

GIT_REPO_URL="${1:-${GIT_REPO_URL}}"
if [ -z "$GIT_REPO_URL" ]; then
  echo "GIT_REPO_URL not set. Pass as first arg or set environment variable." >&2
  exit 1
fi

if [ -d /var/www/intentloop/.git ]; then
  cd /var/www/intentloop
  git fetch --all --prune
  git reset --hard origin/main
else
  rm -rf /var/www/intentloop/*
  git clone --depth 1 "$GIT_REPO_URL" /var/www/intentloop
fi

cd /var/www/intentloop
npm ci --production --prefix server
npm run build --prefix server
pm2 startOrReload /var/www/intentloop/ecosystem.config.js --env production
