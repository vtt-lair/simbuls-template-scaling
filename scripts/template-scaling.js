/**
 * Main Module Organizational Tools
 */
import { MODULE } from './module.js';
import { logger } from '../../simbuls-athenaeum/scripts/logger.js';
import { TemplateScaling } from './modules/TemplateScaling.js';

/**
 * Sub Modules
 */
import { TemplateScaling } from './modules/TemplateScaling.js';

const SUB_MODULES = {
    MODULE,
    TemplateScaling,
};

/*
  Initialize Module
*/
MODULE.build();

/*
  Initialize all Sub Modules
*/
Hooks.on(`setup`, () => {
    Object.values(SUB_MODULES).forEach(cl => cl.register());
    Hooks.callAll('templatescalingReady', {MODULE, logger});
});
