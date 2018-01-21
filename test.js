var BinanceService = require('./Modules/Binance/BinanceService.js');

var binanceService = new BinanceService();

binanceService.getSymbolByPriceChangePercentage('BTC', 10, 100).then((symbols) => {
    console.log(symbols);
}).catch((err) => {
    console.log(err);
});
