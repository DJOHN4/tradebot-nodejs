const config = require('./config.json');
//const request = require('request');
const binance = require('./node-binance-api');
const path = require('path');
const winston = require('winston');
const moment = require('moment');
const stock = require('./stock.js');
const ticker = require('./ticker.js');
const request = require('sync-request');
const Utils = require('./utilities.js');
var fs = require('fs');

class main {
    constructor() {

        binance.options({
            'APIKEY': config.apiKey,
            'APISECRET': config.apiSecret
        });

        this.baseUrl = config.baseUrl;
        this.priceUrl = config.priceUrl;
        this.hour24 = config.hour24;
        this.principle = Number(config.tradeParam.principle);
        this.basePrinciple = this.principle;
        this.investment = (this.principle / Number(config.tradeParam.tradeCount));
        this.oneTradeInvestment = Number(this.investment / Number(config.tradeParam.extrapolateCount));
        this.stock = null;
        this.revenue = 0.0;
        this.positionList = [];
        this.currentPrice = 0.0;
        this.tickerList = [];
        this.utils = new Utils();
    }

    starttrade() {
        var exitCounter = 0;
        var maxCount = 0;
        var sellCount = 0;

        do {
            if (sellCount > 100) {
                this.principle = this.priciple - (this.priciple * config.tradeParam.withdrawPercentage);
                sellCount = 0;
                console.log('Sellcount greater than 50 reached');
            }
            if (this.basePrinciple != this.principle && this.principle > this.basePrinciple) {
                console.log('Profit = ' + Number(this.principle - this.basePrinciple));
            }
            if (maxCount <= 4) {
                if (this.principle > 0) {
                    if (this.tickerList.length == 0) {
                        this.gettradestock(maxCount);
                    }
                    //Buy stock from market with this.oneTradeInvestment 
                    for (var iTik = this.tickerList.length - 1; iTik >= 0; --iTik) {
                        var rtnObj = this.buystock(this.tickerList[iTik].stockcode, this.oneTradeInvestment, this.tickerList[iTik].price);
                        this.stock = new stock(rtnObj.stockcode, Number(rtnObj.price), Number(rtnObj.stockcount), Number(rtnObj.totalcost));
                        this.positionList.push(this.stock);
                        this.principle = this.principle - this.stock.totalCost;
                        console.log('Bought ' + this.stock.tradeList[this.stock.index].count + ' ' +
                            this.stock.stockCode + ' for ' + this.stock.tradeList[this.stock.index].price +
                            ' price, total cost is ' + this.stock.tradeList[this.stock.index].cost);
                        maxCount++;
                        this.tickerList.splice(iTik, 1);
                    }
                } else {
                    console.log('Principle exhausted... wait untill some stocks to be sold...');
                }
            } else {
                for (var i = this.positionList.length - 1; i >= 0; --i) {
                    this.stock = this.positionList[i];
                    this.utils.waitme(20000);
                    this.currentPrice = this.getcurrentprice(this.stock.stockCode);
                    if (this.stock.isreadytosell(this.currentPrice)) {
                        // this.revenue=this.sellstock(positionList[i]);
                        console.log('Sold ' + this.stock.stockCount + ' ' +
                            this.stock.stockCode + ' for ' + this.currentPrice +
                            ' price, total revenue is ' + Number(this.stock.stockCount * this.currentPrice));
                        var pro = Number(this.stock.stockCount * this.currentPrice);
                        this.principle = this.principle + pro;//this.revenue;
                        this.positionList.splice(i, 1);
                        maxCount--;
                        sellCount++;
                    }
                    else if (this.stock.ispricedownforthistock(this.currentPrice)) {
                        if (this.principle > 0 && this.stock.index < 3) {
                            //Extrapolate stock count by buying more stocks from market to average out the position value
                            //use this.oneTradeInvestment * stock buy count to get extrapolate value
                            //binance.marketBuy(coinCode, qty);
                            //process return json and provide values to creat a new stock object
                            //this.currentPrice, this.oneTradeInvestment
                            var expInvestment = this.oneTradeInvestment * ((this.stock.index + 1) * 2);
                            var rtnObj = this.buystock(this.stock.stockCode, expInvestment, this.currentPrice);
                            this.stock.addmorestocks(rtnObj.price, rtnObj.stockcount, rtnObj.totalcost);
                            this.principle = (this.principle - Number(rtnObj.totalcost));
                            console.log('Bought more stocks ' + this.stock.tradeList[this.stock.index].count + ' ' +
                                this.stock.stockCode + ' for ' + this.stock.tradeList[this.stock.index].price +
                                ' price, total cost is ' + this.stock.tradeList[this.stock.index].cost);
                        }
                    }
                    //console.log('inside for loop');
                }
                //console.log('outside for loop');
            }
        } while (exitCounter == 0);
    }

    gettradestock(threshold) {
        //Selection logic here...

        var url = this.baseUrl + this.hour24;

        //console.log(url);
        var res = request('GET', url);
        if (!res || !res.body) throw 'allPrices error: ' + error;
        {
            try {
                var jsonObj = JSON.parse(res.body);
                // console.log(jsonObj.length);
                for (var i = 0; i < jsonObj.length; i++) {
                    if (Number(jsonObj[i].priceChangePercent) > 10 && Number(jsonObj[i].priceChangePercent) < 100) {
                        var lastThree = jsonObj[i].symbol.substr(jsonObj[i].symbol.length - 3);
                        if (lastThree === 'BTC') {
                            var tick = new ticker(jsonObj[i].symbol, jsonObj[i].lastPrice);
                            this.tickerList.push(tick);
                        }
                        if (this.tickerList.length == Number(5 - threshold))
                            break;
                    }
                }
            } catch (error) {
                console.error('Parse error: ' + error.message);
            }
        }
        // console.log(rtnObj);
        return this.tickerList;
    }
    buystock(code, amount, price) {
        //binance.marketBuy(coinCode, qty);
        //process return json and provide values to creat a new stock object
        var jsonObj = {};
        var stockCode = 'stockcode';
        var stockPrice = 'price';
        var stockCount = 'stockcount';
        var totalCost = 'totalcost';
        jsonObj[stockCode] = code;
        jsonObj[stockPrice] = price;
        jsonObj[stockCount] = amount / price;
        jsonObj[totalCost] = amount;

        return jsonObj;
    }

    getcurrentprice(code) {
        var livePrice = 0.0;
        var url = this.baseUrl + this.priceUrl + code;
        //console.log(url);
        var res = request('GET', url);
        if (!res || !res.body) throw 'current price error: ' + error;
        {
            try {
                // console.log(JSON.parse(res.body));
                livePrice = JSON.parse(res.body).price;

            } catch (error) {
                console.error('Parse error: ' + error.message);
            }
        }


        return livePrice;
    }
}

module.exports = main;
