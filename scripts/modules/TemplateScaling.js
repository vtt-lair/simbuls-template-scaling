import { MODULE } from '../module.js';
import { logger } from '../../../simbuls-athenaeum/scripts/logger.js';
import { HELPER } from '../../../simbuls-athenaeum/scripts/helper.js'

const NAME = "TemplateScaling";

export class TemplateScaling {
    static register(){
        logger.info("Registering Template Scaling Features");
        TemplateScaling.settings();
        TemplateScaling.hooks();
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
        // V14 replaces MeasuredTemplates with Regions. We hook preCreate to modify the shapes array before saving.
        Hooks.on("preCreateRegion", TemplateScaling._preCreateRegion);
    }

    /**
     * Hook method to modify the size/shape of a Region acting as a template 
     * to better fit the 5/5/5 grid rules.
     */
    static _preCreateRegion(regionDoc, data, options, userId) {
        if (userId !== game.user.id) return;

        const templateMode = HELPER.setting(MODULE.data.name, 'gridTemplateScaling');
        if (templateMode === 0) return;

        // Ensure this region is actually a spell/ability template by checking flags
        // Systems like dnd5e typically flag regions created as templates.
        const isTemplate = foundry.utils.getProperty(data, "flags.dnd5e.isTemplate") || foundry.utils.getProperty(data, "flags.core.isTemplate");
        if (!isTemplate) return;

        let shapes = foundry.utils.deepClone(data.shapes || []);
        let modified = false;
        const scene = regionDoc.parent;
        const gridSize = scene.grid.size;
        const gridDistance = scene.grid.distance;

        shapes.forEach((shape, index) => {
            // Check for Lines or Cones (Polygon or Rectangle)
            if (!!(templateMode & 0b01) && (shape.type === "polygon" || shape.type === "rectangle")) {
                // If the system provides direction and distance metadata in flags, use it to scale
                const direction = foundry.utils.getProperty(data, "flags.dnd5e.direction");
                if (direction !== undefined) {
                    const diagonalScale = Math.abs(Math.sin(Math.toRadians(direction))) + Math.abs(Math.cos(Math.toRadians(direction)));
                    
                    if (shape.type === "polygon" && shape.points) {
                        // Scale all points relative to origin (assumed 0,0 for local region shapes)
                        shape.points = shape.points.map(p => p * diagonalScale);
                        modified = true;
                    } else if (shape.type === "rectangle") {
                        shape.width *= diagonalScale;
                        shape.height *= diagonalScale;
                        modified = true;
                    }
                }
            }
            
            // Convert Circles/Ellipses to equivalent squares
            else if (!!(templateMode & 0b10) && (shape.type === "ellipse" || shape.type === "circle")) {
                // Calculate original radius in grid distance units
                const radiusPx = shape.radiusX || shape.radius;
                const radiusDistance = (radiusPx / gridSize) * gridDistance;

                // Only convert if it's 1 grid unit or larger (allows small circular markers)
                if (radiusDistance >= 0.9) {
                    shapes[index] = {
                        type: "rectangle",
                        x: shape.x - radiusPx,
                        y: shape.y - radiusPx,
                        width: radiusPx * 2,
                        height: radiusPx * 2,
                        rotation: 0
                    };
                    modified = true;
                }
            }
        });

        // Apply mutations directly to the creation data
        if (modified) {
            regionDoc.updateSource({ shapes: shapes });
        }
    }
}