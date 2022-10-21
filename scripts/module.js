import { logger } from '../../simbuls-athenaeum/scripts/logger.js';
import { HELPER } from '../../simbuls-athenaeum/scripts/helper.js'

const ATHENAEUM_NAME = `simbuls-athenaeum`;
const ATHENAEUM_PATH = `/modules/${ATHENAEUM_NAME}`;

const NAME = "simbuls-template-scaling";
const PATH = `/modules/${NAME}`;
const TITLE = "Simbul's Template Scaling";


/**
 * @class
 * @property {Function} patch
 */
export class MODULE {
    static async register(){
        logger.info(NAME, "Initializing Module");
        MODULE.globals();
        MODULE.debugSettings();
    }

    static async build(){
        MODULE.data = {
            name : NAME, path : PATH, title : TITLE, athenaeum : ATHENAEUM_PATH
        };
    }

    static globals() {
        game.dnd5e.templatescaling = {};
    }

    static debugSettings() {
        const config = true;
        const settingsData = {
            debug : {
                scope: "world", config, default: false, type: Boolean,
            },
        };

        MODULE.applySettings(settingsData);
    }

    static applySettings(settingsData){
        Object.entries(settingsData).forEach(([key, data])=> {
            game.settings.register(
                MODULE.data.name, key, {
                    name : HELPER.localize(`setting.${key}.name`),
                    hint : HELPER.localize(`setting.${key}.hint`),
                    ...data
                }
            );
        });
    }
}
