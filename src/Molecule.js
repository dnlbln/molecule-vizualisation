import * as PIXI from '../node_modules/pixi.js/dist/pixi';

export default class Molecule {
    constructor(mcv, x, y, radius, width) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        this.width = width;


        this.container = new PIXI.Container();

        this.container.position.set(x, y);

        this.container.rotation = Math.random() * (2 * Math.PI);

        // console.log(this.container);




        var circle = new PIXI.Graphics();
        circle.beginFill(0x000000);
        circle.drawCircle(0 + radius, 0 + radius, radius);
        circle.endFill();


        var endCircle = new PIXI.Graphics();
        endCircle.beginFill(0x000000);
        endCircle.drawCircle(width - radius, 0 + radius, radius);
        endCircle.endFill();

        const line = new PIXI.Graphics();
        // line.beginFill(0x000000);
        line.lineStyle(1, 0x00000, 1);
        line.moveTo(0, 0 + radius);
        line.lineTo(width, 0 + radius);
        // line.endFill();

        this.container.addChild(line);
        this.container.addChild(circle);
        this.container.addChild(endCircle);

        this.container.pivot.x = this.container.width / 2;
        this.container.pivot.y = this.container.height / 2;

        if (mcv.settings.debug === true) {
            const bounds = new PIXI.Graphics();
            bounds.lineStyle(1, 0xFF00FF, 1);
            bounds.drawRect(0, 0, this.container.width, this.container.height);
            this.container.addChild(bounds);
        }
    }


    render() {
        this.container.rotation -= 0.01;
    }
}