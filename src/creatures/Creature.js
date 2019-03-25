import _ from 'lodash';
import Matter from 'matter-js';
import Network from '../neuralnetwork/Network';
import Part from './Part';

const Composite = Matter.Composite;

class Creature {

    constructor(position, partRadius, numParts = 3) {
        this.parts = [];
        this.physics = Composite.create();

        this.parts.concat(_.times(numParts, () => this.addPart(position, partRadius)));

        let totalSensors = this.parts.reduce((total, part) => total + part.sensors.length, 0);
        let totalTriggers = this.parts.reduce((total, part) => total + part.triggers.length, 0);
        this.brain = new Network([totalSensors, totalTriggers]).fullyConnect();
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
            Composite.add(this.physics, muscle);
        }
    }

    tick() {
        let sensors = this.parts.reduce((s, part) => s.concat(part.sensors), []);
        let triggers = this.parts.reduce((partTriggers, part) => {
            return partTriggers
                .concat(part.triggers)
                .concat(part.muscles.reduce((muscleTriggers, muscle) => muscleTriggers.concat(muscle.triggers), []));
        }, []);

        let neuralData = this.brain.activate(sensors.map(sensor => sensor()));
        for (let i = 0; i < neuralData.length; i++) {
            triggers[i](neuralData[i]);
        }

        this.parts.forEach(part => part.tick());
    }

    render(graphics) {
        this.parts.forEach(part => part.render(graphics));
        // this.brain.render(graphics, this.parts[0].physics.position, 10, 20, 20, 3);
        // this.brain.render(graphics, new Vector(100, 100), 15, 30, 30, 4);
    }
}

export default Creature;
