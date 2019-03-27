import _ from 'lodash';
import Matter from 'matter-js';
import Network from '../neuralnetwork/Network';
import Part from './Part';
import Vector from '../Vector';

const Composite = Matter.Composite;

class Creature {

    constructor(position, partRadius, numParts = 3) {
        this.physics = Composite.create();

        this.partRadius = partRadius;
        this.parts = [];
        this.parts.concat(_.times(numParts, () => this.addPart(position, this.partRadius)));

        let mindSize = _.random(this.sensors.length, this.triggers.length);
        this.brain = new Network([this.sensors.length, mindSize, this.triggers.length]).fullyConnect();

        this.movement = 0;
    }

    get fitness() {
        return this.movement;
    }

    get position() {
        return this.parts[0].position;
    }

    get sensors() {
        return this.parts.reduce((s, part) => s.concat(part.sensors), []);
    }

    get triggers() {
        return this.parts.reduce((partTriggers, part) => {
            return partTriggers
                .concat(part.triggers)
                .concat(part.muscles.reduce((muscleTriggers, muscle) => muscleTriggers.concat(muscle.triggers), []));
        }, []);
    }

    addPart(position, radius) {
        let part;
        let muscle;
        if (this.parts.length === 0) {
            part = new Part(position, radius);
        } else {
            [part, muscle] = _.sample(this.parts).addPart();
        }

        this.parts.push(part);
        Composite.add(this.physics, part.physics);

        if (muscle) {
            Composite.add(this.physics, muscle.physics);
        }
    }

    clone() {
        let creature = new Creature(this.position.copy(), this.partRadius, this.parts.length);
        // TODO: cloning logic
        return creature;
    }

    render(graphics) {
        this.parts.forEach(part => part.render(graphics));
        // this.brain.render(graphics, new Vector(100, 100), 15, 30, 30, 4);
    }

    tick() {
        let neuralData = this.brain.activate(this.sensors.map(sensor => sensor()));
        _.times(neuralData.length, i => {
            this.triggers[i](neuralData[i]);
        });

        this.parts.forEach(part => part.tick());
        this.movement += this.parts.reduce((movement, part) => part.movement);
    }
}

export default Creature;
