#!/bin/sh
set -e

npx prisma generate
npm run dev
