

class ticker {
    constructor(code, price) {
        this.stockcode = code;
        this.price = price;
    }
    getticketsymbol(){
        return this.stockcode;
    }
}

module.exports = ticker;
