#!/usr/bin/env -S node --experimental-vm-modules

import dotenv from 'dotenv';
import { cli } from '../src/cli.ts';

dotenv.config();
await cli.parse();
