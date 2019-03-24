import _ from 'lodash';
import Layer from './Layer'
import Vector from '../Vector';

class Network {

    constructor(topology = []) {
        if (topology.length === 1) {
            throw new Error("Invalid topology; must contain zero or at least two layers");
        }

        this.layers = [];
        for (let l = 0; l < topology.length; l++) {
            let layer = this.addLayer();
            for (let n = 0; n < topology[l]; n++) {
                layer.addNeuron();
            }
        }

        this.inputs = this.layers[0];
        this.hidden = this.layers.slice(1, this.layers.length - 1);
        this.outputs = this.layers[this.layers.length - 1];
        
        this.connections = [];
    }

    get size() {
        return this.layers.reduce((sum, layer) => sum + layer.size);
    }

    activate(inputValues) {
        this.validate();
        if (inputValues.length !== this.inputs.size) {
            throw new Error('mismatched number of NN input values (expected ' + 
                this.inputs.size + ', got ' + inputValues.length + ')');
        }
        
        for (let i = 0; i < inputValues.length; i++) {
            this.inputs.neurons[i].value = inputValues[i];
        }

        this.layers.forEach(layer => {
            layer.activate();
        });

        return this.outputs.neurons.map(outputNeuron => outputNeuron.value);
    }

    addLayer() {
        let layer = new Layer();
        this.layers.push(layer);
        this._refreshLayerOrdinals();
        return layer;
    }

    fullyConnect() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            this.layers[i].projectTo(this.layers[i+1]);
        }

        this.updateConnectionsCache();
        return this;
    }

    addRandomConnection(chanceOfNewNeuron = 0) {

        let connection;
        let from;
        let to;
        if (Math.random() < chanceOfNewNeuron) {
            // add a new hidden neuron and connect it to either
            // a random input neuron or a random output neuron
            let hidden = this.addHiddenNeuron();
            if (Math.random() < .5) {
                from = this.inputs.chooseRandomNeuron();
                to = hidden;
            } else {
                from = hidden;
                to = this.outputs.chooseRandomNeuron();
            }
        } else {
            // choose any neuron at random, then choose a neuron from any other layer and connect them
            let layer = this.chooseRandomLayer(true);
            let otherLayer = this.chooseRandomLayer(true, [layer.ordinal]);
            let neuron = layer.chooseRandomNeuron();
            let otherNeuron = otherLayer.chooseRandomNeuron();

            if (otherLayer.ordinal > layer.ordinal) {
                from = neuron;
                to = otherNeuron;
            } else {
                from = otherNeuron;
                to = neuron;
            }
        }

        connection = from.projectTo(to);
        this.updateConnectionsCache();

        return connection;
    }

    chooseRandomLayer(mustNotBeEmpty, exclusions = []) {
        let searchSpace = this.layers;

        if (mustNotBeEmpty) {
            searchSpace = searchSpace.filter(layer => layer.size > 0);
        }

        if (exclusions !== undefined) {
            searchSpace = searchSpace.filter(layer => exclusions.indexOf(layer.ordinal) < 0);
        }

        return _.sample(searchSpace);
    }

    randomize(numConnections) {
        for (let i = 0; i < numConnections; i++) {
            this.addRandomConnection(.5);
        }

        return this;
    }

    updateConnectionsCache() {
        this.connections = this.layers.reduce(
            (layerConnections, layer) => layerConnections.concat(layer.neurons.reduce(
            (neuronConnections, neuron) => neuronConnections.concat(neuron.outputs), [])), []);
        console.log('updated connections cache (' + this.connections.length + ')');
    }

    render(graphics, position, nodeRadius, nodeDistance, layerDistance, connectionLineWeight) {
        
        // draw connections (first, so they appear behind nodes)
        for (let c = 0; c < this.connections.length; c++) {
            let fromX = this.connections[c].from.layer.ordinal;
            let fromY = this.connections[c].from.ordinal;
            let toX = this.connections[c].to.layer.ordinal;
            let toY = this.connections[c].to.ordinal;

            let pos = new Vector(position.x, position.y);
            pos.add(new Vector(nodeRadius, nodeRadius));
            let from = pos.copy().add(new Vector(
                (2 * nodeRadius + layerDistance) * fromX,
                (2 * nodeRadius + nodeDistance) * fromY));
            let to = pos.copy().add(new Vector(
                (2 * nodeRadius + layerDistance) * toX,
                (2 * nodeRadius + nodeDistance) * toY));
            graphics.drawLine(from, to, {
                lineWidth: 1 + (this.connections[c].weight * (connectionLineWeight - 1)),
                strokeStyle: '#FFFFFF',
            });
        }

        // draw nodes
        let currentPosition = new Vector(position.x + nodeRadius, position.y + nodeRadius);
        for (let l = 0; l < this.layers.length; l++) {
            for (let n = 0; n < this.layers[l].size; n++) {
                let intensity = Math.floor(256 * this.layers[l].neurons[n].value);
                let nodeColor = 'rgb(' + [intensity, intensity, intensity].join(',') + ')';
                let textColor = 'rgb(' + [255 - intensity, 255 - intensity, 255 - intensity].join(',') + ')';
                graphics.drawCircle(currentPosition, nodeRadius, {
                    lineWidth: 2,
                    strokeStyle: '#FFFFFF',
                    fillStyle: nodeColor,
                });
                graphics.writeText(currentPosition.x, currentPosition.y,
                    this.layers[l].neuronAt(n).value.toFixed(2), {
                        font: '12px sans-serif',
                        fillStyle: textColor,
                        textAlign: 'center',
                        textBaseline: 'middle',
                    });
                currentPosition.y += 2 * nodeRadius + nodeDistance;
            }
            currentPosition.y = position.y + nodeRadius;
            currentPosition.x += 2 * nodeRadius + layerDistance;
        }
    }

    validate() {
        if (this.layers.length < 2) {
            throw new Error('Invalid NN: too few layers (' + this.layers.length + ')');
        }
        else if (this.inputs.size === 0) {
            throw new Error('Invalid NN: no input neurons present');
        }
        else if (this.outputs.size === 0) {
            throw new Error('Invalid NN: no output neurons present');
        }
    }

    _refreshLayerOrdinals() {
        this.layers.forEach((layer, index) => layer.ordinal = index);
    }
}

export default Network;
