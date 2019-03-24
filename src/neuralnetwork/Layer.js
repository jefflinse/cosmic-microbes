import _ from 'lodash';
import Neuron from './Neuron';

class Layer {

    constructor() {
        this.neurons = [];
        this.ordinal = undefined;
    }

    get size() {
        return this.neurons.length;
    }

    activate() {
        this.neurons.forEach(neuron => neuron.activate());
    }

    addNeuron() {
        let neuron = new Neuron(this);
        neuron.layer = this;
        this.neurons.push(neuron);
        this._refreshNeuronOrdinals();
        return neuron;
    }

    chooseRandomNeuron() {
        return this.size > 0 ? _.sample(this.neurons) : undefined;
    }

    projectTo(layer) {
        if (this.size === 0 || layer.size === 0) {
            return;
        }

        this.neurons.forEach(neuron => {
            layer.neurons.forEach(otherNeuron => {
                neuron.projectTo(otherNeuron);
            });
        });
    }

    _refreshNeuronOrdinals() {
        this.neurons.forEach((neuron, index) => neuron.ordinal = index);
    }
}

export default Layer;
