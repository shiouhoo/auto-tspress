#!/usr/bin/env node
import { command } from './utils/command.js';

const init = () => {
    command();
};

try{
    init();
}catch(err) {
    // eslint-disable-next-line no-console
    console.error(err);
}

