import { MODULE } from '../module.js';
import { logger } from '../../../simbuls-athenaeum/scripts/logger.js';
import { HELPER } from '../../../simbuls-athenaeum/scripts/helper.js'
import { queueUpdate } from '../../../simbuls-athenaeum/scripts/update-queue.js';

const NAME = "TemplateScaling";

export class TemplateScaling {
    static register(){
        logger.info("Registering Template Scaling Features");
        TemplateScaling.defaults();
        TemplateScaling.settings();
        TemplateScaling.hooks();
    }

    static defaults() {

    }

    static settings() {
        const config = true;
        const settingsData = {
        gridTemplateScaling : {
            scope : "world", config, group: "system", default: 0, type: Number,
            choices : {
                0 : HELPER.localize("option.gridTemplateScaling.none"),
                1 : HELPER.localize("option.gridTemplateScaling.lineCone"),
                2 : HELPER.localize("option.gridTemplateScaling.circle"),
                3 : HELPER.localize("option.gridTemplateScaling.all"),
            }
        }
        };

        MODULE.applySettings(settingsData);
    }

    static hooks() {
        Hooks.on("createMeasuredTemplate", TemplateScaling._createMeasuredTemplate);
    }

    /*
        Class Specific Functions
    */

    /**
     * hook method to modify the size/shape of a template to better fit the 5/5/5 grid rules
     * @param {*} templateDocument
     * @todo clamp size to maximum supported by current scene
     */
    static _createMeasuredTemplate(templateDocument) {

        /** range 0-3
         *  b01 = line/cone, 
         *  b10 = circles,
         *  b11 = both 
         */
        const templateMode = HELPER.setting(MODULE.data.name, 'gridTemplateScaling');

        /** if template adjusting is not enabled, bail out */
        if (templateMode == 0) {
            return;
        }

        let canModifyTemplate = templateDocument.canUserModify(game.user, "update") || templateDocument.canUserModify(game.user, "create");
        if (!canModifyTemplate) {
            return;
        }

        const template = templateDocument;
        const scene = templateDocument.object.scene;

        if (!!(templateMode & 0b01) && (template.t == 'ray' || template.t == 'cone')) {
            TemplateScaling._scaleDiagonalDistance(templateDocument);
        }
        else if (!!(templateMode & 0b10) && template.t == 'circle' && !(template.distance / scene.grid.distance < .9)) {
            TemplateScaling._convertToSquare(template, scene); 
        }
    }

    /** scale rays after placement to cover the correct number of squares based on 5e diagonal distance */
    static _scaleDiagonalDistance(template) {
        let diagonalScale = Math.abs(Math.sin(Math.toRadians(template.direction))) +
        Math.abs(Math.cos(Math.toRadians(template.direction)))
        
        queueUpdate( () => template.update({ 
            'distance' : diagonalScale * template.distance 
        }));
    }

    /** Convert circles to equivalent squares (e.g. fireball is square) 
     *  if the template is 1 grid unit or larger (allows for small circlar
     *  templates as temporary "markers" of sorts)
     */
    static _convertToSquare(template, scene) {
        /** convert radius in grid units to radius in pixels */
        let radiusPx = (template.distance / scene.grid.distance) * scene.grid.size;

        /** convert the "distance" to the squares hypotenuse */
        const length = template.distance * 2;
        const distance = Math.hypot(length, length);

        /** convert to a rectangle */
        /** shift origin to top left in prep for converting to rectangle */
        /** always measured top left to bottom right */
        queueUpdate(() => template.update({ 
            't': 'rect',
            'x': template.x - radiusPx,
            'y': template.y - radiusPx,
            'distance': distance,
            'direction': 45
        }));
    }
}
