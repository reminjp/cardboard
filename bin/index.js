#!/usr/bin/env -S node --experimental-vm-modules

import dotenv from 'dotenv';
import { cli } from '../dist/cli.js';

dotenv.config();
await cli.parse();
