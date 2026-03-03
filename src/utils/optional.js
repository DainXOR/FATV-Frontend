export class Optional {
    #value;

    constructor(value) {
        this.#value = value;
    }

    static of(newValue) {
        return new Optional(newValue);
    }
    static from(supplier) {
        try {
            return Optional.of(supplier());
        } catch (error) {
            return Optional.empty();
        }
    }
    static empty() {
        return new Optional(undefined);
    }

    get() {
        return this.#value;
    }
    
    present() {
        return  this.#value !== undefined && 
                this.#value !== null;
    }
    empty() {
        return !this.present();
    }

    ifPresent(callback) {
        if (this.present()) {
            callback(this.#value);
        }

        return this;
    }

    ifPresentOrElse(callback, elseCallback) {
        if (this.present()) {
            callback(this.#value);
        } else {
            elseCallback();
        }

        return this;
    }

    getOrDefault(other) {
        return this.present() ? this.#value : other;
    }

    getOrGenerate(supplier) {
        return this.present() ? this.#value : supplier();
    }

    transform(callback) {
        return this.present() ? Optional.of(callback(this.#value)) : Optional.empty();
    }

    transformOrDefault(callback, other) {
        return this.present() ? callback(this.#value) : other;
    }

}