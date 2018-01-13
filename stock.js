

class stock {

    constructor(code, price, count, cost) {
        this.stockCode = code;
        this.tradeList = [];
        this.tradeList.push(new subtrade(price, count, cost));
        this.stockCount = 0;
        this.stockCount = this.stockCount + count;
        this.totalCost = 0;
        this.totalCost = this.totalCost + cost;
        this.index = 0;
    }

    addmorestocks(price, count, cost) {
        this.tradeList.push(new subtrade(price, count, cost));
        this.stockCount = this.stockCount + count;
        this.totalCost = this.totalCost + cost;
        this.index = this.index + 1;
    }

    isreadytosell(curPrice) {
        var grossRevenue = curPrice * this.stockCount;
        var revenue = grossRevenue - (grossRevenue * 0.001);
        var profit = revenue - this.totalCost;
        var forecastprofit = this.totalCost * 0.02;
        if (profit >= forecastprofit)
            return true;
        else
            return false;
    }

    ispricedownforthistock(curPrice) {
        var subObj = this.tradeList[this.index];
        var priceHike = subObj.price - (subObj.price * 0.03);
        if (curPrice <= priceHike)
            return true;
        else
            return false;
    }

}

class subtrade {

    constructor(price, count, cost) {
        this.price = price;
        this.count = count;
        this.cost = cost;
    }

}

module.exports = stock;
