import * as dat from '../node_modules/dat.gui/build/dat.gui';
import datPresets from './dat.gui.presets';
import MoleculeEmitter from './MoleculeEmitter';
import * as PIXI from '../node_modules/pixi.js/dist/pixi';
import uniqid from '../node_modules/uniqid/index';

export default class MoleculeVizualisationEditor {
    /**
     * @param {Object} document
     * @param {} mlcv     Molecule Vizualisation.
     */
    constructor(document, mlcv) {
        this.document = document;

        /**
         * @type {MoleculeVizualisation}
         */
        this.mlcv = mlcv;

        /**
         * Emitter used to for the new settings gui.
         *
         * @type {MoleculeEmitter}
         */
        this.guiEmitter = new MoleculeEmitter('New Emitter');

        /**
         * Selected emitter in the editor.
         *
         * @type {MoleculeEmitter}
         */
        this.selectedEmitter = null;

        /**
         * GUI for editor.
         *
         * @type {dat}
         */
        this.gui = new dat.GUI({
            load: datPresets,
            preset: 'Default'
        });

        /**
         * @type {PIXI.Sprite}
         */
        this.referenceImage = PIXI.Sprite.fromImage('./../example/img/reference-organs.png');

        /**
         * @type {Number}
         */
        this.referenceImageOpacity = 0.15;

        /**
         * Name for the state when exporting.
         *
         * @type {String}
         */
        this.exportStateId = 'Default';

        this.init();
    }

    init() {
        this.setupLayers();
    }

    setupLayers() {
        this.setupMoleculeEmitterControls();

        this.setupMlcvControls();

        this.setupReferenceLayer();
    }

    setupMoleculeEmitterControls() {
        // Activate presets and make the gui remember settings.
        this.gui.remember(this.guiEmitter.settings);

        const newEmitterFolder = this.gui.addFolder('New Emitter');

        this.addEmitterSettingsToFolder(newEmitterFolder, this.guiEmitter);
        newEmitterFolder.add(this, 'placeEmitter');
        newEmitterFolder.open();
    }

    setupMlcvControls() {
        const mlcvFolder = this.gui.addFolder('MLCV');
        const qualityLevelContr = mlcvFolder.add(this.mlcv.settings, 'qualityLevel', 1, 100).step(1).name('Quality');
        mlcvFolder.add(this, 'toggleDebug').name('Toggle Debug');
        mlcvFolder.add(this, 'toggleGizmos').name('Toggle Gizmos');
        mlcvFolder.add(this, 'toggleReferenceImage').name('Toggle reference image');
        const referenceImageOpacityContr = mlcvFolder.add(this, 'referenceImageOpacity', 0, 1).step(0.01).name('Reference Image Opacity');
        mlcvFolder.add(this, 'toggleAnimation').name('Toggle Animation');
        mlcvFolder.add(this, 'recreateMolecules').name('Recreate molecules');
        mlcvFolder.open();

        const exportFolder = mlcvFolder.addFolder('Export');
        exportFolder.add(this, 'exportStateId').name('ID');

        // TODO. when exporting set quality to 100 and update the molecules
        // so the user always exports the highest quality and there is no confusion.
        exportFolder.add(this, 'exportState').name('Export (JSON)');
        exportFolder.open();

        referenceImageOpacityContr.onChange(value => {
            this.referenceImage.alpha = value;
        });

        qualityLevelContr.onFinishChange(value => {
            this.updateEmittersQualityChange();
        });
    }

    updateEmittersQualityChange() {
        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            const emitter = this.mlcv.moleculeEmitters[i];

            emitter.updateEmissionAmountBasedOnQuality();
        }
    }

    setupReferenceLayer() {
        // center the sprite's anchor point
        this.referenceImage.anchor.set(0.5);

        // move the sprite to the center of the screen
        this.referenceImage.x = this.mlcv.pixiApp.screen.width / 2;
        this.referenceImage.y = this.mlcv.pixiApp.screen.height / 2;

        this.referenceImage.alpha = this.referenceImageOpacity;

        this.mlcv.pixiApp.stage.addChild(this.referenceImage);
    }

    /**
     * This places an emitter onto the vizualisation.
     *
     * If no coordinates are supplied the emitter will be centered.
     *
     * If an emitter is passed we will use that as the base to
     * copy over settings instead of the gui.
     *
     * @para  {Number} x
     * @param {Number} y
     * @param {?MoleculeEmitter} emitterToCopy
     */
    placeEmitter(x = undefined, y = undefined, emitterToCopy = null) {
        let emitterToUse = this.guiEmitter;

        if (emitterToCopy instanceof MoleculeEmitter) {
            emitterToUse = emitterToCopy;
        }

        // If x and y are not valid. place in the middle of the vizualisation.
        if (typeof x !== 'number' && typeof y !== 'number') {
            const centerCoords = this.mlcv.getCenterCoordinates();
            x = centerCoords.x;
            y = centerCoords.y;
        }

        // Get settings of configured emitter
        // and set the coordinates.
        const state = emitterToUse.exportState();
        state.settings.x = x;
        state.settings.y = y;

        // Create new emitter based on exported settings.
        const emitter = new MoleculeEmitter(
            uniqid(),
            this.mlcv,
            state.settings
        );

        // Add emitter to the vizualisation.
        this.mlcv.addEmitter(emitter);

        // Bind some click functionality on the emitter's dragGizom.
        emitter.on('click', this.onClickEmitter.bind(this, emitter), 'dragGizmo');
    }

    toggleAnimation() {
        // Todo.
    }

    /**
     * Toggles the debug on and off.
     */
    toggleDebug() {
        this.mlcv.settings.debug = !this.mlcv.settings.debug;

        // loop over objects and turn on off
        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            const emitter = this.mlcv.moleculeEmitters[i];
            emitter.toggleDebug(this.mlcv.settings.debug);
        }
    }

    /**
     * Toggles all gizmos on and off.
     */
    toggleGizmos() {
        this.mlcv.settings.showGizmos = !this.mlcv.settings.showGizmos;

        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            const emitter = this.mlcv.moleculeEmitters[i];
            emitter.toggleGizmos(this.mlcv.settings.showGizmos);
        }
    }

    /**
     * Toggles the visibility of the reference image on and off.
     */
    toggleReferenceImage() {
        this.referenceImage.visible = !this.referenceImage.visible;
    }

    onClickEmitter(emitter) {
        if (emitter !== this.selectedEmitter) {
            // If a previous selected emitter exist we will
            // unhighlight it and remove the folder gui for
            // a clean start.
            if (this.selectedEmitter !== null) {
                this.selectedEmitter.unhighlight();
                this.gui.removeFolder(this.gui.__folders['Selected Emitter']);
            }

            // Highlight the clicked emitter.
            emitter.highlight();

            // Recreate the settings GUI for this emitter into a folder.
            const selectedEmitterFolder = this.gui.addFolder('Selected Emitter');
            this.addEmitterSettingsToFolder(selectedEmitterFolder, emitter, true);
            selectedEmitterFolder.open();

            this.selectedEmitter = emitter;
        }
    }

    /**
     * Recreate all the molecules for all emitters.
     */
    recreateMolecules() {
        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            this.mlcv.moleculeEmitters[i].initMolecules();
        }
    }

    randomizePositions() {
        for (let i = 0; i < this.mlcv.moleculeEmitters.length; i++) {
            this.mlcv.moleculeEmitters[i].randomizePositions();
        }
    }

    duplicateSelectedEmitter() {
        this.placeEmitter(undefined, undefined, this.selectedEmitter);
    }

    addEmitterSettingsToFolder(folder, emitter, placedEmitter = false) {
        if (placedEmitter === true) {
            folder.add(this, 'duplicateSelectedEmitter').name('Duplicate');
        }

        folder.add(emitter, 'id').name('ID');
        const mlcColorContr = folder.addColor(emitter.settings, 'color');
        const mlcAmountContr = folder.add(emitter.settings, 'moleculeAmount', 0, 150).step(1).name('Molecule amount');
        const spawnRadiusContr = folder.add(emitter.settings, 'spawnRadius', 0, 400).step(1).name('Spawn radius');
        const moleculeSizeContr = folder.add(emitter.settings, 'moleculeSize', 0, 500).step(1).name('Molecule Size');
        const moleculePointRadiusContr = folder.add(emitter.settings, 'moleculePointRadius', 0, 250).step(0.1).name('Point radius');
        const moleculeLineLengthScaleContr = folder.add(emitter.settings, 'moleculeLineLengthScale', 0, 100).step(1).name('Line Length (%)');
        const moleculeLineThicknessContr = folder.add(emitter.settings, 'moleculeLineThickness', 0, 100).step(0.1).name('Line thickness');
        const opacityJitterContr = folder.add(emitter.settings, 'opacityJitter', 0, 100).step(1).name('Opacity Jitter');
        const sizeJitterContr = folder.add(emitter.settings, 'sizeJitter', 0, 100).step(1).name('Size Jitter');

        if (placedEmitter === true) {
            folder.add(emitter, 'randomizePositions').name('Randomize positions');
            folder.add(emitter, 'initMolecules').name('Recreate molecules');
            folder.add(this, 'removeEmitter').name('Remove emitter');

            mlcColorContr.onChange(value => {
                emitter.setColor(value);
            });

            mlcAmountContr.onChange(value => {
                emitter.initMolecules();
            });

            spawnRadiusContr.onChange(value => {
                emitter.setSpawnRadius(value, true);
            });

            // When the spawn radius controller ends we will
            // hide gizmos if they were hidden before.
            spawnRadiusContr.onFinishChange(() => {
                if (this.mlcv.settings.showGizmos !== true) {
                    emitter.hideGizmos();
                }
            });

            moleculeSizeContr.onFinishChange(value => {
                emitter.setMoleculeSize(value);
            });

            moleculePointRadiusContr.onChange(value => {
                emitter.setMoleculePointRadius(value);
            });

            moleculeLineLengthScaleContr.onChange(value => {
                emitter.setMoleculeLineLengthScale(value);
            });

            moleculeLineThicknessContr.onChange(value => {
                emitter.setMoleculeLineThickness(value);
            });

            opacityJitterContr.onFinishChange(value => {
                emitter.setOpacityJitter(value);
            });

            sizeJitterContr.onFinishChange(value => {
                emitter.setSizeJitter(value);
            });
        }
    }

    removeEmitter() {
        this.mlcv.removeEmitter(this.selectedEmitter);
        this.selectedEmitter = null;
        this.gui.removeFolder(this.gui.__folders['Selected Emitter']);
    }

    exportState() {
        const cls = this;

        const holder = this.document.createElement('div');
        holder.setAttribute('style', [
            'height: 80%',
            'left: 50%',
            'padding: 10px',
            'position: fixed',
            'top: 50%',
            'transform: translate(-50%, -50%)',
            'width: 75%',
            'z-index: 100'
        ].join(';'));

        const closeBtn = this.document.createElement('div');
        closeBtn.setAttribute('style', [
            'background: #EEE',
            'border: 1px solid #333',
            'cursor: pointer',
            'height: 40px',
            'padding: 10px',
            'text-align: center',
            'width: 100%'
        ].join(';'));
        closeBtn.innerHTML = 'CLOSE';

        // Create textarea
        const textArea = this.document.createElement('textarea');
        textArea.setAttribute('style', [
            'height: 100%',
            'width: 100%',
        ].join(';'));

        const mlcvState = this.mlcv.exportState();

        textArea.innerHTML = '/* eslint-disable */\n';
        textArea.innerHTML += `export default ${JSON.stringify(mlcvState, undefined, 4)}`;

        holder.appendChild(closeBtn);
        holder.appendChild(textArea);
        this.document.body.appendChild(holder);

        closeBtn.onclick = function onClickCloseBtn() {
            cls.document.body.removeChild(holder);
        };
    }
}
