const { create, MAINNET_CONFIG } = require('@vostokplatform/waves-api');
const nodeFetch = require('node-fetch');


// CONFIG:

// адресс ноды
const NODE_ADDRESS = 'https://obama.vostokservices.com/node-0';

// фраза для адреса с ролью contract_developer для возможности публикации и вызовов контрактов
// подробнее об управлению ролями https://docs.wavesenterprise.com/ru/1.2.2/how-to-use/role-management.html
// если будет надо - сделаем дополнительный example для работы с ролями
const seedPhrase = 'blame crunch together day upset hamster live rail nice shock federal snap skin arch swap'

// обёртка для fetch с нужной авторизацией, может быть пустой в зависимости от параметров ноды
const fetch = (url, options = {}) => nodeFetch(url, { ...options, headers: { 'x-api-key': 'vostok' }})
  .then(response => response.json());



(async function() {

  // достаём байт сети из конфига ноды
  const { chainId } = await fetch(`${NODE_ADDRESS}/node/config`);

  const initialConfiguration = {
    nodeAddress: NODE_ADDRESS,
    matcherAddress: 'https://matcher.wavesplatform.com/matcher',
    // минимальная длина сида
    minimumSeedLength: 25,
    // включаем гост криптографию
    crypto: 'gost',
    // байт сети - взяли из конфина ноды
    networkByte: chainId.charCodeAt(0),
  };

  const Waves = create({
    initialConfiguration,
    fetchInstance: fetch
  });

  const seed = Waves.Seed.fromExistingPhrase(seedPhrase);

  const result = Waves.API.Node.transactions.broadcastFromClientAddress('dockerCall', data, seed.keyPair)

})()