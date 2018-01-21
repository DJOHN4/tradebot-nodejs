/**
 * @author: Athulnath .t  <athulnath.t@gmail.com> 
 * Binance service API
 * 
 */

var request = require('request');

const BASE_SERVICE_URL = "https://api.binance.com/api/v1/";

class BinanceService 
{    
    constructor(url) 
    {
        this.URL = url; 
    }

    /**
     * get list of symbols by filtering based on pricechange percentage
     */
    getSymbolByPriceChangePercentage(symbol, minPriceChangePercentage, maxPriceChangePercentage)
    {
        return new Promise((resolve, reject) => {
            request(BASE_SERVICE_URL + 'ticker/24hr', function (error, response, data) {
                        
                    if (error) {
                        reject(error);
                    }

                    var filteredSymbols = [];

                    if (response && response.statusCode === 200) {
                        data = JSON.parse(data);
                        data.forEach(function(symbolObject) {
                            if(symbolObject.symbol.indexOf(symbol) !== -1 && 
                                symbolObject.priceChangePercent >= minPriceChangePercentage && 
                                symbolObject.priceChangePercent <= maxPriceChangePercentage) {
                                filteredSymbols.push(symbolObject);
                            }
                        }, this);  
                    }
                    resolve(filteredSymbols);
                });
        });
    }

}

module.exports = BinanceService;